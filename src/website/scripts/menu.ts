import { WEBSITE_ROUTES } from "../routes";

type WebsiteMenuItem = {
	id: string;
	name: string;
	description: string;
	priceCents: number;
	isAvailable: boolean;
	category: "classic" | "specialty";
};

type MenuResponse = {
	menuItems: WebsiteMenuItem[];
};

type CartLine = {
	menuItemId: string;
	name: string;
	quantity: number;
	unitPriceCents: number;
};

type PlaceOrderResponse = {
	orderId: string;
};

function getRequiredNode<TNode extends HTMLElement>(id: string): TNode {
	const node = document.getElementById(id);
	if (!node) {
		throw new Error(`Expected node ${id} to exist`);
	}

	return node as TNode;
}

const menuGrid = getRequiredNode<HTMLElement>("menu-grid");
const cartItems = getRequiredNode<HTMLElement>("cart-items");
const cartTotal = getRequiredNode<HTMLElement>("cart-total");
const cartStatus = getRequiredNode<HTMLElement>("cart-status");
const checkoutButton = getRequiredNode<HTMLButtonElement>("checkout-button");
const cartCountBadge = document.querySelector<HTMLElement>(
	"[data-testid='cart-count-badge']",
);

const cart = new Map<string, CartLine>();

function centsToUsd(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

function totalItemCount(): number {
	let count = 0;
	for (const line of cart.values()) {
		count += line.quantity;
	}
	return count;
}

function totalPriceCents(): number {
	let sum = 0;
	for (const line of cart.values()) {
		sum += line.unitPriceCents * line.quantity;
	}
	return sum;
}

function renderCart(): void {
	const lines = Array.from(cart.values());

	if (lines.length === 0) {
		cartItems.innerHTML = "<p class='status'>Cart is empty.</p>";
	} else {
		cartItems.innerHTML = lines
			.map(
				(line) =>
					`<div class="cart-row" data-testid="cart-item-row" data-menu-item-id="${line.menuItemId}">` +
					`<span>${line.name} x${line.quantity}</span><strong>${centsToUsd(
						line.unitPriceCents * line.quantity,
					)}</strong>` +
					"</div>",
			)
			.join("");
	}

	cartTotal.textContent = centsToUsd(totalPriceCents());
	if (cartCountBadge) {
		cartCountBadge.textContent = String(totalItemCount());
	}
}

function setStatus(message: string, isError: boolean): void {
	cartStatus.textContent = message;
	cartStatus.classList.toggle("error", isError);
}

function createMenuCard(item: WebsiteMenuItem): HTMLElement {
	const card = document.createElement("article");
	card.className = "menu-card";
	card.dataset.testid = "menu-item-card";
	card.dataset.menuItemId = item.id;
	card.setAttribute("data-testid", "menu-item-card");

	const quantityInputId = `menu-item-quantity-input-${item.id}`;
	const addButtonId = `menu-item-order-button-${item.id}`;

	card.innerHTML =
		`<div class="menu-meta">${item.category}</div>` +
		`<h2 data-testid="menu-item-name">${item.name}</h2>` +
		`<p class="menu-description">${item.description}</p>` +
		`<div class="menu-price" data-testid="menu-item-price" data-price-cents="${item.priceCents}">${centsToUsd(item.priceCents)}</div>` +
		"<div class='order-controls'>" +
		`<input id="${quantityInputId}" class="input" data-testid="${quantityInputId}" type="number" min="1" value="1" />` +
		`<button id="${addButtonId}" data-testid="${addButtonId}" class="button button-secondary">Add</button>` +
		"</div>";

	const quantityInput = card.querySelector(`#${quantityInputId}`);
	const addButton = card.querySelector(`#${addButtonId}`);

	if (!quantityInput || !addButton) {
		throw new Error(`Missing controls for menu item ${item.id}`);
	}

	addButton.addEventListener("click", () => {
		const quantity = Number.parseInt((quantityInput as HTMLInputElement).value, 10);

		if (!Number.isInteger(quantity) || quantity < 1) {
			setStatus(`Invalid quantity for ${item.name}.`, true);
			return;
		}

		const existing = cart.get(item.id);
		if (existing) {
			existing.quantity += quantity;
		} else {
			cart.set(item.id, {
				menuItemId: item.id,
				name: item.name,
				quantity,
				unitPriceCents: item.priceCents,
			});
		}

		setStatus(`Added ${quantity} x ${item.name} to cart.`, false);
		renderCart();
	});

	return card;
}

async function loadMenuItems(): Promise<WebsiteMenuItem[]> {
	const response = await fetch(WEBSITE_ROUTES.api.menu);
	if (!response.ok) {
		throw new Error(`Failed to load menu (${response.status})`);
	}

	const body = (await response.json()) as MenuResponse;
	return body.menuItems.filter((item) => item.isAvailable);
}

async function checkout(): Promise<void> {
	if (cart.size === 0) {
		setStatus("Add at least one pizza before checkout.", true);
		return;
	}

	setStatus("Submitting order...", false);
	checkoutButton.setAttribute("disabled", "true");

	try {
		const selections = Array.from(cart.values()).map((line) => ({
			menuItemId: line.menuItemId,
			quantity: line.quantity,
		}));

		const response = await fetch(WEBSITE_ROUTES.api.orders, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ selections }),
		});

		if (!response.ok) {
			const body = (await response.json()) as { error?: string };
			throw new Error(body.error ?? `Checkout failed (${response.status})`);
		}

		const body = (await response.json()) as PlaceOrderResponse;
		window.location.href = `/confirmation?orderId=${encodeURIComponent(body.orderId)}`;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Checkout failed";
		setStatus(message, true);
		checkoutButton.removeAttribute("disabled");
	}
}

async function main(): Promise<void> {
	setStatus("Loading menu...", false);

	try {
		const menuItems = await loadMenuItems();
		menuGrid.innerHTML = "";

		for (const item of menuItems) {
			menuGrid.append(createMenuCard(item));
		}

		setStatus("Menu loaded. Add items to cart.", false);
		renderCart();
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to load menu";
		setStatus(message, true);
	}

	checkoutButton.addEventListener("click", () => {
		void checkout();
	});
}

void main();
