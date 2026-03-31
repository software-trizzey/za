import z from "zod";

import {
	GetRecentOrdersArgumentsSchema,
	GetUserMemoryArgumentsSchema,
	PlaceOrderToolArgumentsSchema,
	ReadMenuToolArgumentsSchema,
	SaveFavoriteOrderArgumentsSchema,
} from "../../../schema";
import { SupportedTools, type SupportedToolName, type ToolSuccessDataByName } from "../../../types";

export type ToolArgumentsByName = {
	[SupportedTools.readMenu]: z.infer<typeof ReadMenuToolArgumentsSchema>;
	[SupportedTools.placeOrder]: z.infer<typeof PlaceOrderToolArgumentsSchema>;
	[SupportedTools.getUserMemory]: z.infer<typeof GetUserMemoryArgumentsSchema>;
	[SupportedTools.saveFavoriteOrder]: z.infer<
		typeof SaveFavoriteOrderArgumentsSchema
	>;
	[SupportedTools.getRecentOrders]: z.infer<typeof GetRecentOrdersArgumentsSchema>;
};

export type ToolDefinition<TToolName extends SupportedToolName> = {
	name: TToolName;
	description: string;
	argsSchema: z.ZodType<ToolArgumentsByName[TToolName]>;
	execute: (
		args: ToolArgumentsByName[TToolName],
	) => Promise<ToolSuccessDataByName[TToolName]>;
};
