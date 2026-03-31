import {
	getMemory,
	recordOrder,
} from "../../../memory/store";
import {
	GetMemoryArgumentsSchema,
	RecordOrderArgumentsSchema,
	SaveFavoriteOrderArgumentsSchema,
} from "../../../schema";
import { SupportedTools, type SupportedToolName } from "../../../types";
import { saveFavoriteOrder } from "./domain";
import type { ToolDefinition } from "./types";

export const localToolRegistry: {
	[K in SupportedToolName]: ToolDefinition<K>;
} = {
	[SupportedTools.recordOrder]: {
		name: SupportedTools.recordOrder,
		description:
			"Records a completed order in memory scoped to the active website origin.",
		argsSchema: RecordOrderArgumentsSchema,
		execute: async (args) => {
			return recordOrder(
				args.userId,
				args.websiteOrigin,
				args.orderResult,
				args.selections,
			);
		},
	},
	[SupportedTools.getMemory]: {
		name: SupportedTools.getMemory,
		description:
			"Returns recent orders and favorite order for the active website origin.",
		argsSchema: GetMemoryArgumentsSchema,
		execute: async (args) => {
			return getMemory(args.userId, args.websiteOrigin);
		},
	},
	[SupportedTools.saveFavoriteOrder]: {
		name: SupportedTools.saveFavoriteOrder,
		description:
			"Saves or clears favorite order for the active website origin.",
		argsSchema: SaveFavoriteOrderArgumentsSchema,
		execute: async (args) => {
			return saveFavoriteOrder(
				args.userId,
				args.websiteOrigin,
				args.favoriteOrder,
			);
		},
	},
};
