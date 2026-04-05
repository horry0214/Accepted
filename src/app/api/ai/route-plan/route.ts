import { NextResponse } from "next/server";
import { z } from "zod";

import { callLlm, validateRoutePlanInput } from "@/lib/ai";
import { getCurrentUser } from "@/lib/data";

const routeResponseSchema = z.object({
  primaryTarget: z.string(),
  rationale: z.string(),
  fallbackTargets: z.array(z.string()),
  timelineAdvice: z.array(z.string()),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = validateRoutePlanInput(await request.json());
  const conferenceSummary = payload.conferences
    .map(
      (conference) =>
        `${conference.name} | ${conference.rank} | ${conference.category} | ${conference.subcategories.join(", ")} | ${conference.nextDeadline ?? "TBD"}`,
    )
    .join("\n");

  const content = await callLlm({
    systemPrompt:
      "You are an academic submission strategist for CCF computer science conferences. Match the abstract to the most relevant venue and provide a practical fallback path. Return JSON with keys primaryTarget, rationale, fallbackTargets, timelineAdvice.",
    userPrompt: `Abstract/keywords:\n${payload.abstractText}\n\nConference summary:\n${conferenceSummary}`,
  });

  if (!content) {
    return NextResponse.json(
      { error: "AI provider is not configured yet. Add OpenRouter or Minimax credentials." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    result: routeResponseSchema.parse(JSON.parse(content)),
  });
}
