import { input as promptInput } from "@inquirer/prompts";
import { cac } from "cac";
import c from "yoctocolors";

import type { ActivityEvent } from "./agent/activity";
import { DEFAULT_MODEL, createSessionRunner, runSession } from "./agent/session";
import { envConfig } from "./env";
import type { RuntimeConfig } from "./types";

const DEFAULT_MAX_TURNS = 10;
const SHOULD_USE_COLOR = process.stdout.isTTY && process.env.NO_COLOR === undefined;

function colorize(text: string, color: (input: string) => string): string {
	if (!SHOULD_USE_COLOR) {
		return text;
	}

	return color(text);
}

function parseMaxTurns(rawMaxTurns: unknown): number {
	if (rawMaxTurns === undefined) {
		return DEFAULT_MAX_TURNS;
	}

	const numeric =
		typeof rawMaxTurns === "number"
			? rawMaxTurns
			: Number.parseInt(String(rawMaxTurns), 10);

	if (!Number.isInteger(numeric) || numeric <= 0) {
		throw new Error(`Invalid --max-turns value: ${rawMaxTurns}`);
	}

	return numeric;
}

function resolveRuntimeConfig(options: Record<string, unknown>): RuntimeConfig {
	const maxTurns = parseMaxTurns(options.maxTurns);
	const model =
		typeof options.model === "string" && options.model.trim().length > 0
			? options.model.trim()
			: DEFAULT_MODEL;

	return {
		maxTurns,
		model,
	};
}

function getAuthenticatedUserId(): string {
	return envConfig.AUTHENTICATED_USER_ID;
}

function printReplHelp(): void {
	console.log("Commands:");
	console.log("  /help  Show REPL commands");
	console.log("  /reset Reset the current conversation");
	console.log("  /exit  Exit REPL");
}

function formatActivityEvent(event: ActivityEvent): string {
	const activityLabel = colorize("[activity]", c.gray);
	const startedLabel = colorize("started", c.yellow);
	const finishedLabel = colorize("finished", c.green);
	const failedLabel = colorize("failed", c.red);
	const durationSuffix = (durationMs: number) => colorize(`(${durationMs}ms)`, c.gray);

	if (event.type === "turn_started") {
		return `${activityLabel} ${colorize(`turn ${event.turn}`, c.cyan)} ${startedLabel}`;
	}

	if (event.type === "tool_call_started") {
		return `${activityLabel} ${colorize("tool", c.blue)} ${event.toolName} ${startedLabel}`;
	}

	if (event.type === "tool_call_finished") {
		if (event.isOkay) {
			return `${activityLabel} ${colorize("tool", c.blue)} ${event.toolName} ${finishedLabel} ${durationSuffix(event.durationMs)}`;
		}

		const codeLabel = event.failureCode ?? "UNKNOWN_ERROR";
		return `${activityLabel} ${colorize("tool", c.blue)} ${event.toolName} ${failedLabel} ${colorize(codeLabel, c.red)} ${durationSuffix(event.durationMs)}`;
	}

	if (event.type === "turn_finished") {
		return `${activityLabel} ${colorize(`turn ${event.turn}`, c.cyan)} ${finishedLabel} ${colorize(event.outcome, c.magenta)} ${durationSuffix(event.durationMs)}`;
	}

	return `${activityLabel} ${colorize("session", c.cyan)} ${colorize("reset", c.yellow)}`;
}

async function runOneShot(prompt: string, config: RuntimeConfig): Promise<void> {
	const input = {
		prompt,
		user: {
			id: getAuthenticatedUserId(),
		},
		config,
	};

	const result = await runSession(input);
	console.log(result);
}

async function runRepl(config: RuntimeConfig): Promise<void> {
	const runner = await createSessionRunner({
		userId: getAuthenticatedUserId(),
		config,
		onActivity: (event) => {
			console.log(formatActivityEvent(event));
		},
	});

	console.log("za REPL started. Type /help for commands.");

	try {
		while (true) {
			let userInput: string;

			try {
				userInput = await promptInput({
					message: ">",
				});
			} catch {
				console.log("Exiting REPL.");
				return;
			}

			const trimmed = userInput.trim();
			if (trimmed.length === 0) {
				continue;
			}

			if (trimmed === "/exit" || trimmed === ":q") {
				console.log("Exiting REPL.");
				return;
			}

			if (trimmed === "/help") {
				printReplHelp();
				continue;
			}

			if (trimmed === "/reset") {
				runner.reset();
				console.log("Session reset.");
				continue;
			}

			const response = await runner.runTurn(trimmed);
			console.log(response);
		}
	} finally {
		await runner.close();
	}
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
	const cli = cac("za");

	cli
		.option("--max-turns <maxTurns>", "Max tool/model turns per user turn")
		.option("--model <model>", "Model name override")
		.help();

	const parsed = cli.parse(argv, { run: false });
	const options = parsed.options as Record<string, unknown>;
	const args = parsed.args.map(String);

	if (options.help) {
		cli.outputHelp();
		return;
	}

	if (options.version) {
		cli.outputVersion();
		return;
	}

	const config = resolveRuntimeConfig(options);

	if (args.length === 0) {
		await runRepl(config);
		return;
	}

	if (args[0] === "repl") {
		console.log("`za` starts an interactive session. Run it with no subcommand.");
		return;
	}

	if (args[0] === "run") {
		const prompt = args.slice(1).join(" ").trim();
		if (prompt.length === 0) {
			throw new Error("Usage: za run <prompt>");
		}

		await runOneShot(prompt, config);
		return;
	}

	await runOneShot(args.join(" ").trim(), config);
}
