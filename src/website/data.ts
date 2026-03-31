export type WebsiteMenuItem = {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	isAvailable: boolean;
	category: "classic" | "specialty";
};

export type WebsiteOrderSelection = {
	menuItemId: string;
	quantity: number;
};

export type WebsiteOrderResultItem = {
	menuItemId: string;
	name: string;
	quantity: number;
	unitPriceCents: number;
	totalPriceCents: number;
};

export type WebsiteOrderRecord = {
	orderId: string;
	items: WebsiteOrderResultItem[];
	totalPriceCents: number;
	createdAtIso: string;
};

export const MENU_ITEMS: WebsiteMenuItem[] = [
	{
		id: "syntax-error",
		name: "The Syntax Error",
		description:
			"Pepperoni, Italian sausage, ham, and beef on Zamino's red marinara.",
		priceCents: 2499,
		isAvailable: true,
		category: "specialty",
	},
	{
		id: "cloud-native",
		name: "The Cloud Native",
		description:
			"Spinach, roasted peppers, mushrooms, onions, and Roma tomatoes.",
		priceCents: 2150,
		isAvailable: true,
		category: "specialty",
	},
	{
		id: "full-stack",
		name: "The Full Stack",
		description:
			"A loaded supreme with pepperoni, beef, onions, peppers, and mozzarella.",
		priceCents: 2890,
		isAvailable: true,
		category: "specialty",
	},
	{
		id: "recursive-garlic",
		name: "Recursive Garlic",
		description:
			"White garlic sauce, roasted garlic, ricotta, and herb finish.",
		priceCents: 1900,
		isAvailable: true,
		category: "classic",
	},
	{
		id: "null-pointer",
		name: "Null Pointer",
		description: "A minimalist margherita with basil, mozzarella, and olive oil.",
		priceCents: 1850,
		isAvailable: true,
		category: "classic",
	},
];
