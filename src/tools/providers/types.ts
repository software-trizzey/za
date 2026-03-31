import type { UnifiedTool } from "../unified-schema";

export interface ToolProvider {
	readonly id: string;
	listTools(): Promise<UnifiedTool[]>;
	shutdown(): Promise<void>;
}
