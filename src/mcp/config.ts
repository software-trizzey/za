import z from "zod";

export const McpServerConfigSchema = z
	.object({
		id: z.string().trim().min(1),
		transport: z.literal("stdio"),
		command: z.string().trim().min(1),
		args: z.array(z.string().trim().min(1)).default([]),
		env: z.record(z.string().trim().min(1), z.string()).default({}),
		toolPrefix: z.string().trim().min(1),
		allowedTools: z.array(z.string().trim().min(1)).nullable().default(null),
		blockedTools: z.array(z.string().trim().min(1)).default([]),
		timeoutMs: z.number().int().positive().default(15000),
		maxArgumentBytes: z.number().int().positive().default(64_000),
		maxRetries: z.number().int().min(0).max(3).default(1),
		maxDiscoveredTools: z.number().int().positive().default(200),
		enabled: z.boolean().default(true),
	})
	.strict();

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

const PLAYWRIGHT_MCP_SERVER: McpServerConfig = {
	id: "playwright",
	transport: "stdio",
	command: "bunx",
	args: ["@playwright/mcp@latest"],
	env: {},
	toolPrefix: "mcp_playwright",
	allowedTools: null,
	blockedTools: [],
	timeoutMs: 15000,
	maxArgumentBytes: 64_000,
	maxRetries: 1,
	maxDiscoveredTools: 200,
	enabled: true,
};

const McpEnvSchema = z
	.looseObject({
		MCP_PLAYWRIGHT_ENABLED: z.stringbool().default(false),
	});

export function getConfiguredMcpServers(
	env: Record<string, string | undefined> = process.env,
): McpServerConfig[] {
	const parsedEnv = McpEnvSchema.parse(env);

	const configuredServers: McpServerConfig[] = parsedEnv.MCP_PLAYWRIGHT_ENABLED
		? [PLAYWRIGHT_MCP_SERVER]
		: [];

	return configuredServers.map((server) => McpServerConfigSchema.parse(server));
}
