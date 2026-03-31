import { getOpenAITools } from "../tools/adapters/openai";
import type { RuntimeConfig } from "../types";
import type { ActivityCallback } from "./activity";
import { deriveExecutionContext } from "./execution-context";
import { getValidToolCalls, processToolCalls } from "./helpers";

import { openAIClient } from "./providers/openai";
import { INSTRUCTIONS } from "./system-prompt";

type AgentInput = {
	prompt: string;
	user: {
		id: string;
	};
	config: RuntimeConfig;
};

type SessionRunner = {
	runTurn: (prompt: string) => Promise<string>;
	reset: () => void;
	close: () => Promise<void>;
};

const DEFAULT_MODEL = "gpt-5.4-nano";
const MISSING_WEBSITE_URL_MESSAGE =
	"Please provide a website URL (http/https) so I can find the menu and stage your order.";

function createUserMessage(prompt: string): any {
	return {
		role: "user",
		content: [{ type: "input_text", text: prompt }],
	};
}

function appendResponseOutput(history: any[], output: unknown): void {
	if (!Array.isArray(output) || output.length === 0) {
		return;
	}

	history.push(...(output as any[]));
}

export async function createSessionRunner(params: {
	userId: string;
	config: RuntimeConfig;
	onActivity?: ActivityCallback;
}): Promise<SessionRunner> {
	const tools = await getOpenAITools();
	console.log(`Found ${tools.length} tools`);
	const inputHistory: any[] = [];
	let allowedBrowserOrigin: string | null = null;

	return {
		runTurn: async (prompt: string): Promise<string> => {
			const trimmedPrompt = prompt.trim();
			if (trimmedPrompt.length === 0) {
				return "Please provide a request.";
			}

			const derivedContext = deriveExecutionContext({
				userId: params.userId,
				latestUserMessage: trimmedPrompt,
				previousAllowedBrowserOrigin: allowedBrowserOrigin,
			});
			const executionContext = derivedContext.executionContext;
			allowedBrowserOrigin = derivedContext.nextAllowedBrowserOrigin;

			if (!executionContext.allowedBrowserOrigin) {
				return MISSING_WEBSITE_URL_MESSAGE;
			}

			inputHistory.push(createUserMessage(trimmedPrompt));

			for (let turn = 0; turn < params.config.maxTurns; turn++) {
				const turnNumber = turn + 1;
				const turnStartedAtMs = Date.now();
				params.onActivity?.({
					type: "turn_started",
					turn: turnNumber,
				});

				const response = await openAIClient.responses.create({
					model: params.config.model,
					instructions: INSTRUCTIONS,
					input: inputHistory,
					tools,
				});

				appendResponseOutput(inputHistory, response.output);

				if (response.output_text) {
					params.onActivity?.({
						type: "turn_finished",
						turn: turnNumber,
						durationMs: Date.now() - turnStartedAtMs,
						outcome: "assistant_output",
					});

					return response.output_text.trim();
				}

				const toolCalls = getValidToolCalls(response.output);

				if (toolCalls.length === 0) {
					params.onActivity?.({
						type: "turn_finished",
						turn: turnNumber,
						durationMs: Date.now() - turnStartedAtMs,
						outcome: "no_output",
					});

					return "No final answer or tool call was returned.";
				}

				const results = await processToolCalls(toolCalls, executionContext, {
					turn: turnNumber,
					onActivity: params.onActivity,
				});

				params.onActivity?.({
					type: "turn_finished",
					turn: turnNumber,
					durationMs: Date.now() - turnStartedAtMs,
					outcome: "tool_calls",
				});

				if (results.length > 0) {
					inputHistory.push(
						...results.map((result) => ({
							type: "function_call_output" as const,
							call_id: result.callId,
							output: result.output,
						})),
					);
				}
			}

			return "Stopped after max steps without a final answer.";
		},
		reset: () => {
			inputHistory.length = 0;
			allowedBrowserOrigin = null;
			params.onActivity?.({
				type: "session_reset",
			});
		},
		close: async () => Promise.resolve(),
	};
}

export async function runSession(agentInput: AgentInput): Promise<string> {
	console.log("Recieved new request", agentInput);
	const runner = await createSessionRunner({
		userId: agentInput.user.id,
		config: {
			maxTurns: agentInput.config.maxTurns,
			model: agentInput.config.model,
		},
	});

	const result = await runner.runTurn(agentInput.prompt);
	await runner.close();
	return result;
}

export { DEFAULT_MODEL };
