import type { ToolExecutionFailure } from "../../types";
import { toToolResultFailure } from "../results";
import type { UnifiedTool } from "../unified-schema";

export function toBusinessRuleViolation(
	toolName: string,
	message: string,
): ToolExecutionFailure {
	return toToolResultFailure({
		toolName,
		code: "BUSINESS_RULE_VIOLATION",
		isRetryable: false,
		message,
	});
}

export function serializeArgsForPolicy(args: unknown): string {
	try {
		return JSON.stringify(args).toLowerCase();
	} catch {
		return "";
	}
}

export function normalizeOriginalToolName(tool: UnifiedTool): string {
	return tool.descriptor.metadata?.originalToolName?.toLowerCase() ?? "";
}
