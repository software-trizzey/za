#!/usr/bin/env bun

import { runCli } from "./cli";
import { shutdownToolRegistry } from "./tools/registry";

let isShuttingDown = false;

async function shutdownResources(reason: string): Promise<void> {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;

	try {
		await shutdownToolRegistry();
	} catch (error: unknown) {
		console.error(`Failed to shutdown tool registry (${reason})`, error);
	}
}

function registerShutdownHandlers(): void {
	const shutdownSignals = ["SIGINT", "SIGTERM"] as const;

	for (const signal of shutdownSignals) {
		process.once(signal, () => {
			void (async () => {
				await shutdownResources(signal);
				process.exit(0);
			})();
		});
	}
}

async function main(): Promise<void> {
	registerShutdownHandlers();

	try {
		await runCli();
	} finally {
		await shutdownResources("main");
	}
}

main().catch((error: unknown) => {
	console.error("Fatal error", error);
	void shutdownResources("fatal").finally(() => {
		process.exit(1);
	});
});
