import type {
	ResponseFunctionToolCall,
	ResponseOutputItem,
} from "openai/resources/responses/responses.js";

import type { ToolExecutionResult } from "../types";
import { executeToolCall } from "../tools/execute";
import type { UnifiedToolExecutionContext } from "../tools/unified-schema";
import type { ActivityCallback } from "./activity";

type AppToolCall = {
	kind: "tool_call";
	callId: string;
	name: string;
	arguments: string;
};

type AppToolResult = {
	kind: "tool_output";
	callId: string;
	output: string;
};

function toAppToolCall(item: ResponseFunctionToolCall): AppToolCall {
	return {
		kind: "tool_call",
		callId: item.call_id,
		name: item.name,
		arguments: item.arguments,
	};
}

export function getValidToolCalls(
	toolCalls: ResponseOutputItem[],
): AppToolCall[] {
	const providerToolCalls = toolCalls.filter(
		(item): item is ResponseFunctionToolCall => item.type === "function_call",
	);

	return providerToolCalls.map(toAppToolCall);
}

function toAppToolResult(
	callId: string,
	result: ToolExecutionResult,
): AppToolResult {
	return {
		kind: "tool_output",
		output: JSON.stringify(result),
		callId,
	};
}

export async function processToolCalls(
	toolCalls: AppToolCall[],
	context: UnifiedToolExecutionContext,
	params: {
		turn: number;
		onActivity?: ActivityCallback;
	},
): Promise<AppToolResult[]> {
	const results: AppToolResult[] = [];

	for (const call of toolCalls) {
		params.onActivity?.({
			type: "tool_call_started",
			turn: params.turn,
			toolName: call.name,
			callId: call.callId,
		});

		const startedAtMs = Date.now();
		const result: ToolExecutionResult = await executeToolCall(call, context);
		const durationMs = Date.now() - startedAtMs;

		params.onActivity?.({
			type: "tool_call_finished",
			turn: params.turn,
			toolName: call.name,
			callId: call.callId,
			isOkay: result.isOkay,
			failureCode: result.isOkay ? undefined : result.code,
			durationMs,
		});

		results.push(toAppToolResult(call.callId, result));
	}

	return results;
}
