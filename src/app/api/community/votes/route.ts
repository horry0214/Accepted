import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(["thread", "comment"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("target_id", payload.targetId)
    .eq("target_type", payload.targetType)
    .eq("user_id", user.id)
    .maybeSingle();

  const tableName = payload.targetType === "thread" ? "threads" : "comments";

  const { data: target } = await supabase
    .from(tableName)
    .select("upvotes")
    .eq("id", payload.targetId)
    .single();

  const currentVotes = target?.upvotes ?? 0;

  if (existingVote) {
    await supabase.from("votes").delete().eq("id", existingVote.id);
    const { data, error } = await supabase
      .from(tableName)
      .update({ upvotes: Math.max(0, currentVotes - 1) })
      .eq("id", payload.targetId)
      .select("upvotes")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Unable to update vote." }, { status: 400 });
    }

    return NextResponse.json({ upvotes: data.upvotes, voted: false });
  }

  await supabase.from("votes").insert({
    target_id: payload.targetId,
    target_type: payload.targetType,
  });

  const { data, error } = await supabase
    .from(tableName)
    .update({ upvotes: currentVotes + 1 })
    .eq("id", payload.targetId)
    .select("upvotes")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to update vote." }, { status: 400 });
  }

  return NextResponse.json({ upvotes: data.upvotes, voted: true });
}
