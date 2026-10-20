import Link from "next/link";

const steps = [
  {
    title: "Post your ride",
    text: "Write one line: where you leave from, when, and how many seats.",
  },
  {
    title: "Students request a seat",
    text: "Other IE students tap “Request a seat” on your ride.",
  },
  {
    title: "You get their email",
    text: "Accept the ones you want, then email them to arrange the rest.",
  },
];

// Hard-coded examples for the landing page. Not from the database.
const examples = [
  {
    direction: "Madrid → Segovia",
    description: "Leaving Moncloa Fri 18:00, 2 seats",
    meta: "2 seats · Fri 18:00",
  },
  {
    direction: "Segovia → Madrid",
    description: "Back to Madrid Sun evening, can drop off near Plaza de Castilla",
    meta: "3 seats · Sun 19:30",
  },
  {
    direction: "Madrid → Segovia",
    description: "Mon 7:30 from Príncipe Pío for the 9:00 class",
    meta: "1 seat · Mon 07:30",
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="pt-4 text-center sm:pt-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Find or offer a seat between Madrid and Segovia
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-700">
          A ride board for IE students. Post your trip in 10 seconds, no more
          scrolling WhatsApp groups.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-emerald-700 px-6 text-lg font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            Sign up — it&apos;s free
          </Link>
          <p className="text-sm text-slate-700">
            Already have an account?{" "}
            <Link
              href="/login"
              className="inline-block py-3 font-semibold text-emerald-800 underline underline-offset-2"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-xl font-bold text-slate-900">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="text-xl font-bold text-slate-900">
          What rides look like
        </h2>
        <ul className="mt-4 space-y-3">
          {examples.map((ride) => (
            <li
              key={ride.description}
              className="rounded-xl border border-dashed border-slate-300 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-amber-100 px-2 py-1 uppercase tracking-wide text-amber-900">
                  Example
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                  {ride.direction}
                </span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{ride.description}</p>
              <p className="mt-1 text-sm text-slate-600">{ride.meta}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
