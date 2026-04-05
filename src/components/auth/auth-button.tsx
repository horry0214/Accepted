"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthButtonProps = {
  isAuthenticated: boolean;
  userName?: string | null;
};

export function AuthButton({ isAuthenticated, userName }: AuthButtonProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function signIn(provider: "google" | "github") {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setPending(true);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setPending(true);
    await supabase.auth.signOut();
    router.refresh();
    setPending(false);
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted sm:inline">{userName ?? "Signed in"}</span>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent dark:bg-white/5"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={pending}
        className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent dark:bg-white/5"
      >
        Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github")}
        disabled={pending}
        className="rounded-full border border-border bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent dark:bg-slate-100 dark:text-slate-900"
      >
        GitHub
      </button>
    </div>
  );
}
