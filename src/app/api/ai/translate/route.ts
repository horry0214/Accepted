import { NextResponse } from "next/server";
import { z } from "zod";

import { callLlm, validateTranslationInput } from "@/lib/ai";
import { getCurrentUser } from "@/lib/data";

const translateResponseSchema = z.object({
  translation: z.string(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = validateTranslationInput(await request.json());
  const content = await callLlm({
    systemPrompt:
      "You are a bilingual academic assistant. Detect whether the source is English or Chinese and translate it into the other language. Return JSON: {\"translation\":\"...\"}.",
    userPrompt: payload.content,
  });

  if (!content) {
    return NextResponse.json(
      { error: "Translation provider is not configured yet." },
      { status: 503 },
    );
  }

  const parsed = translateResponseSchema.parse(JSON.parse(content));
  return NextResponse.json(parsed);
}
