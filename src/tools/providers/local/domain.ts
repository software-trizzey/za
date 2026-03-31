import { saveFavoriteOrder as saveOriginFavoriteOrder } from "../../../memory/store";
import type {
	FavoriteOrder,
	FavoriteOrderInput,
	WebsiteMemoryBucket,
} from "../../../types";

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
	websiteOrigin: string,
	favoriteOrder: FavoriteOrderInput | null,
): Promise<WebsiteMemoryBucket> {
	if (favoriteOrder === null) {
		return saveOriginFavoriteOrder(userId, websiteOrigin, null);
	}

	return saveOriginFavoriteOrder(
		userId,
		websiteOrigin,
		toFavoriteOrder(favoriteOrder),
	);
}
