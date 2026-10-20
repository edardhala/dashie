import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client for Server Components. Reads the session from cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. The proxy refreshes the
            // session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}

// Returns the logged-in user's id, or null. getClaims() verifies the JWT.
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}
