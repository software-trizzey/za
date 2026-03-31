import type { UnifiedToolExecutionContext } from "../tools/unified-schema";

const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const EXPLICIT_CONFIRMATION_PATTERN =
	/\b(confirm( and submit)?|submit( the)? order|place (the )?order|yes[, ]?place it|go ahead and submit|proceed with submission)\b/i;

type DeriveExecutionContextInput = {
	userId: string;
	latestUserMessage: string;
	previousAllowedBrowserOrigin: string | null;
};

type DeriveExecutionContextResult = {
	executionContext: UnifiedToolExecutionContext;
	nextAllowedBrowserOrigin: string | null;
};

function extractFirstOriginFromText(text: string): string | null {
	const matches = text.match(URL_PATTERN);
	if (!matches || matches.length === 0) {
		return null;
	}

	for (const match of matches) {
		try {
			const url = new URL(match);
			return url.origin;
		} catch {
			continue;
		}
	}

	return null;
}

function hasExplicitOrderConfirmation(text: string): boolean {
	return EXPLICIT_CONFIRMATION_PATTERN.test(text);
}

export function deriveExecutionContext(
	input: DeriveExecutionContextInput,
): DeriveExecutionContextResult {
	const discoveredOrigin = extractFirstOriginFromText(input.latestUserMessage);
	const nextAllowedBrowserOrigin =
		discoveredOrigin ?? input.previousAllowedBrowserOrigin;

	return {
		executionContext: {
			userId: input.userId,
			latestUserMessage: input.latestUserMessage,
			hasExplicitOrderConfirmation: hasExplicitOrderConfirmation(
				input.latestUserMessage,
			),
			allowedBrowserOrigin: nextAllowedBrowserOrigin,
		},
		nextAllowedBrowserOrigin,
	};
}
