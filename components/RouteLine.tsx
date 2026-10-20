import type { Direction } from "@/lib/rides";

// "Madrid ●┄┄● Segovia". Screen readers hear "Madrid to Segovia".
export default function RouteLine({ direction }: { direction: Direction }) {
  const [from, to] = direction.split(" → ");
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
      <span>{from}</span>
      <span aria-hidden="true" className="flex w-10 items-center">
        <span className="h-2 w-2 rounded-full border-2 border-brand-bright" />
        <span className="flex-1 border-t-2 border-dotted border-brand-bright" />
        <span className="h-2 w-2 rounded-full bg-brand" />
      </span>
      <span className="sr-only">to</span>
      <span>{to}</span>
    </p>
  );
}
