import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  threadId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable(),
  content: z.string().min(1).max(3000),
});

const updateSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(3000),
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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const authorName =
    profile?.full_name ?? profile?.username ?? user.user_metadata?.full_name ?? "Accepted user";
  const authorAvatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const { data, error } = await supabase
    .from("comments")
    .insert({
      thread_id: payload.threadId,
      parent_comment_id: payload.parentCommentId,
      content: payload.content,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create comment." }, { status: 400 });
  }

  return NextResponse.json({
    comment: {
      ...data,
      author_name: authorName,
      author_avatar: authorAvatar,
      viewer_has_voted: false,
    },
  });
}

const deleteSchema = z.object({
  commentId: z.string().uuid(),
});

export async function DELETE(request: Request) {
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

  const payload = deleteSchema.parse(await request.json());
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", payload.commentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, commentId: payload.commentId });
}

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

  const payload = updateSchema.parse(await request.json());
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const authorName =
    profile?.full_name ?? profile?.username ?? user.user_metadata?.full_name ?? "Accepted user";
  const authorAvatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const { data, error } = await supabase
    .from("comments")
    .update({
      content: payload.content,
    })
    .eq("id", payload.commentId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to update comment." }, { status: 400 });
  }

  return NextResponse.json({
    comment: {
      ...data,
      author_name: authorName,
      author_avatar: authorAvatar,
    },
  });
}
