import { buildOrderItems, getOrderTotal, loadMenuItems } from "../../../helpers";
import { setFavoriteOrder } from "../../../memory/store";
import type {
	FavoriteOrder,
	FavoriteOrderInput,
	OrderResult,
	OrderSelection,
	PizzaMenuItem,
	UserMemory,
} from "../../../types";

export async function readMenu(): Promise<PizzaMenuItem[]> {
	const menu = await loadMenuItems();
	return menu;
}

export async function placeOrder(selections: OrderSelection[]): Promise<OrderResult> {
	const menuItems = await readMenu();
	const selectedItems = buildOrderItems(menuItems, selections);

	return {
		orderId: crypto.randomUUID(),
		items: selectedItems,
		totalPriceCents: getOrderTotal(selectedItems),
	};
}

function toFavoriteOrder(input: FavoriteOrderInput): FavoriteOrder {
	const now = new Date().toISOString();

	return {
		id: crypto.randomUUID(),
		label: input.label,
		selections: input.selections,
		createdAtIso: now,
		updatedAtIso: now,
		lastUsedAtIso: null,
	};
}

export async function saveFavoriteOrder(
	userId: string,
	favoriteOrder: FavoriteOrderInput | null,
): Promise<UserMemory> {
	if (favoriteOrder === null) {
		return setFavoriteOrder(userId, null);
	}

	const menuItems = await readMenu();
	buildOrderItems(menuItems, favoriteOrder.selections);

	return setFavoriteOrder(userId, toFavoriteOrder(favoriteOrder));
}
