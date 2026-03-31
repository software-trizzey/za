import type { PizzaMenuItem, OrderItem, OrderSelection } from "./types";
import { PizzaMenuItemSchema } from "./schema";

function createOrderItem(menuItem: PizzaMenuItem, quantity: number): OrderItem {
	return {
		menuItemId: menuItem.id,
		name: menuItem.name,
		quantity,
		unitPriceCents: menuItem.priceCents,
		totalPriceCents: menuItem.priceCents * quantity,
	};
}

async function openMenuJSON(path: string): Promise<JSON> {
	return await Bun.file(path).json();
}

export function buildOrderItems(
	menu: PizzaMenuItem[],
	selections: OrderSelection[],
): OrderItem[] {
	return selections.map((selection) => {
		const menuItem = menu.find((item) => item.id === selection.menuItemId);

		if (!menuItem) {
			throw new Error(`Unknown menu item: ${selection.menuItemId}`);
		}

		return createOrderItem(menuItem, selection.quantity);
	});
}

export async function loadMenuItems(): Promise<PizzaMenuItem[]> {
	const rawContents = await openMenuJSON(import.meta.dir + "/../menu.json");

	return PizzaMenuItemSchema.array().parse(rawContents);
}

export function getOrderTotal(selectedItems: OrderItem[]): number {
	return selectedItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
}

export function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return "Unknown error";
}
