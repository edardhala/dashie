"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const linkClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50";

export default function HeaderNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  if (isLoggedIn) {
    return (
      <nav aria-label="Account" className="flex items-center gap-1">
        {pathname !== "/app" && (
          <Link href="/app" className={linkClass}>
            Go to app
          </Link>
        )}
        <LogoutButton />
      </nav>
    );
  }

  return (
    <nav aria-label="Account" className="flex items-center gap-1">
      {pathname !== "/login" && (
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      )}
      {pathname === "/login" && (
        <Link href="/signup" className={linkClass}>
          Sign up
        </Link>
      )}
    </nav>
  );
}
