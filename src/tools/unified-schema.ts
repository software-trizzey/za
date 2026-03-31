import z from "zod";

export const UnifiedToolProviderSchema = z.enum(["local", "mcp"]);
export type UnifiedToolProvider = z.infer<typeof UnifiedToolProviderSchema>;

export const UnifiedToolMetadataSchema = z
	.object({
		mcpServerId: z.string().trim().min(1).optional(),
		originalToolName: z.string().trim().min(1).optional(),
		tags: z.array(z.string().trim().min(1)).optional(),
	})
	.strict();

export const UnifiedToolDescriptorSchema = z
	.object({
		id: z.string().trim().min(1),
		name: z.string().trim().min(1),
		provider: UnifiedToolProviderSchema,
		description: z.string().trim().min(1),
		inputSchemaJson: z.record(z.string(), z.unknown()),
		metadata: UnifiedToolMetadataSchema.optional(),
	})
	.strict();

export type UnifiedToolDescriptor = z.infer<typeof UnifiedToolDescriptorSchema>;

export type UnifiedToolExecutionContext = {
	userId: string;
	latestUserMessage?: string;
	hasExplicitOrderConfirmation?: boolean;
	allowedBrowserOrigin?: string | null;
};

export type UnifiedTool = {
	descriptor: UnifiedToolDescriptor;
	execute: (
		args: unknown,
		context: UnifiedToolExecutionContext,
	) => Promise<unknown>;
};

function normalizeToolNameSegment(segment: string): string {
	return segment.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
}

export function toPrefixedToolName(prefix: string, toolName: string): string {
	const normalizedPrefix = normalizeToolNameSegment(prefix);
	const normalizedToolName = normalizeToolNameSegment(toolName);
	return `${normalizedPrefix}_${normalizedToolName}`;
}

export function buildUnifiedToolDescriptor(params: {
	prefix: string;
	toolName: string;
	provider: UnifiedToolProvider;
	description: string;
	inputSchemaJson: Record<string, unknown>;
	metadata?: UnifiedToolDescriptor["metadata"];
}): UnifiedToolDescriptor {
	const prefixedToolName = toPrefixedToolName(params.prefix, params.toolName);

	return UnifiedToolDescriptorSchema.parse({
		id: prefixedToolName,
		name: prefixedToolName,
		provider: params.provider,
		description: params.description,
		inputSchemaJson: params.inputSchemaJson,
		metadata: params.metadata,
	});
}
