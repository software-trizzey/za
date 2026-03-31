import { SupportedTools, type SupportedToolName } from "../../../types";

export const TOOL_PREFIX = "internal";

export const orderedLocalToolNames: SupportedToolName[] = [
	SupportedTools.recordOrder,
	SupportedTools.getMemory,
	SupportedTools.saveFavoriteOrder,
];

export const LOCAL_TOOLS_REQUIRING_USER_ID = new Set<SupportedToolName>([
	SupportedTools.recordOrder,
	SupportedTools.getMemory,
	SupportedTools.saveFavoriteOrder,
]);

export const LOCAL_TOOLS_REQUIRING_WEBSITE_ORIGIN =
	new Set<SupportedToolName>([
		SupportedTools.recordOrder,
		SupportedTools.getMemory,
		SupportedTools.saveFavoriteOrder,
	]);

export function isLocalToolRequiringUserId(
	toolName: string,
): toolName is SupportedToolName {
	return LOCAL_TOOLS_REQUIRING_USER_ID.has(toolName as SupportedToolName);
}

export function isLocalToolRequiringWebsiteOrigin(
	toolName: string,
): toolName is SupportedToolName {
	return LOCAL_TOOLS_REQUIRING_WEBSITE_ORIGIN.has(toolName as SupportedToolName);
}
