import {
  formatDeparture,
  seatsLabel,
  timeAgo,
  type RequestStatus,
  type Ride,
  type SeatRequest,
} from "@/lib/rides";
import RouteLine from "./RouteLine";
import { CalendarIcon, CheckIcon, ClockIcon, MailIcon, SeatIcon, TrashIcon } from "./Icons";

type Props = {
  ride: Ride;
  isMine: boolean;
  myRequestStatus?: RequestStatus;
  busy: boolean;
  onRequest: () => void;
  onDelete: () => void;
  onRespond: (requestId: string, status: RequestStatus) => void;
  onViewRequests: () => void;
  requestCount: number;
  requests?: SeatRequest[];
};

const myStatus: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Requested ✓", className: "bg-stone-100 text-stone-800" },
  accepted: { label: "Accepted ✓ · the driver will email you", className: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Declined", className: "bg-red-50 text-red-800" },
};

const requestBadge: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Waiting", className: "bg-stone-100 text-stone-800" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Declined", className: "bg-red-50 text-red-800" },
};

const button = "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold disabled:opacity-50";
const primary = `${button} bg-brand text-white hover:bg-brand-hover`;
const secondary = `${button} bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-100`;

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
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
    >
      <div className="flex items-start justify-between gap-3">
        <RouteLine direction={ride.direction} />
        {isMine && (
          <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">
            Your ride
          </span>
        )}
      </div>

      <p className="mt-3 text-base font-semibold text-ink [overflow-wrap:anywhere]">
        {ride.description}
      </p>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
        <li className="inline-flex items-center gap-1.5">
          <SeatIcon /> {seatsLabel(ride.seats)}
        </li>
        {ride.departure_at && (
          <li className="inline-flex items-center gap-1.5">
            <CalendarIcon />
            <time dateTime={ride.departure_at}>{formatDeparture(ride.departure_at)}</time>
          </li>
        )}
        <li className="inline-flex items-center gap-1.5">
          <ClockIcon />
          <span>
            Posted <time dateTime={ride.created_at}>{timeAgo(ride.created_at)}</time>
          </span>
        </li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        {isMine ? (
          <>
            {!requests && (
              <button type="button" onClick={onViewRequests} className={primary}>
                {requestCount === 1 ? "1 seat request" : `${requestCount} seat requests`}
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className={`${button} text-red-800 hover:bg-red-50`}
            >
              <TrashIcon /> Delete
            </button>
          </>
        ) : myRequestStatus ? (
          <p
            className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${myStatus[myRequestStatus].className}`}
          >
            {myStatus[myRequestStatus].label}
          </p>
        ) : (
          <button type="button" onClick={onRequest} disabled={busy} className={primary}>
            {busy ? "Requesting…" : "Request a seat"}
          </button>
        )}
      </div>

      {requests && (
        <div className="mt-4 rounded-xl bg-stone-50 p-4">
          <h3 className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-ink">
            <span>Seat requests ({requests.length})</span>
            <span className="font-normal text-stone-600">
              {acceptedCount} of {ride.seats} accepted
            </span>
          </h3>
          {requests.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">No requests yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-200">
              {requests.map((request) => (
                <li key={request.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${request.requester_email}`}
                      className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-ink underline underline-offset-4 [overflow-wrap:anywhere]"
                    >
                      <MailIcon className="h-4 w-4 shrink-0" />
                      {request.requester_email}
                    </a>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${requestBadge[request.status].className}`}
                    >
                      {requestBadge[request.status].label}
                    </span>
                    <span className="text-xs text-stone-600">{timeAgo(request.created_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {request.status !== "accepted" && (
                      <button
                        type="button"
                        onClick={() => onRespond(request.id, "accepted")}
                        disabled={busy || isFull}
                        className={primary}
                        aria-label={`Accept ${request.requester_email}`}
                      >
                        <CheckIcon /> Accept
                      </button>
                    )}
                    {request.status !== "declined" && (
                      <button
                        type="button"
                        onClick={() => onRespond(request.id, "declined")}
                        disabled={busy}
                        className={secondary}
                        aria-label={`Decline ${request.requester_email}`}
                      >
                        Decline
                      </button>
                    )}
                  </div>
                  {request.status !== "accepted" && isFull && (
                    <p className="mt-1 text-xs text-stone-600">
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
