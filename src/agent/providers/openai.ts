import OpenAI from "openai";

import { envConfig } from "../../env";

export const openAIClient = new OpenAI({
	apiKey: envConfig.OPENAI_API_KEY,
});
