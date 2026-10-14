import Link from "next/link";

const steps = [
  { n: "1", title: "Describe your idea", body: "Two sentences is enough. Tell us your skills, time and budget." },
  { n: "2", title: "Answer 4 sharp questions", body: "Your AI co-founder asks what a good mentor would ask." },
  { n: "3", title: "Get your Launch Kit", body: "A plan built for you: what to test, what to build, with which tools, week by week." },
];

const kit = [
  ["🎯", "Idea scorecard", "Honest 1–10 scores on problem, market, feasibility and differentiation."],
  ["🧩", "Lean Canvas", "The 9-box business model, filled in and editable through chat."],
  ["🛠️", "Build plan for your skill level", "No-code, low-code or full-stack: real tools, real prices."],
  ["🗓️", "6-week roadmap", "Checklist from first interview to first users, with progress tracking."],
  ["🔍", "Validation kit", "Interview script, riskiest assumption and a go/no-go experiment."],
  ["💬", "Co-founder chat", "Ask anything; it knows your plan and your progress."],
];

const plans = [
  { name: "Free", price: "$0", per: "", items: ["1 idea", "Full Launch Kit", "Roadmap tracking", "20 chat messages / month"], cta: "Start free", featured: false },
  { name: "Pro", price: "$9", per: "/month", items: ["Unlimited ideas", "Unlimited co-founder chat", "Pitch deck + landing page export", "Weekly accountability check-ins"], cta: "Go Pro", featured: true },
  { name: "Campus", price: "$499", per: "/year", items: ["For schools, incubators & hackathons", "Cohort dashboard for mentors", "Unlimited students", "Progress & engagement reports"], cta: "Book a demo", featured: false },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center">
        <p className="mx-auto mb-5 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          The co-founder you didn&apos;t have
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
          From &ldquo;I have an idea&rdquo; to <span className="text-indigo-600">&ldquo;I built something real.&rdquo;</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
          FounderPath turns a raw idea into a validated plan, a build roadmap matched to your skills and budget,
          and a path to your first users. No connections, money or coding required.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Link href="/new" className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-indigo-700">
            Build my Launch Kit →
          </Link>
          <Link href="#how" className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-medium text-stone-700 hover:bg-stone-50">
            How it works
          </Link>
        </div>
        <p className="mt-4 text-sm text-stone-500">Free · takes about 3 minutes</p>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          {[
            ["42%", "of failed startups say the #1 reason was no market need (CB Insights). Validation comes first."],
            ["$0", "to start with FounderPath. Mentors, agencies and freelance developers often cost thousands."],
            ["3 min", "from a raw idea to a full, personalised Launch Kit you can act on today."],
          ].map(([stat, text]) => (
            <div key={stat}>
              <div className="text-3xl font-semibold text-indigo-600">{stat}</div>
              <p className="mt-2 text-sm text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 font-semibold text-white">{s.n}</div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-stone-600">{s.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-24 text-center text-3xl font-semibold tracking-tight">What&apos;s in your Launch Kit</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kit.map(([icon, title, body]) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-2 text-center text-stone-600">Free for every founder. Schools and incubators pay for cohorts.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl border p-6 ${p.featured ? "border-indigo-600 ring-2 ring-indigo-600" : "border-stone-200"}`}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-semibold">{p.price}</span>
                  <span className="text-stone-500">{p.per}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-700">
                  {p.items.map((i) => (
                    <li key={i}>✓ {i}</li>
                  ))}
                </ul>
                <Link
                  href={p.name === "Campus" ? "/cohort" : "/new"}
                  className={`mt-6 rounded-xl px-4 py-2.5 text-center font-medium ${p.featured ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-stone-300 hover:bg-stone-50"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
