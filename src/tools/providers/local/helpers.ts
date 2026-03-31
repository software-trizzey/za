import z from "zod";

import { buildUnifiedToolDescriptor, type UnifiedTool } from "../../unified-schema";
import { TOOL_PREFIX } from "./constants";
import { LocalToolInputValidationError } from "./errors";
import { localToolRegistry } from "./registry";
import type { SupportedToolName } from "../../../types";

function getValidationMessage(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
		.join("; ");
}

function toDescriptor(toolName: SupportedToolName) {
	const toolDefinition = localToolRegistry[toolName];

	return buildUnifiedToolDescriptor({
		prefix: TOOL_PREFIX,
		toolName: toolDefinition.name,
		provider: "local",
		description: toolDefinition.description,
		inputSchemaJson: z.toJSONSchema(toolDefinition.argsSchema),
		metadata: {
			originalToolName: toolDefinition.name,
			tags: ["pizza"],
		},
	});
}

export function toUnifiedLocalTool<TToolName extends SupportedToolName>(
	toolName: TToolName,
): UnifiedTool {
	const descriptor = toDescriptor(toolName);
	const toolDefinition = localToolRegistry[toolName];

	return {
		descriptor,
		execute: async (args) => {
			const parsedArgs = toolDefinition.argsSchema.safeParse(args);
			if (!parsedArgs.success) {
				throw new LocalToolInputValidationError(
					getValidationMessage(parsedArgs.error),
				);
			}

			return toolDefinition.execute(parsedArgs.data);
		},
	};
}
