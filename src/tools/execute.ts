import { McpToolExecutionError } from "../mcp/provider";
import { errorMessage } from "../helpers";
import { SupportedTools, type ToolExecutionFailure, type ToolExecutionResult } from "../types";
import {
	LocalToolInputValidationError,
	isLocalToolRequiringUserId,
} from "./providers/local";
import { evaluateToolExecutionPolicies } from "./policies";
import { getToolRegistry } from "./registry";
import { toToolResultFailure, toToolResultSuccess } from "./results";
import type { UnifiedTool, UnifiedToolExecutionContext } from "./unified-schema";

type ToolCallInput = {
	name: string;
	arguments: string;
};

type ParseJSONToolArgumentsResult =
	| {
			ok: true;
			data: unknown;
	  }
	| {
			ok: false;
			failure: ToolExecutionFailure;
	  };

function parseJSONToolArguments(
	args: string,
	toolName: string,
): ParseJSONToolArgumentsResult {
	try {
		return {
			ok: true,
			data: JSON.parse(args),
		};
	} catch {
		return {
			ok: false,
			failure: toToolResultFailure({
				toolName,
				code: "INVALID_JSON",
				message: "Tool arguments must be valid JSON",
				isRetryable: true,
			}),
		};
	}
}

function enrichToolArgumentsWithContext(
	args: unknown,
	tool: UnifiedTool,
	context: UnifiedToolExecutionContext,
): unknown {
	if (tool.descriptor.provider !== "local") {
		return args;
	}

	const originalToolName = tool.descriptor.metadata?.originalToolName;
	if (
		typeof originalToolName !== "string" ||
		!isLocalToolRequiringUserId(originalToolName)
	) {
		return args;
	}

	if (args !== null && typeof args === "object" && !Array.isArray(args)) {
		return {
			...(args as Record<string, unknown>),
			userId: context.userId,
		};
	}

	return { userId: context.userId };
}

function toExecutionFailure(tool: UnifiedTool, error: unknown): ToolExecutionFailure {
	if (error instanceof LocalToolInputValidationError) {
		return toToolResultFailure({
			toolName: tool.descriptor.name,
			code: "INVALID_TOOL_ARGUMENTS",
			isRetryable: true,
			message: error.message,
		});
	}

	if (error instanceof McpToolExecutionError) {
		if (error.kind === "validation") {
			return toToolResultFailure({
				toolName: tool.descriptor.name,
				code: "INVALID_TOOL_ARGUMENTS",
				isRetryable: true,
				message: error.message,
			});
		}

		const isRetryable = error.kind !== "auth";
		return toToolResultFailure({
			toolName: tool.descriptor.name,
			code: "TOOL_EXECUTION_FAILED",
			isRetryable,
			message: error.message,
		});
	}

	const message = errorMessage(error);

	if (
		(tool.descriptor.metadata?.originalToolName === SupportedTools.placeOrder ||
			tool.descriptor.metadata?.originalToolName ===
				SupportedTools.saveFavoriteOrder) &&
		message.startsWith("Unknown menu item: ")
	) {
		return toToolResultFailure({
			toolName: tool.descriptor.name,
			code: "BUSINESS_RULE_VIOLATION",
			isRetryable: false,
			message,
		});
	}

	return toToolResultFailure({
		toolName: tool.descriptor.name,
		code: "TOOL_EXECUTION_FAILED",
		isRetryable: true,
		message,
	});
}

export async function executeToolCall(
	call: ToolCallInput,
	context: UnifiedToolExecutionContext,
): Promise<ToolExecutionResult> {
	const registry = await getToolRegistry();
	const tool = registry.getToolByName(call.name);

	if (!tool) {
		return toToolResultFailure({
			toolName: "unknown",
			unknownToolName: call.name,
			code: "TOOL_NOT_FOUND",
			message: `Unsupported tool: ${call.name}`,
			isRetryable: false,
		});
	}

	const parsedJSON = parseJSONToolArguments(call.arguments, tool.descriptor.name);
	if (!parsedJSON.ok) {
		return parsedJSON.failure;
	}

	const enrichedArgs = enrichToolArgumentsWithContext(parsedJSON.data, tool, context);
	const policyFailure = evaluateToolExecutionPolicies(tool, enrichedArgs, context);
	if (policyFailure) {
		return policyFailure;
	}

	try {
		const data = await tool.execute(enrichedArgs, context);
		return toToolResultSuccess(tool.descriptor.name, data);
	} catch (error: unknown) {
		return toExecutionFailure(tool, error);
	}
}
