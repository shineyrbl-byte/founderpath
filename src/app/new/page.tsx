"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import type { Profile, Questions } from "@/lib/schema";

const EXAMPLES = [
  "An app where college students can swap or sell used textbooks with people on their own campus.",
  "A service that helps small home bakers take pre-orders on WhatsApp and plan how much to bake.",
  "A tool that helps first-generation immigrants understand and fill in government forms in their own language.",
];

const SKILLS: [Profile["skill"], string, string][] = [
  ["no-code", "I can't code", "No-code tools only"],
  ["some-code", "A little", "Tutorials, basic HTML/JS or Python"],
  ["developer", "I'm a developer", "I can build a full-stack app"],
];
const BUDGETS: [Profile["budget"], string][] = [
  ["zero", "$0"],
  ["under-100", "Under $100"],
  ["under-1000", "Under $1,000"],
];
const GOALS: [Profile["goal"], string][] = [
  ["side-project", "Side project"],
  ["startup", "Real startup"],
  ["school", "School project"],
];

const BUILD_STEPS = [
  "Reading your idea and answers",
  "Sizing up the problem and the people who have it",
  "Finding real competitors and gaps",
  "Filling in your Lean Canvas",
  "Choosing tools that fit your skills and budget",
  "Writing your 6-week roadmap",
  "Drafting your interview script and pitch",
];

