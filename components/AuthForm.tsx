"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login";

const copy = {
  signup: {
    heading: "Create your account",
    intro: "Email and password. That's it.",
    submit: "Create account",
    busy: "Creating account…",
    switchText: "Already have an account?",
    switchLink: "Log in",
    switchHref: "/login",
    passwordAutocomplete: "new-password",
  },
  login: {
    heading: "Welcome back",
    intro: "Log in to see the latest rides.",
    submit: "Log in",
    busy: "Logging in…",
    switchText: "New here?",
    switchLink: "Sign up — it's free",
    switchHref: "/signup",
    passwordAutocomplete: "current-password",
  },
} as const;

function signupErrorMessage(error: AuthError) {
  if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (error.code === "weak_password" || /password/i.test(error.message)) {
    return error.message.endsWith(".") ? error.message : `${error.message}.`;
  }
  if (error.code === "email_address_invalid" || /email/i.test(error.message)) {
    return "Please enter a valid email address.";
  }
  if (error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return `Couldn't create your account: ${error.message}`;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const text = copy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(signupErrorMessage(error));
        setBusy(false);
        return;
      }
      if (!data.session) {
        // Only happens if "Confirm email" gets turned back on in Supabase.
        setError("Account created. Check your inbox to confirm your email, then log in.");
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : error.status && error.status < 500
              ? "Wrong email or password"
              : "Couldn't reach the server. Please try again.",
        );
        setBusy(false);
        return;
      }
    }

    // Full page load (not router.push) so the server sees the new session cookie
    // and the shared header re-renders with the logout button.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/app");
  }

  const inputClass =
    "mt-1.5 block min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900";
  const labelClass = "block text-sm font-semibold text-stone-900";

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{text.heading}</h1>
        <p className="mt-1 text-stone-700">{text.intro}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor={`${mode}-email`} className={labelClass}>
              Email
            </label>
            <input
              id={`${mode}-email`}
              data-testid={`${mode}-email`}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${mode}-password`} className={labelClass}>
              Password
            </label>
            <input
              id={`${mode}-password`}
              data-testid={`${mode}-password`}
              type="password"
              autoComplete={text.passwordAutocomplete}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              aria-describedby={mode === "signup" ? "password-hint" : undefined}
            />
            {mode === "signup" && (
              <p id="password-hint" className="mt-1.5 text-sm text-stone-600">
                At least 6 characters.
              </p>
            )}
          </div>

          <div aria-live="assertive" role="alert">
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-testid={`${mode}-submit`}
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? text.busy : text.submit}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-stone-700">
        {text.switchText}{" "}
        <Link
          href={text.switchHref}
          className="inline-block py-3 font-semibold text-emerald-800 underline underline-offset-4"
        >
          {text.switchLink}
        </Link>
      </p>
    </div>
  );
}
