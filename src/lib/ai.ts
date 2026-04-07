import { z } from "zod";

const translateSchema = z.object({
  content: z.string().min(1),
});

const routePlanSchema = z.object({
  abstractText: z.string().min(20),
  conferences: z.array(
    z.object({
      name: z.string(),
      fullName: z.string(),
      rank: z.string(),
      coreRank: z.string().nullable(),
      category: z.string(),
      subcategories: z.array(z.string()),
      deadline: z.string().nullable(),
    }),
  ),
});

function getProviderConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.MINIMAX_API_KEY;
  const endpoint =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.OPENROUTER_MODEL ?? process.env.MINIMAX_MODEL ?? "";

  return {
    apiKey,
    endpoint,
    model,
  };
}

export function validateTranslationInput(payload: unknown) {
  return translateSchema.parse(payload);
}

export function validateRoutePlanInput(payload: unknown) {
  return routePlanSchema.parse(payload);
}

export async function callLlm({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}) {
  const config = getProviderConfig();

  if (!config.apiKey || !config.model) {
    return null;
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...(process.env.OPENROUTER_API_KEY
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
            "X-Title": "Accepted",
          }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("LLM provider request failed");
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content as string | undefined;
}
