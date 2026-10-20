import Link from "next/link";
import { getUserId } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";

export default async function SiteHeader() {
  const isLoggedIn = Boolean(await getUserId());

  return (
    <header className="sticky top-0 z-20 bg-ink">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-white"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white"
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
