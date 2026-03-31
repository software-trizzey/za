import z from "zod";

import {
	GetMemoryArgumentsSchema,
	RecordOrderArgumentsSchema,
	SaveFavoriteOrderArgumentsSchema,
} from "../../../schema";
import { SupportedTools, type SupportedToolName, type ToolSuccessDataByName } from "../../../types";

export type ToolArgumentsByName = {
	[SupportedTools.recordOrder]: z.infer<typeof RecordOrderArgumentsSchema>;
	[SupportedTools.getMemory]: z.infer<typeof GetMemoryArgumentsSchema>;
	[SupportedTools.saveFavoriteOrder]: z.infer<
		typeof SaveFavoriteOrderArgumentsSchema
	>;
};

export type ToolDefinition<TToolName extends SupportedToolName> = {
	name: TToolName;
	description: string;
	argsSchema: z.ZodType<ToolArgumentsByName[TToolName]>;
	execute: (
		args: ToolArgumentsByName[TToolName],
	) => Promise<ToolSuccessDataByName[TToolName]>;
};
