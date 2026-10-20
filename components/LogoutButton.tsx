"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      data-testid="logout"
      onClick={handleLogout}
      disabled={busy}
      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
