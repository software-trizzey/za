import { McpToolExecutionError } from "./errors";

function isTextContentItem(item: unknown): item is { type: "text"; text: string } {
	if (item === null || typeof item !== "object") {
		return false;
	}

	const candidate = item as { type?: unknown; text?: unknown };
	return candidate.type === "text" && typeof candidate.text === "string";
}

function extractTextContent(content: unknown): string {
	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.filter(isTextContentItem)
		.map((item) => item.text.trim())
		.filter((text) => text.length > 0)
		.join(" ");
}

export function toMcpToolResponse(result: unknown): unknown {
	if (result === null || typeof result !== "object") {
		return result;
	}

	const response = result as {
		content?: unknown;
		isError?: boolean;
		structuredContent?: unknown;
		toolResult?: unknown;
	};

	if ("toolResult" in response) {
		return response.toolResult;
	}

	if (response.isError) {
		const text = extractTextContent(response.content);

		throw new McpToolExecutionError(
			"execution",
			text.length > 0 ? text : "MCP tool call returned an error response.",
		);
	}

	if (response.structuredContent !== undefined) {
		return response.structuredContent;
	}

	return {
		content: response.content ?? [],
	};
}
