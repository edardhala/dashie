import { createBrowserClient } from "@supabase/ssr";

// Browser client: only the public URL and publishable key ever reach the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
