import {
	MENU_ITEMS,
	type WebsiteOrderRecord,
	type WebsiteOrderResultItem,
	type WebsiteOrderSelection,
} from "./data";

export type PlaceOrderRequestBody = {
	selections: WebsiteOrderSelection[];
};

export function centsToCurrency(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
	return Response.json(data, init);
}

function createOrderId(): string {
	const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
	return `ZAM-${Date.now()}-${randomSuffix}`;
}

function toOrderResultItems(
	selections: WebsiteOrderSelection[],
): WebsiteOrderResultItem[] {
	const items: WebsiteOrderResultItem[] = [];

	for (const selection of selections) {
		const menuItem = MENU_ITEMS.find((item) => item.id === selection.menuItemId);

		if (!menuItem) {
			throw new Error(`Unknown menu item: ${selection.menuItemId}`);
		}

		if (!menuItem.isAvailable) {
			throw new Error(`Menu item unavailable: ${selection.menuItemId}`);
		}

		if (!Number.isInteger(selection.quantity) || selection.quantity < 1) {
			throw new Error(`Invalid quantity for item: ${selection.menuItemId}`);
		}

		items.push({
			menuItemId: menuItem.id,
			name: menuItem.name,
			quantity: selection.quantity,
			unitPriceCents: menuItem.priceCents,
			totalPriceCents: menuItem.priceCents * selection.quantity,
		});
	}

	return items;
}

export function createOrderRecord(
	selections: WebsiteOrderSelection[],
): WebsiteOrderRecord {
	const items = toOrderResultItems(selections);
	const totalPriceCents = items.reduce(
		(sum, item) => sum + item.totalPriceCents,
		0,
	);

	return {
		orderId: createOrderId(),
		items,
		totalPriceCents,
		createdAtIso: new Date().toISOString(),
	};
}

export async function parsePlaceOrderRequest(
	req: Request,
): Promise<PlaceOrderRequestBody | null> {
	let body: unknown;

	try {
		body = await req.json();
	} catch {
		return null;
	}

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return null;
	}

	const candidate = body as Record<string, unknown>;
	if (!Array.isArray(candidate.selections)) {
		return null;
	}

	const selections: WebsiteOrderSelection[] = [];

	for (const entry of candidate.selections) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			return null;
		}

		const record = entry as Record<string, unknown>;
		if (typeof record.menuItemId !== "string") {
			return null;
		}

		if (typeof record.quantity !== "number") {
			return null;
		}

		selections.push({
			menuItemId: record.menuItemId,
			quantity: record.quantity,
		});
	}

	if (selections.length === 0) {
		return null;
	}

	return { selections };
}

export function latestOrder(orders: WebsiteOrderRecord[]): WebsiteOrderRecord | null {
	const order = orders.at(-1);
	return order ?? null;
}

export function orderById(
	orders: WebsiteOrderRecord[],
	orderId: string,
): WebsiteOrderRecord | null {
	return orders.find((order) => order.orderId === orderId) ?? null;
}
