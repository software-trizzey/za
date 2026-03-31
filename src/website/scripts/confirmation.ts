import { WEBSITE_ROUTES } from "../routes";
import type { WebsiteOrderRecord } from "../data";

type WebsiteOrderSummary = WebsiteOrderRecord & {
	totalPriceUsd: string;
};

type LatestOrderResponse = {
	order: WebsiteOrderSummary | null;
};

function getRequiredNode<TNode extends HTMLElement>(id: string): TNode {
	const node = document.getElementById(id);
	if (!node) {
		throw new Error(`Expected node ${id} to exist`);
	}

	return node as TNode;
}

const orderIdNode = getRequiredNode<HTMLElement>("order-confirmation-id");
const metaNode = getRequiredNode<HTMLElement>("order-confirmation-meta");
const notificationNode = getRequiredNode<HTMLElement>(
	"website-order-notification",
);

function renderNoOrder(): void {
	orderIdNode.textContent = "No order yet";
	metaNode.innerHTML = "<p class='status'>Place an order from the menu page first.</p>";
	notificationNode.textContent = "No website order notification has been emitted yet.";
}

function renderOrder(order: WebsiteOrderSummary): void {
	orderIdNode.textContent = order.orderId;
	metaNode.innerHTML =
		`<p><strong>Total:</strong> ${order.totalPriceUsd}</p>` +
		`<p><strong>Placed:</strong> ${new Date(order.createdAtIso).toLocaleString()}</p>` +
		`<p><strong>Items:</strong></p>` +
		`<ul>${order.items
			.map((item) => `<li>${item.name} x${item.quantity}</li>`)
			.join("")}</ul>`;

	notificationNode.textContent =
		`Notification sent: order ${order.orderId} accepted by Zamino's website.`;
}

function latestOrderUrl(): string {
	const url = new URL(window.location.href);
	const orderId = url.searchParams.get("orderId");

	if (orderId) {
		return `${WEBSITE_ROUTES.api.latestOrder}?orderId=${encodeURIComponent(orderId)}`;
	}

	return WEBSITE_ROUTES.api.latestOrder;
}

async function loadLatestOrder(): Promise<void> {
	const response = await fetch(latestOrderUrl());

	if (response.status === 404) {
		renderNoOrder();
		return;
	}

	if (!response.ok) {
		throw new Error(`Failed to load confirmation (${response.status})`);
	}

	const payload = (await response.json()) as LatestOrderResponse;
	if (!payload.order) {
		renderNoOrder();
		return;
	}

	renderOrder(payload.order);
}

void loadLatestOrder().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : "Failed to load order";
	orderIdNode.textContent = "Error";
	metaNode.innerHTML = `<p class='status error'>${message}</p>`;
	notificationNode.textContent = "Website notification unavailable.";
});
