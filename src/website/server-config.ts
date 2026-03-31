const DEFAULT_WEBSITE_PORT = 3099;

function resolveWebsitePort(): number {
	const candidate = process.env.PORT;

	if (!candidate) {
		return DEFAULT_WEBSITE_PORT;
	}

	const parsed = Number.parseInt(candidate, 10);
	if (!Number.isInteger(parsed) || parsed < 1) {
		return DEFAULT_WEBSITE_PORT;
	}

	return parsed;
}

export const WEBSITE_PORT = resolveWebsitePort();
