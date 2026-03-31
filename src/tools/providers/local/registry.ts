import {
	getRecentOrders,
	getUserMemory,
	recordOrder,
} from "../../../memory/store";
import {
	GetRecentOrdersArgumentsSchema,
	GetUserMemoryArgumentsSchema,
	PlaceOrderToolArgumentsSchema,
	ReadMenuToolArgumentsSchema,
	SaveFavoriteOrderArgumentsSchema,
} from "../../../schema";
import { SupportedTools, type SupportedToolName } from "../../../types";
import { placeOrder, readMenu, saveFavoriteOrder } from "./domain";
import type { ToolDefinition } from "./types";

export const localToolRegistry: {
	[K in SupportedToolName]: ToolDefinition<K>;
} = {
	[SupportedTools.readMenu]: {
		name: SupportedTools.readMenu,
		description: "Returns the list of available pizza menu items.",
		argsSchema: ReadMenuToolArgumentsSchema,
		execute: async () => {
			const menuItems = await readMenu();
			return menuItems.filter((item) => item.isAvailable);
		},
	},
	[SupportedTools.placeOrder]: {
		name: SupportedTools.placeOrder,
		description: "Places an order for the selected menu items.",
		argsSchema: PlaceOrderToolArgumentsSchema,
		execute: async (args) => {
			const order = await placeOrder(args.selections);
			await recordOrder(args.userId, order, args.selections);
			return order;
		},
	},
	[SupportedTools.getUserMemory]: {
		name: SupportedTools.getUserMemory,
		description:
			"Returns the user's memory, including favorite order and last order ID.",
		argsSchema: GetUserMemoryArgumentsSchema,
		execute: async (args) => {
			return getUserMemory(args.userId);
		},
	},
	[SupportedTools.saveFavoriteOrder]: {
		name: SupportedTools.saveFavoriteOrder,
		description:
			"Saves or clears the user's favorite order template for future reorders.",
		argsSchema: SaveFavoriteOrderArgumentsSchema,
		execute: async (args) => {
			return saveFavoriteOrder(args.userId, args.favoriteOrder);
		},
	},
	[SupportedTools.getRecentOrders]: {
		name: SupportedTools.getRecentOrders,
		description:
			"Returns the user's recent order history, capped to the last 5 orders.",
		argsSchema: GetRecentOrdersArgumentsSchema,
		execute: async (args) => {
			return getRecentOrders(args.userId);
		},
	},
};
