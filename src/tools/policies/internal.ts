import { SupportedTools, type ToolExecutionFailure } from "../../types";
import { toBusinessRuleViolation } from "./helpers";
import type { UnifiedTool, UnifiedToolExecutionContext } from "../unified-schema";

function isLocalOrderingTool(tool: UnifiedTool): boolean {
	if (tool.descriptor.provider !== "local") {
		return false;
	}

	const originalToolName = tool.descriptor.metadata?.originalToolName;
	return (
		originalToolName === SupportedTools.readMenu ||
		originalToolName === SupportedTools.placeOrder
	);
}

export function evaluateInternalExecutionPolicy(
	tool: UnifiedTool,
	context: UnifiedToolExecutionContext,
): ToolExecutionFailure | null {
	if (!context.allowedBrowserOrigin) {
		return null;
	}

	if (!isLocalOrderingTool(tool)) {
		return null;
	}

	return toBusinessRuleViolation(
		tool.descriptor.name,
		"Website mode is active. Use browser automation tools for menu discovery and ordering instead of internal menu/order tools.",
	);
}
