import {
  formatDeparture,
  seatsLabel,
  timeAgo,
  type Ride,
  type SeatRequest,
} from "@/lib/rides";

type Props = {
  ride: Ride;
  isMine: boolean;
  requested: boolean;
  busy: boolean;
  onRequest: () => void;
  onDelete: () => void;
  // Only passed in "My rides": the people who requested a seat.
  requests?: SeatRequest[];
};

export default function RideCard({
  ride,
  isMine,
  requested,
  busy,
  onRequest,
  onDelete,
  requests,
}: Props) {
  return (
    <li
      data-testid="core-item"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
          {ride.direction}
        </span>
        {isMine && (
          <span className="rounded-full bg-slate-900 px-2 py-1 text-white">Your ride</span>
        )}
      </div>

      <p className="mt-2 text-base font-medium text-slate-900 [overflow-wrap:anywhere]">
        {ride.description}
      </p>

      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
        <span>{seatsLabel(ride.seats)}</span>
        {ride.departure_at && (
          <span>
            Departs{" "}
            <time dateTime={ride.departure_at}>{formatDeparture(ride.departure_at)}</time>
          </span>
        )}
        <span>
          Posted <time dateTime={ride.created_at}>{timeAgo(ride.created_at)}</time>
        </span>
      </p>

      <div className="mt-3">
        {isMine ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        ) : requested ? (
          <button
            type="button"
            disabled
            className="min-h-11 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900"
          >
            Requested ✓
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequest}
            disabled={busy}
            className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? "Requesting…" : "Request a seat"}
          </button>
        )}
      </div>

      {requests && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Seat requests ({requests.length})
          </h3>
          {requests.length === 0 ? (
            <p className="mt-1 text-sm text-slate-600">No seat requests yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {requests.map((request) => (
                <li key={request.id} className="text-sm text-slate-700">
                  <a
                    href={`mailto:${request.requester_email}`}
                    className="inline-block py-2 font-medium text-emerald-800 underline underline-offset-2 [overflow-wrap:anywhere]"
                  >
                    {request.requester_email}
                  </a>{" "}
                  <span className="text-slate-600">· {timeAgo(request.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
