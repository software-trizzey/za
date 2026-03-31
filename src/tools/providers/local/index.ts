import type { ToolProvider } from "../types";
import { TOOL_PREFIX, orderedLocalToolNames } from "./constants";
import { toUnifiedLocalTool } from "./helpers";

export { LocalToolInputValidationError } from "./errors";
export {
	isLocalToolRequiringUserId,
	isLocalToolRequiringWebsiteOrigin,
} from "./constants";

export function createLocalToolProvider(): ToolProvider {
	return {
		id: TOOL_PREFIX,
		listTools: async () => orderedLocalToolNames.map(toUnifiedLocalTool),
		shutdown: async () => Promise.resolve(),
	};
}
