import confirmationPage from "./pages/confirmation.html";
import homePage from "./pages/home.html";
import menuPage from "./pages/menu.html";
import { MENU_ITEMS, type WebsiteOrderRecord } from "./data";
import {
	centsToCurrency,
	createOrderRecord,
	jsonResponse,
	latestOrder,
	orderById,
	parsePlaceOrderRequest,
} from "./helpers";
import { WEBSITE_ROUTES } from "./routes";
import { WEBSITE_PORT } from "./server-config";

const orders: WebsiteOrderRecord[] = [];

const server = Bun.serve({
	port: WEBSITE_PORT,
	routes: {
		[WEBSITE_ROUTES.pages.home]: homePage,
		[WEBSITE_ROUTES.pages.menu]: menuPage,
		[WEBSITE_ROUTES.pages.confirmation]: confirmationPage,
		[WEBSITE_ROUTES.api.health]: () => jsonResponse({ ok: true }),
		[WEBSITE_ROUTES.api.menu]: () => jsonResponse({ menuItems: MENU_ITEMS }),
		[WEBSITE_ROUTES.api.orders]: {
			POST: async (req) => {
				const parsed = await parsePlaceOrderRequest(req);

				if (!parsed) {
					return jsonResponse(
						{
							error:
								"Expected payload: { selections: [{ menuItemId: string, quantity: number }] }",
						},
						{ status: 400 },
					);
				}

				let order: WebsiteOrderRecord;
				try {
					order = createOrderRecord(parsed.selections);
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : "Order failed";
					return jsonResponse({ error: message }, { status: 400 });
				}

				orders.push(order);

				return jsonResponse({
					...order,
					totalPriceUsd: centsToCurrency(order.totalPriceCents),
				});
			},
		},
		[WEBSITE_ROUTES.api.latestOrder]: (req) => {
			const url = new URL(req.url);
			const orderIdParam = url.searchParams.get("orderId");

			if (orderIdParam) {
				const byId = orderById(orders, orderIdParam);
				if (!byId) {
					return jsonResponse({ order: null }, { status: 404 });
				}

				return jsonResponse({
					order: {
						...byId,
						totalPriceUsd: centsToCurrency(byId.totalPriceCents),
					},
				});
			}

			const order = latestOrder(orders);
			if (!order) {
				return jsonResponse({ order: null });
			}

			return jsonResponse({
				order: {
					...order,
					totalPriceUsd: centsToCurrency(order.totalPriceCents),
				},
			});
		},
	},
	development: {
		hmr: true,
		console: true,
	},
});

console.log(`Zamino website running at ${server.url}`);
