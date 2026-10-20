import { getUserId } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

export default async function Home() {
  const userId = await getUserId();
  return userId ? <Dashboard userId={userId} /> : <Landing />;
}
