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
import { MinusIcon, PlusIcon } from "./Icons";

type Tab = "all" | "mine";
type Filter = "all" | Direction;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Madrid → Segovia", label: "To Segovia" },
  { value: "Segovia → Madrid", label: "To Madrid" },
];

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-ink placeholder:text-stone-500";
const labelClass = "block text-sm font-semibold text-ink";
const errorBox =
  "rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800";
const emptyBox =
  "rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-700";

export default function RideBoard({
  userId,
  initialTab = "all",
}: {
  userId: string;
  initialTab?: Tab;
}) {
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

  const [tab, setTab] = useState<Tab>(initialTab);
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

  function changeSeats(delta: number) {
    const current = Number(seats) || MIN_SEATS;
    setSeats(String(Math.min(MAX_SEATS, Math.max(MIN_SEATS, current + delta))));
  }

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
    // 23505 = already requested; the card just shows the current status.
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
    `min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${
      active ? "bg-white text-ink shadow-sm" : "text-stone-700 hover:text-ink"
    }`;
  const chipClass = (active: boolean) =>
    `min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${
      active
        ? "bg-ink text-white"
        : "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-100"
    }`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Ride board</h1>
        <p className="mt-1 text-stone-700">Every ride between Madrid and Segovia, newest first.</p>
      </div>

      <section
        aria-labelledby="post-heading"
        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6"
      >
        <h2 id="post-heading" className="text-lg font-bold text-ink">
          Post a ride
        </h2>
        <form onSubmit={handlePost} className="mt-4 space-y-5">
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
              className={`mt-1.5 ${fieldClass}`}
              aria-describedby="ride-description-hint"
            />
            <p id="ride-description-hint" className="mt-1.5 text-sm text-stone-600">
              No phone numbers: riders reach you through seat requests.
            </p>
          </div>

          <fieldset>
            <legend className={labelClass}>Direction</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
              {DIRECTIONS.map((d) => (
                <label key={d} className="relative">
                  <input
                    type="radio"
                    name="direction"
                    value={d}
                    checked={direction === d}
                    onChange={() => setDirection(d)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-1 text-[13px] font-semibold sm:text-sm text-stone-700 peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                    {d}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
            <div>
              <label htmlFor="ride-seats" className={labelClass}>
                Seats
              </label>
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeSeats(-1)}
                  disabled={Number(seats) <= MIN_SEATS}
                  aria-label="Fewer seats"
                  className="grid h-12 w-12 place-items-center rounded-xl border border-stone-300 bg-white text-ink hover:bg-stone-100 disabled:opacity-40"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <input
                  id="ride-seats"
                  type="number"
                  inputMode="numeric"
                  min={MIN_SEATS}
                  max={MAX_SEATS}
                  step={1}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="block h-12 w-16 rounded-xl border border-stone-300 bg-white text-center text-base tabular-nums text-ink"
                />
                <button
                  type="button"
                  onClick={() => changeSeats(1)}
                  disabled={Number(seats) >= MAX_SEATS}
                  aria-label="More seats"
                  className="grid h-12 w-12 place-items-center rounded-xl border border-stone-300 bg-white text-ink hover:bg-stone-100 disabled:opacity-40"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="ride-departure" className={labelClass}>
                Departure <span className="font-normal text-stone-600">(optional)</span>
              </label>
              <input
                id="ride-departure"
                type="datetime-local"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className={`mt-1.5 ${fieldClass}`}
              />
            </div>
          </div>

          <div aria-live="polite">
            {formError && (
              <p role="alert" className={errorBox}>
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-900">
                {formSuccess}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-testid="core-submit"
            disabled={posting}
            className="min-h-12 w-full rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
          >
            {posting ? "Posting…" : "Post ride"}
          </button>
        </form>
      </section>

      <section aria-labelledby="rides-heading" className="space-y-4">
        <h2 id="rides-heading" className="sr-only">
          Rides
        </h2>
        <div className="flex gap-1 rounded-xl bg-stone-200/70 p-1">
          <button
            type="button"
            aria-pressed={tab === "all"}
            onClick={() => setTab("all")}
            className={tabClass(tab === "all")}
          >
            All rides{loading ? "" : ` (${rides.length})`}
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
            <p role="alert" className={errorBox}>
              {actionError}
            </p>
          )}
        </div>

        {loading ? (
          <ul aria-label="Loading rides" className="space-y-3">
            <li role="status" className="sr-only">
              Loading rides…
            </li>
            {[0, 1, 2].map((i) => (
              <li key={i} aria-hidden="true" className="h-36 animate-pulse rounded-2xl bg-stone-200/70" />
            ))}
          </ul>
        ) : loadError ? (
          <p role="alert" className={errorBox}>
            {loadError}
          </p>
        ) : tab === "all" ? (
          <>
            <div role="group" aria-label="Filter by direction" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={chipClass(filter === f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {rides.length === 0 ? (
              <p className={emptyBox}>No rides yet. Be the first to post one!</p>
            ) : visibleRides.length === 0 ? (
              <p className={emptyBox}>No rides in this direction yet.</p>
            ) : (
              <ul className="space-y-3">{visibleRides.map((ride) => renderCard(ride, false))}</ul>
            )}
          </>
        ) : myRides.length === 0 ? (
          <p className={emptyBox}>You haven&apos;t posted a ride yet. Use the form above.</p>
        ) : (
          <ul className="space-y-3">{myRides.map((ride) => renderCard(ride, true))}</ul>
        )}
      </section>
    </div>
  );
}
