import type { McpServerConfig } from "./config";

type ToolAccessDecision = {
	isAllowed: boolean;
	reason?: string;
};

export function evaluateMcpToolAccess(
	config: McpServerConfig,
	toolName: string,
): ToolAccessDecision {
	if (config.blockedTools.includes(toolName)) {
		return {
			isAllowed: false,
			reason: `Tool is blocked by policy: ${toolName}`,
		};
	}

	if (Array.isArray(config.allowedTools) && !config.allowedTools.includes(toolName)) {
		return {
			isAllowed: false,
			reason: `Tool is not allowlisted: ${toolName}`,
		};
	}

	return {
		isAllowed: true,
	};
}

export function isMcpToolArgumentsSizeAllowed(
	config: McpServerConfig,
	args: Record<string, unknown>,
): ToolAccessDecision {
	const serializedArgs = JSON.stringify(args);
	const argsSizeBytes = new TextEncoder().encode(serializedArgs).byteLength;

	if (argsSizeBytes > config.maxArgumentBytes) {
		return {
			isAllowed: false,
			reason: `Tool arguments too large (${argsSizeBytes} bytes). Limit is ${config.maxArgumentBytes}.`,
		};
	}

	return {
		isAllowed: true,
	};
}

export function assertDiscoveredToolCountWithinLimit(
	config: McpServerConfig,
	toolCount: number,
): void {
	if (toolCount > config.maxDiscoveredTools) {
		throw new Error(
			`MCP server ${config.id} exposed ${toolCount} tools, which exceeds the limit of ${config.maxDiscoveredTools}.`,
		);
	}
}
