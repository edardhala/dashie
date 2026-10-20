import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/server";
import RideBoard from "@/components/RideBoard";

export default async function AppPage() {
  // The proxy already redirects logged-out visitors; this is a second check.
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return <RideBoard userId={userId} />;
}
