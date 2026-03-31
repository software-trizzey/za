import z from "zod";

export const OrderSelectionSchema = z.object({
	menuItemId: z.string().min(1),
	quantity: z.number().int().min(1),
});

export const OrderItemSchema = z.object({
	menuItemId: z.string(),
	name: z.string(),
	quantity: z.number().int().min(1),
	unitPriceCents: z.number().int().min(1),
	totalPriceCents: z.number().int().min(0),
});

export const OrderResultSchema = z.object({
	orderId: z.string().min(1),
	items: OrderItemSchema.array().min(1),
	totalPriceCents: z.number().int().min(1),
});

const IsoTimestampSchema = z.iso.datetime();

export const FavoriteOrderSchema = z
	.object({
		id: z.uuid(),
		label: z.string().trim().min(1).nullable(),
		selections: z.array(OrderSelectionSchema).min(1),
		createdAtIso: IsoTimestampSchema,
		updatedAtIso: IsoTimestampSchema,
		lastUsedAtIso: IsoTimestampSchema.nullable(),
	})
	.strict();

export const FavoriteOrderInputSchema = z
	.object({
		label: z.string().trim().min(1).nullable(),
		selections: z.array(OrderSelectionSchema).min(1),
	})
	.strict();

export const OrderSnapshotSchema = z
	.object({
		orderId: z.string().min(1),
		selections: z.array(OrderSelectionSchema).min(1),
		items: OrderItemSchema.array().min(1),
		totalPriceCents: z.number().int().min(1),
		createdAtIso: IsoTimestampSchema,
	})
	.strict();

export const MemoryBucketSchema = z
	.object({
		favoriteOrder: FavoriteOrderSchema.nullable(),
		lastOrderId: z.string().min(1).nullable(),
		recentOrders: z.array(OrderSnapshotSchema).max(5),
		updatedAtIso: IsoTimestampSchema,
	})
	.strict();

export const UserMemorySchema = z
	.object({
		websiteByOrigin: z
			.record(z.string().trim().min(1), MemoryBucketSchema)
			.default({}),
	})
	.strict();

export const MemoryStoreSchema = z
	.object({
		schemaVersion: z.literal(1),
		users: z.record(z.string().min(1), UserMemorySchema),
	})
	.strict();

export const RecordOrderArgumentsSchema = z
	.object({
		userId: z.string().min(1),
		websiteOrigin: z.string().min(1),
		orderResult: OrderResultSchema,
		selections: z.array(OrderSelectionSchema).min(1),
	})
	.strict();

export const GetMemoryArgumentsSchema = z
	.object({
		userId: z.string().min(1),
		websiteOrigin: z.string().min(1),
	})
	.strict();

export const SaveFavoriteOrderArgumentsSchema = z
	.object({
		userId: z.string().min(1),
		websiteOrigin: z.string().min(1),
		favoriteOrder: FavoriteOrderInputSchema.nullable(),
	})
	.strict();
