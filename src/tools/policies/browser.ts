import type { ToolExecutionFailure } from "../../types";
import {
	normalizeOriginalToolName,
	serializeArgsForPolicy,
	toBusinessRuleViolation,
} from "./helpers";
import type { UnifiedTool, UnifiedToolExecutionContext } from "../unified-schema";

const SUBMISSION_KEYWORDS = [
	"checkout",
	"place order",
	"submit order",
	"execute order",
	"confirm order",
	"complete order",
	"order now",
	"pay",
	"purchase",
];

function isPlaywrightMcpTool(tool: UnifiedTool): boolean {
	return (
		tool.descriptor.provider === "mcp" &&
		tool.descriptor.metadata?.mcpServerId === "playwright"
	);
}

function matchesAnyToolName(toolName: string, expected: string[]): boolean {
	return expected.some(
		(candidate) => toolName === candidate || toolName.endsWith(`_${candidate}`),
	);
}

function evaluateNavigationPolicy(
	tool: UnifiedTool,
	args: unknown,
	context: UnifiedToolExecutionContext,
): ToolExecutionFailure | null {
	if (!isPlaywrightMcpTool(tool)) {
		return null;
	}

	if (!matchesAnyToolName(normalizeOriginalToolName(tool), ["navigate"])) {
		return null;
	}

	if (!context.allowedBrowserOrigin) {
		return null;
	}

	if (args === null || typeof args !== "object" || Array.isArray(args)) {
		return null;
	}

	const candidate = args as { url?: unknown };
	if (typeof candidate.url !== "string") {
		return null;
	}

	try {
		const url = new URL(candidate.url);
		if (url.origin !== context.allowedBrowserOrigin) {
			return toBusinessRuleViolation(
				tool.descriptor.name,
				`Blocked cross-domain navigation to ${url.origin}. Allowed origin: ${context.allowedBrowserOrigin}.`,
			);
		}
	} catch {
		return null;
	}

	return null;
}

function evaluateFinalSubmissionConfirmationPolicy(
	tool: UnifiedTool,
	args: unknown,
	context: UnifiedToolExecutionContext,
): ToolExecutionFailure | null {
	if (!isPlaywrightMcpTool(tool)) {
		return null;
	}

	if (context.hasExplicitOrderConfirmation) {
		return null;
	}

	const originalToolName = normalizeOriginalToolName(tool);
	if (
		!matchesAnyToolName(originalToolName, [
			"click",
			"press_key",
			"type",
			"fill_form",
			"handle_dialog",
		])
	) {
		return null;
	}

	const serializedArgs = serializeArgsForPolicy(args);
	const appearsToSubmit = SUBMISSION_KEYWORDS.some((keyword) =>
		serializedArgs.includes(keyword),
	);

	if (!appearsToSubmit) {
		return null;
	}

	return toBusinessRuleViolation(
		tool.descriptor.name,
		"Final order submission requires explicit user confirmation in a separate turn.",
	);
}

export function evaluateBrowserExecutionPolicy(
	tool: UnifiedTool,
	args: unknown,
	context: UnifiedToolExecutionContext,
): ToolExecutionFailure | null {
	const navigationFailure = evaluateNavigationPolicy(tool, args, context);
	if (navigationFailure) {
		return navigationFailure;
	}

	return evaluateFinalSubmissionConfirmationPolicy(tool, args, context);
}
