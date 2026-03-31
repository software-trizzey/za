type ToolExecutionErrorType =
	| "validation"
	| "auth"
	| "timeout"
	| "unavailable"
	| "execution";

export class McpToolExecutionError extends Error {
	kind: ToolExecutionErrorType;

	constructor(kind: ToolExecutionErrorType, message: string) {
		super(message);
		this.name = "McpToolExecutionError";
		this.kind = kind;
	}
}

export function normalizeMcpError(error: unknown): McpToolExecutionError {
	if (error instanceof McpToolExecutionError) {
		return error;
	}

	if (!(error instanceof Error)) {
		return new McpToolExecutionError("execution", "MCP tool call failed.");
	}

	const message = error.message;
	const lowerCaseMessage = message.toLowerCase();

	if (
		lowerCaseMessage.includes("unauthorized") ||
		lowerCaseMessage.includes("forbidden") ||
		lowerCaseMessage.includes("authentication")
	) {
		return new McpToolExecutionError("auth", message);
	}

	if (lowerCaseMessage.includes("timeout")) {
		return new McpToolExecutionError("timeout", message);
	}

	if (
		lowerCaseMessage.includes("invalid") ||
		lowerCaseMessage.includes("schema") ||
		lowerCaseMessage.includes("argument")
	) {
		return new McpToolExecutionError("validation", message);
	}

	if (
		lowerCaseMessage.includes("not connected") ||
		lowerCaseMessage.includes("closed")
	) {
		return new McpToolExecutionError("unavailable", message);
	}

	return new McpToolExecutionError("execution", message);
}
