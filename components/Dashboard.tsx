import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo, type Ride, type SeatRequest } from "@/lib/rides";
import RouteLine from "./RouteLine";
import { ArrowRightIcon, PlusIcon } from "./Icons";

const statusBadge = {
  pending: { label: "Waiting", className: "bg-stone-100 text-stone-800" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Declined", className: "bg-red-50 text-red-800" },
} as const;

const panel = "rounded-2xl bg-white p-5 ring-1 ring-stone-200";
const textLink =
  "inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-ink hover:underline";

export default async function Dashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  // RLS returns every ride, and only the seat requests I made or received.
  const [ridesResult, requestsResult] = await Promise.all([
    supabase
      .from("rides")
      .select("id, user_id, description, direction, seats, departure_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("seat_requests")
      .select("id, ride_id, requester_id, requester_email, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (ridesResult.error || requestsResult.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p role="alert" className="rounded-xl bg-red-50 p-4 font-medium text-red-800">
          Couldn&apos;t load your dashboard. Please refresh the page.
        </p>
      </div>
    );
  }

  const rides = ridesResult.data as Ride[];
  const requests = requestsResult.data as SeatRequest[];
  const rideById = new Map(rides.map((r) => [r.id, r]));

  const myRides = rides.filter((r) => r.user_id === userId);
  const toReview = requests.filter(
    (r) => r.status === "pending" && rideById.get(r.ride_id)?.user_id === userId,
  );
  const myRequests = requests.filter((r) => r.requester_id === userId);
  const accepted = myRequests.filter((r) => r.status === "accepted").length;
  const latest = rides.filter((r) => r.user_id !== userId).slice(0, 3);

  const stats = [
    { label: "Rides posted", value: myRides.length },
    { label: "To review", value: toReview.length },
    { label: "Seats confirmed", value: accepted },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Your dashboard</h1>
          <p className="mt-1 text-stone-700">Your rides and seat requests at a glance.</p>
        </div>
        <Link
          href="/app"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white shadow-sm hover:bg-brand-hover"
        >
          <PlusIcon /> Post a ride
        </Link>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-4 ring-1 ${
              s.label === "To review" && s.value > 0
                ? "bg-brand-soft ring-brand/20"
                : "bg-white ring-stone-200"
            }`}
          >
            <dt className="text-xs font-semibold text-stone-600 sm:text-sm">{s.label}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="review-heading" className={panel}>
        <h2 id="review-heading" className="text-lg font-bold text-ink">
          Waiting for your answer
        </h2>
        {toReview.length === 0 ? (
          <p className="mt-2 text-stone-700">Nothing to review right now.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-stone-100">
              {toReview.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="font-medium text-ink [overflow-wrap:anywhere]">
                    {r.requester_email}
                  </p>
                  <p className="text-sm text-stone-600 [overflow-wrap:anywhere]">
                    wants a seat on “{rideById.get(r.ride_id)?.description}” ·{" "}
                    {timeAgo(r.created_at)}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/app?tab=mine" className={textLink}>
              Accept or decline <ArrowRightIcon />
            </Link>
          </>
        )}
      </section>

      <section aria-labelledby="mine-heading" className={panel}>
        <h2 id="mine-heading" className="text-lg font-bold text-ink">
          Your seat requests
        </h2>
        {myRequests.length === 0 ? (
          <p className="mt-2 text-stone-700">
            You haven&apos;t asked for a seat yet.{" "}
            <Link href="/app" className="font-semibold text-brand-ink underline underline-offset-4">
              Browse rides
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {myRequests.map((r) => {
              const ride = rideById.get(r.ride_id);
              if (!ride) return null;
              const badge = statusBadge[r.status];
              return (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <RouteLine direction={ride.direction} />
                    <p className="mt-1 text-sm text-stone-700 [overflow-wrap:anywhere]">
                      {ride.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="latest-heading" className={panel}>
        <h2 id="latest-heading" className="text-lg font-bold text-ink">
          Latest rides
        </h2>
        {latest.length === 0 ? (
          <p className="mt-2 text-stone-700">No rides from other students yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {latest.map((ride) => (
              <li key={ride.id} className="py-3">
                <RouteLine direction={ride.direction} />
                <p className="mt-1 text-sm text-stone-700 [overflow-wrap:anywhere]">
                  {ride.description} · {timeAgo(ride.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/app" className={textLink}>
          See all rides <ArrowRightIcon />
        </Link>
      </section>
    </div>
  );
}
