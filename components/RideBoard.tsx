"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DIRECTIONS,
  MAX_DESCRIPTION,
  MAX_SEATS,
  MIN_SEATS,
  PHONE_MESSAGE,
  looksLikePhoneNumber,
  type Direction,
  type RequestStatus,
  type Ride,
  type SeatRequest,
} from "@/lib/rides";
import RideCard from "./RideCard";

type Tab = "all" | "mine";
type Filter = "all" | Direction;

const fieldClass =
  "mt-1 block min-h-12 w-full rounded-lg border border-slate-400 bg-white px-3 text-base text-slate-900";
const labelClass = "block text-sm font-medium text-slate-900";

export default function RideBoard({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);

  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<SeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [direction, setDirection] = useState<Direction>(DIRECTIONS[0]);
  const [seats, setSeats] = useState("1");
  const [departure, setDeparture] = useState("");
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRides = useCallback(async () => {
    const [ridesResult, requestsResult] = await Promise.all([
      supabase
        .from("rides")
        .select("id, user_id, description, direction, seats, departure_at, created_at")
        .order("created_at", { ascending: false }),
      // RLS only returns my own requests and requests on my rides.
      supabase
        .from("seat_requests")
        .select("id, ride_id, requester_id, requester_email, status, created_at")
        .order("created_at", { ascending: true }),
    ]);

    if (ridesResult.error || requestsResult.error) {
      setLoadError("Couldn't load rides. Check your connection and refresh the page.");
    } else {
      setLoadError(null);
      setRides(ridesResult.data as Ride[]);
      setRequests(requestsResult.data as SeatRequest[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from Supabase
    loadRides();
  }, [loadRides]);

  // My own request status per ride (rides I asked to join).
  const myRequestStatus = useMemo(
    () =>
      new Map(
        requests.filter((r) => r.requester_id === userId).map((r) => [r.ride_id, r.status]),
      ),
    [requests, userId],
  );
  const myRides = useMemo(() => rides.filter((r) => r.user_id === userId), [rides, userId]);
  const visibleRides = useMemo(
    () => (filter === "all" ? rides : rides.filter((r) => r.direction === filter)),
    [rides, filter],
  );

  async function handlePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const text = description.trim();
    if (!text) {
      setFormError("Please describe your ride.");
      return;
    }
    if (text.length > MAX_DESCRIPTION) {
      setFormError(`Keep it under ${MAX_DESCRIPTION} characters.`);
      return;
    }
    if (looksLikePhoneNumber(text)) {
      setFormError(PHONE_MESSAGE);
      return;
    }
    const seatCount = Number(seats);
    if (!Number.isInteger(seatCount) || seatCount < MIN_SEATS || seatCount > MAX_SEATS) {
      setFormError(`Seats must be a whole number from ${MIN_SEATS} to ${MAX_SEATS}.`);
      return;
    }
    let departureAt: string | null = null;
    if (departure) {
      const date = new Date(departure);
      if (Number.isNaN(date.getTime())) {
        setFormError("Please enter a valid departure date and time, or leave it empty.");
        return;
      }
      departureAt = date.toISOString();
    }

    setPosting(true);
    const { error } = await supabase.from("rides").insert({
      description: text,
      direction,
      seats: seatCount,
      departure_at: departureAt,
    });

    if (error) {
      setFormError(`Couldn't post your ride: ${error.message}`);
      setPosting(false);
      return;
    }

    setDescription("");
    setDirection(DIRECTIONS[0]);
    setSeats("1");
    setDeparture("");
    setTab("all");
    setFilter("all");
    await loadRides();
    setFormSuccess("Ride posted!");
    setPosting(false);
  }

  async function handleRequest(rideId: string) {
    setBusyRideId(rideId);
    setActionError(null);
    const { error } = await supabase.from("seat_requests").insert({ ride_id: rideId });
    // 23505 = already requested; the button just shows "Requested ✓".
    if (error && error.code !== "23505") {
      setActionError(`Couldn't request a seat: ${error.message}`);
    }
    await loadRides();
    setBusyRideId(null);
  }

  async function handleRespond(rideId: string, requestId: string, status: RequestStatus) {
    setBusyRideId(rideId);
    setActionError(null);
    const { data, error } = await supabase
      .from("seat_requests")
      .update({ status })
      .eq("id", requestId)
      .select("id");
    if (error || !data?.length) {
      setActionError(
        status === "accepted"
          ? "Couldn't accept this request. The ride may already be full."
          : `Couldn't update this request${error ? `: ${error.message}` : "."}`,
      );
    }
    await loadRides();
    setBusyRideId(null);
  }

  async function handleDelete(rideId: string) {
    if (!window.confirm("Delete this ride? This can't be undone.")) return;
    setBusyRideId(rideId);
    setActionError(null);
    const { error } = await supabase.from("rides").delete().eq("id", rideId);
    if (error) {
      setActionError(`Couldn't delete the ride: ${error.message}`);
    }
    await loadRides();
    setBusyRideId(null);
  }

  function renderCard(ride: Ride, showRequests: boolean) {
    const isMine = ride.user_id === userId;
    const rideRequests = requests.filter((r) => r.ride_id === ride.id);
    return (
      <RideCard
        key={ride.id}
        ride={ride}
        isMine={isMine}
        myRequestStatus={myRequestStatus.get(ride.id)}
        busy={busyRideId === ride.id}
        onRequest={() => handleRequest(ride.id)}
        onDelete={() => handleDelete(ride.id)}
        onRespond={(requestId, status) => handleRespond(ride.id, requestId, status)}
        onViewRequests={() => setTab("mine")}
        requestCount={isMine ? rideRequests.length : 0}
        requests={showRequests ? rideRequests : undefined}
      />
    );
  }

  const tabClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold ${
      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="post-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <h1 id="post-heading" className="text-xl font-bold text-slate-900">
          Post a ride
        </h1>
        <form onSubmit={handlePost} className="mt-4 space-y-4">
          <div>
            <label htmlFor="ride-description" className={labelClass}>
              Ride description
            </label>
            <input
              id="ride-description"
              data-testid="core-input"
              type="text"
              required
              maxLength={MAX_DESCRIPTION}
              placeholder="e.g. Leaving Moncloa Fri 18:00, 2 seats"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
              aria-describedby="ride-description-hint"
            />
            <p id="ride-description-hint" className="mt-1 text-sm text-slate-600">
              Where from, when, and anything useful. No phone numbers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ride-direction" className={labelClass}>
                Direction
              </label>
              <select
                id="ride-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as Direction)}
                className={fieldClass}
              >
                {DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ride-seats" className={labelClass}>
                Seats
              </label>
              <input
                id="ride-seats"
                type="number"
                inputMode="numeric"
                min={MIN_SEATS}
                max={MAX_SEATS}
                step={1}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ride-departure" className={labelClass}>
                Departure <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                id="ride-departure"
                type="datetime-local"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div aria-live="polite">
            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
              >
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                {formSuccess}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-testid="core-submit"
            disabled={posting}
            className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 sm:w-auto"
          >
            {posting ? "Posting…" : "Post ride"}
          </button>
        </form>
      </section>

      <section aria-labelledby="rides-heading" className="space-y-4">
        <h2 id="rides-heading" className="sr-only">
          Rides
        </h2>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            aria-pressed={tab === "all"}
            onClick={() => setTab("all")}
            className={tabClass(tab === "all")}
          >
            All rides
          </button>
          <button
            type="button"
            aria-pressed={tab === "mine"}
            onClick={() => setTab("mine")}
            className={tabClass(tab === "mine")}
          >
            My rides{loading ? "" : ` (${myRides.length})`}
          </button>
        </div>

        <div aria-live="polite">
          {actionError && (
            <p
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            >
              {actionError}
            </p>
          )}
        </div>

        {loading ? (
          <p role="status" className="py-8 text-center text-slate-700">
            Loading rides…
          </p>
        ) : loadError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
          >
            {loadError}
          </p>
        ) : tab === "all" ? (
          <>
            <div className="max-w-xs">
              <label htmlFor="direction-filter" className={labelClass}>
                Show
              </label>
              <select
                id="direction-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
                className={fieldClass}
              >
                <option value="all">All directions</option>
                {DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            {rides.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-700">
                No rides yet. Be the first to post one!
              </p>
            ) : visibleRides.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-700">
                No rides in this direction yet.
              </p>
            ) : (
              <ul className="space-y-3">{visibleRides.map((ride) => renderCard(ride, false))}</ul>
            )}
          </>
        ) : myRides.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-700">
            You haven&apos;t posted any rides yet. Use the form above to post one.
          </p>
        ) : (
          <ul className="space-y-3">{myRides.map((ride) => renderCard(ride, true))}</ul>
        )}
      </section>
    </div>
  );
}
