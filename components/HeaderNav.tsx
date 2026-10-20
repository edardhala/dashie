"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const linkClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900";
const activeClass =
  "inline-flex min-h-11 items-center rounded-lg bg-emerald-50 px-3 text-sm font-semibold text-emerald-800";

export default function HeaderNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  if (isLoggedIn) {
    return (
      <nav aria-label="Main" className="flex items-center gap-1">
        <Link
          href="/"
          className={pathname === "/" ? activeClass : linkClass}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          Home
        </Link>
        <Link
          href="/app"
          className={pathname === "/app" ? activeClass : linkClass}
          aria-current={pathname === "/app" ? "page" : undefined}
        >
          Rides
        </Link>
        <LogoutButton />
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {pathname === "/login" ? (
        <Link href="/signup" className={linkClass}>
          Sign up
        </Link>
      ) : (
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      )}
    </nav>
  );
}
