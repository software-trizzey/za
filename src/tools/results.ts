import type {
	UnifiedToolExecutionSuccess,
	ToolExecutionFailure,
} from "../types";

export function toToolResultSuccess(
	toolName: string,
	data: unknown,
): UnifiedToolExecutionSuccess {
	return {
		isOkay: true,
		toolName,
		data,
	};
}

export function toToolResultFailure(params: {
	toolName: string;
	code: ToolExecutionFailure["code"];
	message: string;
	isRetryable: boolean;
	unknownToolName?: string;
}): ToolExecutionFailure {
	const baseFailure: ToolExecutionFailure = {
		isOkay: false,
		toolName: params.toolName,
		code: params.code,
		message: params.message,
		isRetryable: params.isRetryable,
	};

	if (params.toolName === "unknown") {
		return {
			...baseFailure,
			unknownToolName: params.unknownToolName,
		};
	}

	return baseFailure;
}
