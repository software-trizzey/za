import { MemoryStoreSchema } from "../schema";
import type {
	FavoriteOrder,
	MemoryStore,
	OrderResult,
	OrderSelection,
	RecentOrders,
	UserMemory,
} from "../types";

const MEMORY_STORE_FILE_PATH = `${import.meta.dir}/../../memory-store.json`;
const RECENT_ORDERS_LIMIT = 5;

function createEmptyMemoryStore(): MemoryStore {
	return {
		schemaVersion: 1,
		users: {},
	};
}

function createDefaultUserMemory(): UserMemory {
	return {
		favoriteOrder: null,
		lastOrderId: null,
		recentOrders: [],
		updatedAtIso: new Date().toISOString(),
	};
}

export async function loadMemory(): Promise<MemoryStore> {
	const file = Bun.file(MEMORY_STORE_FILE_PATH);
	const exists = await file.exists();

	if (!exists) {
		return createEmptyMemoryStore();
	}

	try {
		const rawContents = await file.json();
		const parsedMemory = MemoryStoreSchema.safeParse(rawContents);

		if (!parsedMemory.success) {
			return createEmptyMemoryStore();
		}

		return parsedMemory.data;
	} catch {
		return createEmptyMemoryStore();
	}
}

export async function saveMemory(memoryStore: MemoryStore): Promise<void> {
	const parsedMemoryStore = MemoryStoreSchema.parse(memoryStore);
	const serialized = JSON.stringify(parsedMemoryStore, null, 2);
	await Bun.write(MEMORY_STORE_FILE_PATH, serialized);
}

export async function getUserMemory(userId: string): Promise<UserMemory> {
	const memoryStore = await loadMemory();
	return memoryStore.users[userId] ?? createDefaultUserMemory();
}

export async function setFavoriteOrder(
	userId: string,
	favoriteOrder: FavoriteOrder | null,
): Promise<UserMemory> {
	const memoryStore = await loadMemory();
	const currentUserMemory =
		memoryStore.users[userId] ?? createDefaultUserMemory();

	const updatedUserMemory: UserMemory = {
		...currentUserMemory,
		favoriteOrder,
		updatedAtIso: new Date().toISOString(),
	};

	const updatedStore: MemoryStore = {
		...memoryStore,
		users: {
			...memoryStore.users,
			[userId]: updatedUserMemory,
		},
	};

	await saveMemory(updatedStore);
	return updatedUserMemory;
}

export async function getRecentOrders(userId: string): Promise<RecentOrders> {
	const userMemory = await getUserMemory(userId);

	return {
		lastOrderId: userMemory.lastOrderId,
		recentOrders: userMemory.recentOrders,
	};
}

export async function recordOrder(
	userId: string,
	orderResult: OrderResult,
	selections: OrderSelection[],
): Promise<UserMemory> {
	const memoryStore = await loadMemory();
	const currentUserMemory =
		memoryStore.users[userId] ?? createDefaultUserMemory();
	const now = new Date().toISOString();

	const newSnapshot = {
		orderId: orderResult.orderId,
		selections,
		items: orderResult.items,
		totalPriceCents: orderResult.totalPriceCents,
		createdAtIso: now,
	};

	const dedupedOrders = currentUserMemory.recentOrders.filter(
		(order) => order.orderId !== orderResult.orderId,
	);

	const recentOrders = [newSnapshot, ...dedupedOrders].slice(
		0,
		RECENT_ORDERS_LIMIT,
	);

	const updatedUserMemory: UserMemory = {
		...currentUserMemory,
		lastOrderId: orderResult.orderId,
		recentOrders,
		updatedAtIso: now,
	};

	const updatedStore: MemoryStore = {
		...memoryStore,
		users: {
			...memoryStore.users,
			[userId]: updatedUserMemory,
		},
	};

	await saveMemory(updatedStore);
	return updatedUserMemory;
}
