import { getConfiguredMcpServers } from "../mcp/config";
import { createMcpToolProvider } from "../mcp/provider";
import type { ToolProvider } from "./providers/types";
import { createLocalToolProvider } from "./providers/local";
import type { UnifiedTool } from "./unified-schema";

type ToolRegistry = {
	getToolByName: (name: string) => UnifiedTool | undefined;
	listTools: () => UnifiedTool[];
	shutdown: () => Promise<void>;
};

let cachedRegistryPromise: Promise<ToolRegistry> | null = null;

function buildNameIndex(tools: UnifiedTool[]): Map<string, UnifiedTool> {
	const index = new Map<string, UnifiedTool>();

	for (const tool of tools) {
		if (index.has(tool.descriptor.name)) {
			throw new Error(`Duplicate tool name registered: ${tool.descriptor.name}`);
		}

		index.set(tool.descriptor.name, tool);
	}

	return index;
}

async function initializeProviders(): Promise<ToolProvider[]> {
	const localProvider = createLocalToolProvider();
	const mcpServerConfigs = getConfiguredMcpServers();

	if (mcpServerConfigs.length === 0) {
		console.log("MCP: disabled (no configured servers enabled)");
		return [localProvider];
	}

	for (const config of mcpServerConfigs) {
		console.log(
			`MCP: enabling server=${config.id} prefix=${config.toolPrefix} timeoutMs=${config.timeoutMs} maxRetries=${config.maxRetries} maxArgumentBytes=${config.maxArgumentBytes} maxDiscoveredTools=${config.maxDiscoveredTools} allowedTools=${config.allowedTools === null ? "all" : config.allowedTools.length} blockedTools=${config.blockedTools.length}`,
		);
	}

	const mcpProvider = await createMcpToolProvider(mcpServerConfigs);
	return [localProvider, mcpProvider];
}

async function createToolRegistry(): Promise<ToolRegistry> {
	const providers = await initializeProviders();
	const providerTools = await Promise.all(
		providers.map((provider) => provider.listTools()),
	);
	const allTools = providerTools.flat();
	const toolsByName = buildNameIndex(allTools);

	return {
		getToolByName: (name: string) => toolsByName.get(name),
		listTools: () => [...toolsByName.values()],
		shutdown: async () => {
			await Promise.all(providers.map((provider) => provider.shutdown()));
		},
	};
}

export async function getToolRegistry(): Promise<ToolRegistry> {
	if (cachedRegistryPromise === null) {
		cachedRegistryPromise = createToolRegistry();
	}

	return cachedRegistryPromise;
}

export async function shutdownToolRegistry(): Promise<void> {
	if (cachedRegistryPromise === null) {
		return;
	}

	const registry = await cachedRegistryPromise;
	await registry.shutdown();
	cachedRegistryPromise = null;
}
