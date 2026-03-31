import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import type { McpServerConfig } from "./config";
import { McpToolExecutionError, normalizeMcpError } from "./errors";
import {
	assertDiscoveredToolCountWithinLimit,
	evaluateMcpToolAccess,
	isMcpToolArgumentsSizeAllowed,
} from "./policies";
import { toMcpToolResponse } from "./response";
import {
	buildUnifiedToolDescriptor,
	type UnifiedTool,
} from "../tools/unified-schema";
import type { ToolProvider } from "../tools/providers/types";

export { McpToolExecutionError } from "./errors";

type ConnectedMcpServer = {
	config: McpServerConfig;
	client: Client;
	transport: StdioClientTransport;
};

function toDescriptor(params: {
	serverConfig: McpServerConfig;
	toolName: string;
	description?: string;
	inputSchema: Record<string, unknown>;
}) {
	const { serverConfig, toolName, description, inputSchema } = params;

	return buildUnifiedToolDescriptor({
		prefix: serverConfig.toolPrefix,
		toolName,
		provider: "mcp",
		description: description ?? `MCP tool from ${serverConfig.id}: ${toolName}`,
		inputSchemaJson: inputSchema,
		metadata: {
			mcpServerId: serverConfig.id,
			originalToolName: toolName,
			tags: ["mcp", serverConfig.id],
		},
	});
}


async function callToolWithPolicy(params: {
	server: ConnectedMcpServer;
	toolName: string;
	args: Record<string, unknown>;
}): Promise<unknown> {
	const { server, toolName, args } = params;

	const sizeCheck = isMcpToolArgumentsSizeAllowed(server.config, args);
	if (!sizeCheck.isAllowed) {
		throw new McpToolExecutionError(
			"validation",
			sizeCheck.reason ?? "MCP tool arguments violate policy.",
		);
	}

	const maxAttempts = server.config.maxRetries + 1;
	let latestError: McpToolExecutionError | null = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const result = await server.client.callTool(
				{
					name: toolName,
					arguments: args,
				},
				undefined,
				{ timeout: server.config.timeoutMs },
			);

			return toMcpToolResponse(result);
		} catch (error: unknown) {
			const normalizedError = normalizeMcpError(error);
			const isRetryable =
				normalizedError.kind === "timeout" ||
				normalizedError.kind === "unavailable";

			if (!isRetryable || attempt >= maxAttempts) {
				throw normalizedError;
			}

			latestError = normalizedError;
		}
	}

	throw (
		latestError ??
		new McpToolExecutionError("execution", "MCP tool call failed after retries.")
	);
}

async function listServerTools(server: ConnectedMcpServer): Promise<UnifiedTool[]> {
	const tools: UnifiedTool[] = [];
	let cursor: string | undefined;

	do {
		const response = await server.client.listTools(
			cursor === undefined ? undefined : { cursor },
			{ timeout: server.config.timeoutMs },
		);

		assertDiscoveredToolCountWithinLimit(server.config, response.tools.length);

		for (const tool of response.tools) {
			const accessCheck = evaluateMcpToolAccess(server.config, tool.name);
			if (!accessCheck.isAllowed) {
				continue;
			}

			const descriptor = toDescriptor({
				serverConfig: server.config,
				toolName: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			});

			tools.push({
				descriptor,
				execute: async (args) => {
					if (args !== null && typeof args !== "object") {
						throw new McpToolExecutionError(
							"validation",
							"MCP tool arguments must be an object.",
						);
					}

					const toolAccessCheck = evaluateMcpToolAccess(server.config, tool.name);
					if (!toolAccessCheck.isAllowed) {
						throw new McpToolExecutionError(
							"execution",
							toolAccessCheck.reason ?? "MCP tool blocked by policy.",
						);
					}

					return callToolWithPolicy({
						server,
						toolName: tool.name,
						args:
							args !== null && typeof args === "object"
								? (args as Record<string, unknown>)
								: {},
					});
				},
			});
		}

		cursor = response.nextCursor;
	} while (cursor !== undefined);

	return tools;
}

async function connectServer(config: McpServerConfig): Promise<ConnectedMcpServer> {
	const transport = new StdioClientTransport({
		command: config.command,
		args: config.args,
		env: config.env,
		cwd: process.cwd(),
	});

	const client = new Client(
		{
			name: "za-agent",
			version: "0.1.0",
		},
		{
			capabilities: {},
		},
	);

	await client.connect(transport, { timeout: config.timeoutMs });

	return {
		config,
		client,
		transport,
	};
}

export async function createMcpToolProvider(
	configs: McpServerConfig[],
): Promise<ToolProvider> {
	const servers = await Promise.all(configs.map(connectServer));

	return {
		id: "mcp",
		listTools: async () => {
			const allTools = await Promise.all(servers.map(listServerTools));
			return allTools.flat();
		},
		shutdown: async () => {
			await Promise.all(
				servers.map(async (server) => {
					await server.transport.close();
				}),
			);
		},
	};
}
