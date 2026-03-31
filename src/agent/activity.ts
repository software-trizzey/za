export type ActivityEvent =
	| {
			type: "turn_started";
			turn: number;
	  }
	| {
			type: "tool_call_started";
			turn: number;
			toolName: string;
			callId: string;
	  }
	| {
			type: "tool_call_finished";
			turn: number;
			toolName: string;
			callId: string;
			isOkay: boolean;
			failureCode?: string;
			durationMs: number;
	  }
	| {
			type: "turn_finished";
			turn: number;
			durationMs: number;
			outcome: "assistant_output" | "tool_calls" | "no_output";
	  }
	| {
			type: "session_reset";
	  };

export type ActivityCallback = (event: ActivityEvent) => void;
