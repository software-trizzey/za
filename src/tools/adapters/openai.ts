import type { Tool } from "openai/resources/responses/responses.js";

import { toOpenAIToolParameters } from "./openai-schema";
import { getToolRegistry } from "../registry";

export async function getOpenAITools(): Promise<Tool[]> {
	const registry = await getToolRegistry();

	return registry.listTools().map((tool) => {
		const isMcpTool = tool.descriptor.provider === "mcp";

		return {
			type: "function",
			name: tool.descriptor.name,
			strict: !isMcpTool,
			description: tool.descriptor.description,
			parameters: toOpenAIToolParameters({
				inputSchemaJson: tool.descriptor.inputSchemaJson,
				isMcpTool,
			}),
		};
	});
}
