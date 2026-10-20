import type { Direction } from "@/lib/rides";

// "Madrid ●┄┄● Segovia". Screen readers hear "Madrid to Segovia".
export default function RouteLine({ direction }: { direction: Direction }) {
  const [from, to] = direction.split(" → ");
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
      <span>{from}</span>
      <span aria-hidden="true" className="flex w-10 items-center">
        <span className="h-2 w-2 rounded-full border-2 border-emerald-700" />
        <span className="flex-1 border-t-2 border-dotted border-emerald-700" />
        <span className="h-2 w-2 rounded-full bg-emerald-700" />
      </span>
      <span className="sr-only">to</span>
      <span>{to}</span>
    </p>
  );
}
