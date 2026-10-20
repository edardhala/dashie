import Link from "next/link";
import { getUserId } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";

export default async function SiteHeader() {
  const isLoggedIn = Boolean(await getUserId());

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 text-lg font-bold text-slate-900"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white"
          >
            D
          </span>
          Dashie
        </Link>
        <HeaderNav isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
