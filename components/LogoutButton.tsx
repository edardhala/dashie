"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await createClient().auth.signOut();
    // Full page load so the shared header and server pages drop the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      data-testid="logout"
      onClick={handleLogout}
      disabled={busy}
      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/10 disabled:opacity-60"
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
