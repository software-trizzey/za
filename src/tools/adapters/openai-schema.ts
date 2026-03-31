function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeMcpObjectSchema(schema: Record<string, unknown>): Record<string, unknown> {
	const normalized: Record<string, unknown> = {
		...schema,
	};

	if (normalized.type !== "object") {
		normalized.type = "object";
	}

	if (!isRecord(normalized.properties)) {
		normalized.properties = {};
	}

	if (!Array.isArray(normalized.required)) {
		normalized.required = [];
	}

	return normalized;
}

export function toOpenAIToolParameters(params: {
	inputSchemaJson: Record<string, unknown>;
	isMcpTool: boolean;
}): Record<string, unknown> {
	if (!params.isMcpTool) {
		return params.inputSchemaJson;
	}

	return normalizeMcpObjectSchema(params.inputSchemaJson);
}
