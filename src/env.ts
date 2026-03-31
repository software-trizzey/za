import z from "zod";

export const envConfig = z
	.object({
		OPENAI_API_KEY: z.string().trim().min(1),
		AUTHENTICATED_USER_ID: z.string().uuid(),
	})
	.parse(process.env);
