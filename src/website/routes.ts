export const WEBSITE_ROUTES = {
	pages: {
		home: "/",
		menu: "/menu",
		confirmation: "/confirmation",
	},
	api: {
		health: "/api/health",
		menu: "/api/menu",
		orders: "/api/orders",
		latestOrder: "/api/orders/latest",
	},
} as const;
