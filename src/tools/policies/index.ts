import type { ToolExecutionFailure } from "../../types";
import { evaluateBrowserExecutionPolicy } from "./browser";
import { evaluateInternalExecutionPolicy } from "./internal";
import type { UnifiedTool, UnifiedToolExecutionContext } from "../unified-schema";

export function evaluateToolExecutionPolicies(
	tool: UnifiedTool,
	args: unknown,
	context: UnifiedToolExecutionContext,
): ToolExecutionFailure | null {
	const internalPolicyFailure = evaluateInternalExecutionPolicy(tool, context);
	if (internalPolicyFailure) {
		return internalPolicyFailure;
	}

	return evaluateBrowserExecutionPolicy(tool, args, context);
}
