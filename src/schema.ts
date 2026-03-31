import z from "zod";

export const PizzaMenuItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	priceCents: z.number().int().min(0),
	isAvailable: z.boolean(),
});

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

export const ReadMenuToolArgumentsSchema = z.object({}).strict();

export const PlaceOrderToolArgumentsSchema = z
	.object({
		userId: z.string().min(1),
		selections: z.array(OrderSelectionSchema).min(1),
	})
	.strict();

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

export const RecentOrdersSchema = z
	.object({
		lastOrderId: z.string().min(1).nullable(),
		recentOrders: z.array(OrderSnapshotSchema).max(5),
	})
	.strict();

export const UserMemorySchema = z
	.object({
		favoriteOrder: FavoriteOrderSchema.nullable(),
		lastOrderId: z.string().min(1).nullable(),
		recentOrders: z.array(OrderSnapshotSchema).max(5),
		updatedAtIso: IsoTimestampSchema,
	})
	.strict();

export const MemoryStoreSchema = z
	.object({
		schemaVersion: z.literal(1),
		users: z.record(z.string().min(1), UserMemorySchema),
	})
	.strict();

export const GetUserMemoryArgumentsSchema = z
	.object({
		userId: z.string().min(1),
	})
	.strict();

export const SaveFavoriteOrderArgumentsSchema = z
	.object({
		userId: z.string().min(1),
		favoriteOrder: FavoriteOrderInputSchema.nullable(),
	})
	.strict();

export const GetRecentOrdersArgumentsSchema = z
	.object({
		userId: z.string().min(1),
	})
	.strict();

export const UserSchema = z.object({
	id: z.string(),
	email: z.email(),
	name: z.string(),
	favoriteOrder: FavoriteOrderSchema.nullable(),
	lastOrderId: z.string().nullable(),
	recentOrders: z.array(OrderSnapshotSchema),
	updatedAtIso: IsoTimestampSchema,
});
