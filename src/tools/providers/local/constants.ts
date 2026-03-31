import { SupportedTools, type SupportedToolName } from "../../../types";

export const TOOL_PREFIX = "internal";

export const orderedLocalToolNames: SupportedToolName[] = [
	SupportedTools.readMenu,
	SupportedTools.placeOrder,
	SupportedTools.getUserMemory,
	SupportedTools.saveFavoriteOrder,
	SupportedTools.getRecentOrders,
];

export const LOCAL_TOOLS_REQUIRING_USER_ID = new Set<SupportedToolName>([
	SupportedTools.placeOrder,
	SupportedTools.getUserMemory,
	SupportedTools.saveFavoriteOrder,
	SupportedTools.getRecentOrders,
]);

export function isLocalToolRequiringUserId(
	toolName: string,
): toolName is SupportedToolName {
	return LOCAL_TOOLS_REQUIRING_USER_ID.has(toolName as SupportedToolName);
}
