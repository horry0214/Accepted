import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  display_name: z.string().trim().min(1).max(40),
  avatar_url: z.string().trim().url().or(z.literal("")),
});

export async function PUT(request: Request) {
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
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.display_name,
      username: payload.display_name,
      avatar_url: payload.avatar_url || null,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to update profile." }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