function Choice<T extends string>({
  value,
  current,
  onPick,
  children,
}: {
  value: T;
  current: T;
  onPick: (v: T) => void;
  children: React.ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
        active ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-stone-300 bg-white hover:border-stone-400"
      }`}
    >
      {children}
    </button>
  );
}

function NewIdea() {
  const router = useRouter();
  const invitedCohort = (useSearchParams().get("cohort") ?? "").toUpperCase();
  const [step, setStep] = useState(1);
  const [founderName, setFounderName] = useState("");
  const [idea, setIdea] = useState("");
  const [profile, setProfile] = useState<Profile>({ skill: "no-code", hoursPerWeek: 8, budget: "zero", goal: "startup" });
  const [cohort, setCohort] = useState(() => invitedCohort);
  const [questions, setQuestions] = useState<Questions["questions"]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buildStep, setBuildStep] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    if (step !== 4) return;
    const t = setInterval(() => setBuildStep((s) => Math.min(s + 1, BUILD_STEPS.length - 1)), 15000);
    return () => clearInterval(t);
  }, [step]);

  async function fetchQuestions() {
    setError("");
    setLoading(true);
    try {
      const q = await api<Questions>("/api/questions", { method: "POST", body: JSON.stringify({ idea, profile }) });
      setQuestions(q.questions);
      setAnswers(q.questions.map(() => ""));
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function buildKit() {
    setError("");
    setBuildStep(0);
    setStep(4);
    try {
      const { id } = await api<{ id: string }>("/api/ideas", {
        method: "POST",
        body: JSON.stringify({
          founderName,
          idea,
          profile,
          cohort: cohort || null,
          answers: questions.map((q, i) => ({ question: q.question, answer: answers[i] ?? "" })),
        }),
      });
      router.push(`/kit/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setStep(3);
    }
  }

  const canNext1 = founderName.trim().length > 0 && idea.trim().length >= 15;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {step < 4 && (
        <div className="mb-8 flex items-center gap-2 text-xs font-medium text-stone-500">
          {["Your idea", "About you", "Sharpen it"].map((label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-indigo-600" : "bg-stone-200"}`} />
              <span className={i + 1 === step ? "text-indigo-700" : ""}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {step === 1 && (
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">What do you want to build?</h1>
          <p className="mt-2 text-stone-600">Describe it in a sentence or two. Rough is fine; that&apos;s what we&apos;re here for.</p>
          <label className="mt-8 block text-sm font-medium">Your first name</label>
          <input
            value={founderName}
            onChange={(e) => setFounderName(e.target.value)}
            placeholder="e.g. Aisha"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          <label className="mt-5 block text-sm font-medium">Your idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            placeholder="An app that…"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-stone-500">Try an example:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="max-w-full truncate rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600 hover:border-indigo-400 hover:text-indigo-700"
              >
                {ex.slice(0, 48)}…
              </button>
            ))}
          </div>
          <button
            disabled={!canNext1}
            onClick={() => setStep(2)}
            className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">Tell us about you, {founderName.trim()}</h1>
          <p className="mt-2 text-stone-600">Your plan will only use tools and steps you can actually do.</p>

          <h2 className="mt-8 text-sm font-medium">Can you code?</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {SKILLS.map(([v, label, sub]) => (
              <Choice key={v} value={v} current={profile.skill} onPick={(skill) => setProfile({ ...profile, skill })}>
                <div className="font-medium">{label}</div>
                <div className="text-xs text-stone-500">{sub}</div>
              </Choice>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-medium">
            Hours per week you can spend: <span className="text-indigo-700">{profile.hoursPerWeek}h</span>
          </h2>
          <input
            type="range"
            min={2}
            max={40}
            value={profile.hoursPerWeek}
            onChange={(e) => setProfile({ ...profile, hoursPerWeek: Number(e.target.value) })}
            className="mt-2 w-full accent-indigo-600"
          />

          <h2 className="mt-6 text-sm font-medium">Budget</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {BUDGETS.map(([v, label]) => (
              <Choice key={v} value={v} current={profile.budget} onPick={(budget) => setProfile({ ...profile, budget })}>
                {label}
              </Choice>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-medium">What is this for you?</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {GOALS.map(([v, label]) => (
              <Choice key={v} value={v} current={profile.goal} onPick={(goal) => setProfile({ ...profile, goal })}>
                {label}
              </Choice>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-medium">
            Cohort code <span className="font-normal text-stone-500">(optional, from your school or incubator)</span>
          </h2>
          <input
            value={cohort}
            onChange={(e) => setCohort(e.target.value.toUpperCase())}
            placeholder="e.g. BITS-GOA"
            className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 uppercase outline-none focus:border-indigo-600"
          />

          <div className="mt-8 flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-xl border border-stone-300 px-5 py-3 font-medium hover:bg-stone-50">
              Back
            </button>
            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <span className="fp-pulse">Your co-founder is thinking…</span> : "Continue"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">A few questions from your co-founder</h1>
          <p className="mt-2 text-stone-600">Short answers are fine. Skip any you don&apos;t know yet.</p>
          <div className="mt-8 space-y-6">
            {questions.map((q, i) => (
              <div key={i}>
                <label className="block font-medium">{q.question}</label>
                <p className="mt-0.5 text-xs text-stone-500">{q.why}</p>
                <textarea
                  rows={2}
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                  placeholder={q.placeholder}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={() => setStep(2)} className="rounded-xl border border-stone-300 px-5 py-3 font-medium hover:bg-stone-50">
              Back
            </button>
            <button onClick={buildKit} className="flex-1 rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700">
              Build my Launch Kit ✨
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="py-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600 text-3xl text-white fp-pulse">⟡</div>
          <h1 className="mt-6 text-2xl font-semibold">Building your Launch Kit</h1>
          <p className="mt-1 text-sm text-stone-500">This can take 1–3 minutes. Good plans take a moment.</p>
          <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-left text-sm">
            {BUILD_STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 ${i > buildStep ? "text-stone-400" : "text-stone-800"}`}>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                    i < buildStep ? "bg-indigo-600 text-white" : i === buildStep ? "border-2 border-indigo-600 fp-pulse" : "border border-stone-300"
                  }`}
                >
                  {i < buildStep ? "✓" : ""}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function NewIdeaPage() {
  return (
    <Suspense>
      <NewIdea />
    </Suspense>
  );
}
