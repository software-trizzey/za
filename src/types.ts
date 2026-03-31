import z from "zod";
import {
	FavoriteOrderInputSchema,
	FavoriteOrderSchema,
	MemoryStoreSchema,
	OrderSnapshotSchema,
	OrderItemSchema,
	OrderResultSchema,
	OrderSelectionSchema,
	PizzaMenuItemSchema,
	RecentOrdersSchema,
	UserMemorySchema,
} from "./schema";

export const SupportedTools = {
	readMenu: "readMenu",
	placeOrder: "placeOrder",
	getUserMemory: "getUserMemory",
	saveFavoriteOrder: "saveFavoriteOrder",
	getRecentOrders: "getRecentOrders",
} as const;

export type RuntimeConfig = {
	maxTurns: number;
	model: string;
};


export type SupportedToolName =
	(typeof SupportedTools)[keyof typeof SupportedTools];

export type ToolSuccessDataByName = {
	[SupportedTools.readMenu]: PizzaMenuItem[];
	[SupportedTools.placeOrder]: OrderResult;
	[SupportedTools.getUserMemory]: UserMemory;
	[SupportedTools.saveFavoriteOrder]: UserMemory;
	[SupportedTools.getRecentOrders]: RecentOrders;
};

export type ToolExecutionFailureCode =
	| "INVALID_JSON"
	| "INVALID_TOOL_ARGUMENTS"
	| "TOOL_NOT_FOUND"
	| "BUSINESS_RULE_VIOLATION"
	| "TOOL_EXECUTION_FAILED"
	| "INTERNAL_ERROR";

export type UnifiedToolExecutionSuccess = {
	isOkay: true;
	toolName: string;
	data: unknown;
};

export type ToolExecutionFailure = {
	isOkay: false;
	toolName?: string;
	unknownToolName?: string;
	code: ToolExecutionFailureCode;
	message: string;
	isRetryable: boolean;
};

export type ToolExecutionResult = UnifiedToolExecutionSuccess | ToolExecutionFailure;

export type PizzaMenuItem = z.infer<typeof PizzaMenuItemSchema>;

export type OrderItem = z.infer<typeof OrderItemSchema>;

export type OrderSelection = z.infer<typeof OrderSelectionSchema>;

export type OrderResult = z.infer<typeof OrderResultSchema>;

export type OrderSnapshot = z.infer<typeof OrderSnapshotSchema>;

export type FavoriteOrder = z.infer<typeof FavoriteOrderSchema>;

export type FavoriteOrderInput = z.infer<typeof FavoriteOrderInputSchema>;

export type UserMemory = z.infer<typeof UserMemorySchema>;

export type RecentOrders = z.infer<typeof RecentOrdersSchema>;

export type MemoryStore = z.infer<typeof MemoryStoreSchema>;
