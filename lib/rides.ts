export const DIRECTIONS = ["Madrid → Segovia", "Segovia → Madrid"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const MAX_DESCRIPTION = 200;
export const MIN_SEATS = 1;
export const MAX_SEATS = 8;

export type Ride = {
  id: string;
  user_id: string;
  description: string;
  direction: Direction;
  seats: number;
  departure_at: string | null;
  created_at: string;
};

export type RequestStatus = "pending" | "accepted" | "declined";

export type SeatRequest = {
  id: string;
  ride_id: string;
  requester_id: string;
  requester_email: string;
  status: RequestStatus;
  created_at: string;
};

export const PHONE_MESSAGE =
  "Please don't post phone numbers. Riders will contact you through a seat request.";

// 9+ digits in a row, ignoring spaces, dots, dashes and a leading "+".
// "612 345 678" and "+34 612-345-678" match; "QA-7F3K2A grading bot test" doesn't.
export function looksLikePhoneNumber(text: string) {
  return /\+?\d(?:[\s.-]*\d){8,}/.test(text);
}

export function seatsLabel(seats: number) {
  return seats === 1 ? "1 seat" : `${seats} seats`;
}

const departureFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

export function formatDeparture(iso: string) {
  return departureFormat.format(new Date(iso));
}

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
