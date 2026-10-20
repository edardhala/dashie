import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/server";
import RideBoard from "@/components/RideBoard";

export default async function AppPage({ searchParams }: PageProps<"/app">) {
  // The proxy already redirects logged-out visitors; this is a second check.
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const { tab } = await searchParams;
  return <RideBoard userId={userId} initialTab={tab === "mine" ? "mine" : "all"} />;
}
