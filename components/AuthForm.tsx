"use client";

import { useState } from "react";
import Link from "next/link";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login";

const copy = {
  signup: {
    heading: "Create your account",
    intro: "Just an email and a password. You'll go straight to the ride board.",
    submit: "Create account",
    busy: "Creating account…",
    switchText: "Already have an account?",
    switchLink: "Log in",
    switchHref: "/login",
    passwordAutocomplete: "new-password",
  },
  login: {
    heading: "Log in",
    intro: "Welcome back. Log in to see the rides.",
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
    "mt-1 block min-h-12 w-full rounded-lg border border-slate-400 bg-white px-3 text-base text-slate-900";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900">{text.heading}</h1>
      <p className="mt-2 text-slate-700">{text.intro}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor={`${mode}-email`} className="block font-medium text-slate-900">
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
          <label htmlFor={`${mode}-password`} className="block font-medium text-slate-900">
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
            <p id="password-hint" className="mt-1 text-sm text-slate-600">
              At least 6 characters.
            </p>
          )}
        </div>

        <div aria-live="assertive" role="alert">
          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          data-testid={`${mode}-submit`}
          disabled={busy}
          className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {busy ? text.busy : text.submit}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-700">
        {text.switchText}{" "}
        <Link
          href={text.switchHref}
          className="inline-block py-3 font-semibold text-emerald-800 underline underline-offset-2"
        >
          {text.switchLink}
        </Link>
      </p>
    </div>
  );
}
