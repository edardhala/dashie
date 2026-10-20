import {
  formatDeparture,
  seatsLabel,
  timeAgo,
  type RequestStatus,
  type Ride,
  type SeatRequest,
} from "@/lib/rides";

type Props = {
  ride: Ride;
  isMine: boolean;
  // My own request on someone else's ride, if I made one.
  myRequestStatus?: RequestStatus;
  busy: boolean;
  onRequest: () => void;
  onDelete: () => void;
  onRespond: (requestId: string, status: RequestStatus) => void;
  onViewRequests: () => void;
  requestCount: number;
  // Only passed in "My rides": the people who requested a seat.
  requests?: SeatRequest[];
};

const statusLabel: Record<RequestStatus, string> = {
  pending: "Requested ✓",
  accepted: "Accepted ✓",
  declined: "Declined",
};

const statusBadge: Record<RequestStatus, string> = {
  pending: "bg-slate-100 text-slate-800",
  accepted: "bg-emerald-100 text-emerald-900",
  declined: "bg-red-50 text-red-800",
};

const smallButton =
  "min-h-11 rounded-lg px-3 text-sm font-semibold disabled:opacity-60";

export default function RideCard({
  ride,
  isMine,
  myRequestStatus,
  busy,
  onRequest,
  onDelete,
  onRespond,
  onViewRequests,
  requestCount,
  requests,
}: Props) {
  const acceptedCount = requests?.filter((r) => r.status === "accepted").length ?? 0;
  const isFull = acceptedCount >= ride.seats;

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

      <div className="mt-3 flex flex-wrap gap-2">
        {isMine ? (
          <>
            {!requests && (
              <button
                type="button"
                onClick={onViewRequests}
                className={`${smallButton} bg-emerald-700 text-white hover:bg-emerald-800`}
              >
                {requestCount === 1 ? "1 seat request" : `${requestCount} seat requests`}
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className={`${smallButton} border border-red-300 bg-white text-red-800 hover:bg-red-50`}
            >
              Delete
            </button>
          </>
        ) : myRequestStatus ? (
          <p
            className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${statusBadge[myRequestStatus]}`}
          >
            {statusLabel[myRequestStatus]}
            {myRequestStatus === "accepted" && (
              <span className="ml-1 font-normal">· the driver will email you</span>
            )}
          </p>
        ) : (
          <button
            type="button"
            onClick={onRequest}
            disabled={busy}
            className={`${smallButton} bg-emerald-700 px-4 text-white hover:bg-emerald-800`}
          >
            {busy ? "Requesting…" : "Request a seat"}
          </button>
        )}
      </div>

      {requests && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Seat requests ({requests.length}) · {acceptedCount} of {ride.seats} accepted
          </h3>
          {requests.length === 0 ? (
            <p className="mt-1 text-sm text-slate-600">No seat requests yet.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {requests.map((request) => (
                <li key={request.id} className="text-sm text-slate-700">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <a
                      href={`mailto:${request.requester_email}`}
                      className="inline-block py-2 font-medium text-emerald-800 underline underline-offset-2 [overflow-wrap:anywhere]"
                    >
                      {request.requester_email}
                    </a>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[request.status]}`}
                    >
                      {request.status === "pending"
                        ? "Waiting"
                        : request.status === "accepted"
                          ? "Accepted"
                          : "Declined"}
                    </span>
                    <span className="text-slate-600">{timeAgo(request.created_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {request.status !== "accepted" && (
                      <button
                        type="button"
                        onClick={() => onRespond(request.id, "accepted")}
                        disabled={busy || isFull}
                        className={`${smallButton} bg-emerald-700 text-white hover:bg-emerald-800`}
                        aria-label={`Accept ${request.requester_email}`}
                      >
                        Accept
                      </button>
                    )}
                    {request.status !== "declined" && (
                      <button
                        type="button"
                        onClick={() => onRespond(request.id, "declined")}
                        disabled={busy}
                        className={`${smallButton} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
                        aria-label={`Decline ${request.requester_email}`}
                      >
                        Decline
                      </button>
                    )}
                  </div>
                  {request.status !== "accepted" && isFull && (
                    <p className="mt-1 text-xs text-slate-600">
                      All seats are taken. Decline someone to free a seat.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
