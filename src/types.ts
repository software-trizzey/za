import z from "zod";
import {
	FavoriteOrderInputSchema,
	FavoriteOrderSchema,
	MemoryBucketSchema,
	MemoryStoreSchema,
	OrderResultSchema,
	OrderSelectionSchema,
	UserMemorySchema,
} from "./schema";

export const SupportedTools = {
	recordOrder: "recordOrder",
	getMemory: "getMemory",
	saveFavoriteOrder: "saveFavoriteOrder",
} as const;

export type RuntimeConfig = {
	maxTurns: number;
	model: string;
};


export type SupportedToolName =
	(typeof SupportedTools)[keyof typeof SupportedTools];

export type ToolSuccessDataByName = {
	[SupportedTools.recordOrder]: WebsiteMemoryBucket;
	[SupportedTools.getMemory]: WebsiteMemoryBucket;
	[SupportedTools.saveFavoriteOrder]: WebsiteMemoryBucket;
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

export type OrderSelection = z.infer<typeof OrderSelectionSchema>;

export type OrderResult = z.infer<typeof OrderResultSchema>;

export type FavoriteOrder = z.infer<typeof FavoriteOrderSchema>;

export type FavoriteOrderInput = z.infer<typeof FavoriteOrderInputSchema>;

export type UserMemory = z.infer<typeof UserMemorySchema>;

export type MemoryStore = z.infer<typeof MemoryStoreSchema>;

export type WebsiteMemoryBucket = z.infer<typeof MemoryBucketSchema>;
