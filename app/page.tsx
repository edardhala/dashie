import { getUserId } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

// Strangers see the public landing page; logged-in students see their dashboard.
export default async function Home() {
  const userId = await getUserId();
  return userId ? <Dashboard userId={userId} /> : <Landing />;
}
