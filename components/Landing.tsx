import Link from "next/link";
import RouteLine from "./RouteLine";
import { CarIcon, ClockIcon, SeatIcon } from "./Icons";
import type { Direction } from "@/lib/rides";

const steps = [
  { title: "Post your ride", text: "Where from, when, how many seats. One line." },
  { title: "Students request a seat", text: "One tap. No phone numbers shared." },
  { title: "You get their email", text: "Accept who you want and sort out the details." },
];

const pitch = [
  {
    label: "The problem",
    text: "Getting between Madrid and the Segovia campus is a weekly hassle. Ride offers are scattered across group chats and get lost fast, so cars leave half empty while other students search for a way there.",
  },
  {
    label: "Who it's for",
    text: "IE students who commute between Madrid and the Segovia campus, whether you drive or need a lift.",
  },
  {
    label: "What you get",
    text: "A seat when you need one, from Monday classes to weekend IE events. Drivers fill their empty seats, riders find a lift in seconds.",
  },
];

const examples: { direction: Direction; description: string; seats: string; when: string }[] = [
  {
    direction: "Madrid → Segovia",
    description: "Leaving Moncloa Fri 18:00, 2 seats",
    seats: "2 seats",
    when: "Fri 18:00",
  },
  {
    direction: "Segovia → Madrid",
    description: "Back Sunday evening, can drop off at Plaza de Castilla",
    seats: "3 seats",
    when: "Sun 19:30",
  },
  {
    direction: "Madrid → Segovia",
    description: "Príncipe Pío at 7:30, in time for the 9:00 class",
    seats: "1 seat",
    when: "Mon 07:30",
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#6d28d9] px-5 py-12 text-center shadow-xl shadow-indigo-900/20 sm:px-10 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(167,139,250,0.35)_0%,transparent_70%)]"
        />
        <div className="relative">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
            Find or offer a seat between Madrid and Segovia
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-white/80">
            A ride board for IE students. Post your trip in 10 seconds or request a seat in one tap.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <Link
              href="/signup"
              className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-white px-6 text-lg font-semibold text-brand-ink shadow-lg shadow-black/20 hover:bg-brand-soft"
            >
              Sign up — it&apos;s free
            </Link>
            <p className="text-sm text-white/80">
              Already have an account?{" "}
              <Link
                href="/login"
                className="inline-block py-3 font-semibold text-white underline underline-offset-4"
              >
                Log in
              </Link>
            </p>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto mt-10 flex max-w-md items-center gap-3 text-sm font-semibold text-white"
          >
            <span>Madrid</span>
            <span className="h-3 w-3 rounded-full border-2 border-brand-bright" />
            <span className="relative flex-1 border-t-2 border-dotted border-brand-bright">
              <span className="absolute -top-4 left-1/2 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-brand-bright text-ink">
                <CarIcon className="h-4 w-4" />
              </span>
            </span>
            <span className="h-3 w-3 rounded-full bg-brand-bright" />
            <span>Segovia</span>
          </div>
          <p className="mt-3 text-sm text-white/70">About 90 km · 1 hour by car</p>
        </div>
      </section>

      <section aria-labelledby="pitch-heading" className="mt-16">
        <h2
          id="pitch-heading"
          className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl"
        >
          Dashie finds IE students a seat between Madrid and Segovia whenever they need one,
          for every class, exam and IE event.
        </h2>
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {pitch.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <dt className="text-sm font-bold uppercase tracking-wide text-brand-ink">
                {item.label}
              </dt>
              <dd className="mt-2 text-stone-700">{item.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="how-heading" className="mt-16">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight text-ink">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-stone-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="examples-heading" className="mt-16">
        <h2 id="examples-heading" className="text-2xl font-bold tracking-tight text-ink">
          Rides look like this
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {examples.map((ride) => (
            <li
              key={ride.description}
              className="rounded-2xl border border-dashed border-stone-300 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <RouteLine direction={ride.direction} />
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-900">
                  Example
                </span>
              </div>
              <p className="mt-3 font-semibold text-ink">{ride.description}</p>
              <p className="mt-2 flex gap-4 text-sm text-stone-600">
                <span className="inline-flex items-center gap-1">
                  <SeatIcon /> {ride.seats}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon /> {ride.when}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
