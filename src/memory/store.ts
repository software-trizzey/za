import { MemoryStoreSchema } from "../schema";
import type {
	FavoriteOrder,
	MemoryStore,
	OrderResult,
	OrderSelection,
	UserMemory,
	WebsiteMemoryBucket,
} from "../types";

const MEMORY_STORE_FILE_PATH = `${import.meta.dir}/../../memory-store.json`;
const RECENT_ORDERS_LIMIT = 5;

function createEmptyMemoryStore(): MemoryStore {
	return {
		schemaVersion: 1,
		users: {},
	};
}

function createDefaultMemoryBucket(): WebsiteMemoryBucket {
	return {
		favoriteOrder: null,
		lastOrderId: null,
		recentOrders: [],
		updatedAtIso: new Date().toISOString(),
	};
}

function createDefaultUserMemory(): UserMemory {
	return {
		websiteByOrigin: {},
	};
}

function normalizeWebsiteOrigin(websiteOrigin: string): string {
	let parsedUrl: URL;

	try {
		parsedUrl = new URL(websiteOrigin);
	} catch {
		throw new Error(`Invalid website origin: ${websiteOrigin}`);
	}

	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		throw new Error(`Unsupported website origin protocol: ${parsedUrl.protocol}`);
	}

	return parsedUrl.origin;
}

function withUpdatedUserMemory(
	memoryStore: MemoryStore,
	userId: string,
	userMemory: UserMemory,
): MemoryStore {
	return {
		...memoryStore,
		users: {
			...memoryStore.users,
			[userId]: userMemory,
		},
	};
}

function upsertOrderInMemoryBucket(
	bucket: WebsiteMemoryBucket,
	orderResult: OrderResult,
	selections: OrderSelection[],
	nowIso: string,
): WebsiteMemoryBucket {
	const newSnapshot = {
		orderId: orderResult.orderId,
		selections,
		items: orderResult.items,
		totalPriceCents: orderResult.totalPriceCents,
		createdAtIso: nowIso,
	};

	const dedupedOrders = bucket.recentOrders.filter(
		(order) => order.orderId !== orderResult.orderId,
	);

	const recentOrders = [newSnapshot, ...dedupedOrders].slice(
		0,
		RECENT_ORDERS_LIMIT,
	);

	return {
		...bucket,
		lastOrderId: orderResult.orderId,
		recentOrders,
		updatedAtIso: nowIso,
	};
}

function getCurrentUserMemory(memoryStore: MemoryStore, userId: string): UserMemory {
	return memoryStore.users[userId] ?? createDefaultUserMemory();
}

async function loadMemory(): Promise<MemoryStore> {
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

async function saveMemory(memoryStore: MemoryStore): Promise<void> {
	const parsedMemoryStore = MemoryStoreSchema.parse(memoryStore);
	const serialized = JSON.stringify(parsedMemoryStore, null, 2);
	await Bun.write(MEMORY_STORE_FILE_PATH, serialized);
}

export async function getMemory(
	userId: string,
	websiteOrigin: string,
): Promise<WebsiteMemoryBucket> {
	const normalizedOrigin = normalizeWebsiteOrigin(websiteOrigin);
	const memoryStore = await loadMemory();
	const userMemory = getCurrentUserMemory(memoryStore, userId);

	return userMemory.websiteByOrigin[normalizedOrigin] ?? createDefaultMemoryBucket();
}

export async function saveFavoriteOrder(
	userId: string,
	websiteOrigin: string,
	favoriteOrder: FavoriteOrder | null,
): Promise<WebsiteMemoryBucket> {
	const normalizedOrigin = normalizeWebsiteOrigin(websiteOrigin);
	const memoryStore = await loadMemory();
	const userMemory = getCurrentUserMemory(memoryStore, userId);
	const currentBucket =
		userMemory.websiteByOrigin[normalizedOrigin] ?? createDefaultMemoryBucket();
	const updatedBucket: WebsiteMemoryBucket = {
		...currentBucket,
		favoriteOrder,
		updatedAtIso: new Date().toISOString(),
	};

	const updatedUserMemory: UserMemory = {
		...userMemory,
		websiteByOrigin: {
			...userMemory.websiteByOrigin,
			[normalizedOrigin]: updatedBucket,
		},
	};

	await saveMemory(withUpdatedUserMemory(memoryStore, userId, updatedUserMemory));
	return updatedBucket;
}

export async function recordOrder(
	userId: string,
	websiteOrigin: string,
	orderResult: OrderResult,
	selections: OrderSelection[],
): Promise<WebsiteMemoryBucket> {
	const normalizedOrigin = normalizeWebsiteOrigin(websiteOrigin);
	const memoryStore = await loadMemory();
	const userMemory = getCurrentUserMemory(memoryStore, userId);
	const currentBucket =
		userMemory.websiteByOrigin[normalizedOrigin] ?? createDefaultMemoryBucket();
	const updatedBucket = upsertOrderInMemoryBucket(
		currentBucket,
		orderResult,
		selections,
		new Date().toISOString(),
	);

	const updatedUserMemory: UserMemory = {
		...userMemory,
		websiteByOrigin: {
			...userMemory.websiteByOrigin,
			[normalizedOrigin]: updatedBucket,
		},
	};

	await saveMemory(withUpdatedUserMemory(memoryStore, userId, updatedUserMemory));
	return updatedBucket;
}
