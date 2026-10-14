"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ownerId } from "@/lib/client";
import { taskId, type IdeaRecord, type Kit } from "@/lib/schema";
import type { ChatMessage } from "@/lib/db";
import { Markdown } from "@/components/Markdown";

type KitResponse = Omit<IdeaRecord, "owner"> & {
  isOwner: boolean;
  progress: { done: number; total: number; pct: number };
  messages: ChatMessage[];
};

const TABS = ["Overview", "Validate", "Lean Canvas", "MVP & Build", "Roadmap", "Business & Pitch"] as const;
type Tab = (typeof TABS)[number];

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 ${className}`}>
      {title && <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>}
      {children}
    </div>
  );
}

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 text-sm text-stone-700">
    {items.map((i) => (
      <li key={i} className="flex gap-2">
        <span className="text-indigo-500">•</span>
        {i}
      </li>
    ))}
  </ul>
);

function scoreColor(s: number) {
  return s >= 8 ? "bg-emerald-500" : s >= 6 ? "bg-indigo-500" : s >= 4 ? "bg-amber-500" : "bg-red-500";
}

function Overview({ kit }: { kit: Kit }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Idea scorecard" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kit.scores.map((s) => (
            <div key={s.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-lg font-semibold">{s.score}<span className="text-xs text-stone-400">/10</span></span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-stone-100">
                <div className={`h-2 rounded-full ${scoreColor(s.score)}`} style={{ width: `${s.score * 10}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">{s.note}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card title="The problem">
        <p className="text-sm text-stone-800">{kit.problem.statement}</p>
        <p className="mt-3 text-sm"><span className="font-medium">Who feels it:</span> <span className="text-stone-700">{kit.problem.whoFeelsIt}</span></p>
        <p className="mt-3 text-sm font-medium">How they cope today</p>
        <div className="mt-1.5"><List items={kit.problem.currentAlternatives} /></div>
      </Card>
      <Card title="Your customer">
        <p className="text-sm text-stone-800">{kit.targetCustomer.primaryPersona}</p>
        <p className="mt-3 text-sm"><span className="font-medium">Early adopters:</span> <span className="text-stone-700">{kit.targetCustomer.earlyAdopters}</span></p>
        <p className="mt-3 text-sm font-medium">Where to find them</p>
        <div className="mt-1.5"><List items={kit.targetCustomer.whereToFindThem} /></div>
      </Card>
      <Card title="Competitors & gaps" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kit.competitors.map((c) => (
            <div key={c.name} className="rounded-xl bg-stone-50 p-3.5">
              <div className="font-medium">{c.name}</div>
              <p className="mt-1 text-sm text-stone-600">{c.whatTheyDo}</p>
              <p className="mt-2 text-sm"><span className="font-medium text-indigo-700">Gap:</span> {c.gap}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Risks to watch" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          {kit.risks.map((r) => (
            <div key={r.risk} className="text-sm">
              <div className="font-medium text-stone-900">⚠ {r.risk}</div>
              <div className="mt-1 text-stone-600">→ {r.mitigation}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LeanCanvas({ kit }: { kit: Kit }) {
  const c = kit.leanCanvas;
  const box = (title: string, items: string[], cls = "") => (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 ${cls}`}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">{title}</h4>
      <List items={items} />
    </div>
  );
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {box("Problem", c.problem, "lg:row-span-2")}
      {box("Solution", c.solution)}
      {box("Unique value proposition", c.uniqueValueProposition, "lg:row-span-2 bg-indigo-50/50")}
      {box("Unfair advantage", c.unfairAdvantage)}
      {box("Customer segments", c.customerSegments, "lg:row-span-2")}
      {box("Key metrics", c.keyMetrics)}
      {box("Channels", c.channels)}
      <div className="grid gap-3 lg:col-span-5 lg:grid-cols-2">
        {box("Cost structure", c.costStructure)}
        {box("Revenue streams", c.revenueStreams)}
      </div>
    </div>
  );
}

function Build({ kit }: { kit: Kit }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="MVP: build only this">
        <ul className="space-y-3">
          {kit.mvp.mustHave.map((f) => (
            <li key={f.feature} className="text-sm">
              <div className="font-medium">✓ {f.feature}</div>
              <div className="text-stone-600">{f.why}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <span className="font-medium">Success looks like:</span> {kit.mvp.successMetric}
        </div>
      </Card>
      <Card title="Not now (resist the temptation)">
        <ul className="space-y-1.5 text-sm text-stone-500">
          {kit.mvp.notNow.map((n) => <li key={n} className="line-through decoration-stone-300">{n}</li>)}
        </ul>
      </Card>
      <Card title="How you'll build it" className="lg:col-span-2">
        <p className="text-sm text-stone-800">{kit.buildPlan.approach}</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr><th className="px-4 py-2">Tool</th><th className="px-4 py-2">Used for</th><th className="px-4 py-2">Cost</th></tr>
            </thead>
            <tbody>
              {kit.buildPlan.tools.map((t) => (
                <tr key={t.name} className="border-t border-stone-100">
                  <td className="px-4 py-2 font-medium">{t.name}</td>
                  <td className="px-4 py-2 text-stone-600">{t.purpose}</td>
                  <td className="px-4 py-2 text-stone-600">{t.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm"><span className="font-medium">Estimated running cost:</span> {kit.buildPlan.estimatedMonthlyCost}</p>
      </Card>
    </div>
  );
}

function Roadmap({ kit, done, onToggle, editable }: { kit: Kit; done: string[]; onToggle: (id: string, v: boolean) => void; editable: boolean }) {
  return (
    <div className="space-y-4">
      {kit.roadmap.map((w, wi) => {
        const ids = w.tasks.map((_, ti) => taskId(wi + 1, ti));
        const complete = ids.every((id) => done.includes(id));
        return (
          <Card key={wi}>
            <div className="flex items-center gap-3">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${complete ? "bg-emerald-500 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                {complete ? "✓" : wi + 1}
              </span>
              <div>
                <div className="text-xs font-medium uppercase text-stone-500">Week {wi + 1}</div>
                <div className="font-semibold">{w.theme}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {w.tasks.map((t, ti) => {
                const id = ids[ti];
                const checked = done.includes(id);
                return (
                  <li key={id}>
                    <label className={`flex gap-3 rounded-xl p-2.5 ${editable ? "cursor-pointer hover:bg-stone-50" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!editable}
                        onChange={(e) => onToggle(id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-indigo-600"
                      />
                      <span className="text-sm">
                        <span className={`font-medium ${checked ? "text-stone-400 line-through" : ""}`}>{t.title}</span>
                        <span className="block text-stone-600">{t.detail}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function Validate({ kit }: { kit: Kit }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Your riskiest assumption" className="lg:col-span-2 border-amber-200 bg-amber-50/50">
        <p className="text-lg font-medium text-stone-900">{kit.validation.riskiestAssumption}</p>
      </Card>
      <Card title="Customer interview script">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-800">
          {kit.validation.interviewQuestions.map((q) => <li key={q}>{q}</li>)}
        </ol>
        <p className="mt-4 text-xs text-stone-500">Tip: ask about the past, not hypotheticals. Listen more than you talk.</p>
      </Card>
      <Card title="Your experiment">
        <p className="text-sm text-stone-800">{kit.validation.experiment}</p>
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <span className="font-medium">Go signal:</span> {kit.validation.goSignal}
        </div>
      </Card>
    </div>
  );
}

function Business({ kit }: { kit: Kit }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Pitch" className="lg:col-span-2">
        <p className="text-xl font-semibold text-indigo-700">{kit.pitch.tagline}</p>
        <p className="mt-3 text-stone-800">{kit.pitch.elevator}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${kit.pitch.tagline}\n\n${kit.pitch.elevator}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-4 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50"
        >
          {copied ? "Copied ✓" : "Copy pitch"}
        </button>
      </Card>
      <Card title="Pricing">
        <p className="text-sm text-stone-800">{kit.businessModel.pricing}</p>
        <p className="mt-4 text-sm font-medium">Revenue streams</p>
        <div className="mt-1.5"><List items={kit.businessModel.revenueStreams} /></div>
      </Card>
      <Card title="Your first 10 customers">
        <p className="text-sm text-stone-800">{kit.businessModel.first10Customers}</p>
      </Card>
    </div>
  );
}

function Chat({ id, initial, onClose }: { id: string; initial: ChatMessage[]; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    try {
      const res = await fetch(`/api/ideas/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-owner": ownerId() },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error ?? "Chat failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: m.at(-1)!.content + chunk }]);
      }
    } catch (e) {
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: `_${(e as Error).message}_` }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = ["What should I do first this week?", "Write a message I can post to find interviewees", "How do I get my first 10 users?", "Is my pricing right?"];

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">⟡</span>
        <div>
          <div className="font-semibold">Your co-founder</div>
          <div className="text-xs text-stone-500">Knows your plan and progress</div>
        </div>
        <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100" aria-label="Close chat">✕</button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-stone-600">Ask me anything about your plan. Some ideas:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-xl border border-stone-200 px-3 py-2 text-left hover:border-indigo-400 hover:bg-indigo-50">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-10 rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-white">{m.content}</div>
          ) : (
            <div key={i} className="mr-6 rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-stone-800">
              {m.content ? <Markdown text={m.content} /> : <span className="fp-pulse">Thinking…</span>}
            </div>
          ),
        )}
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-stone-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your co-founder…"
          className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600"
        />
        <button disabled={busy || !input.trim()} className="rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-40">
          Send
        </button>
      </form>
    </aside>
  );
}

function KitPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<KitResponse | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const load = useCallback(() => {
    api<KitResponse>(`/api/ideas/${id}`).then(setData, (e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function toggle(task: string, value: boolean) {
    if (!data) return;
    const done = value ? [...data.done, task] : data.done.filter((d) => d !== task);
    setData({ ...data, done, progress: { ...data.progress, done: done.length, pct: Math.round((done.length / data.progress.total) * 100) } });
    try {
      const res = await api<{ done: string[]; progress: KitResponse["progress"] }>(`/api/ideas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ taskId: task, done: value }),
      });
      setData((d) => (d ? { ...d, ...res } : d));
    } catch {
      load();
    }
  }

  if (error) return <div className="mx-auto max-w-xl px-5 py-20 text-center text-stone-600">{error}. <Link href="/new" className="text-indigo-600 underline">Start a new idea</Link></div>;
  if (!data) return <div className="py-32 text-center text-stone-500 fp-pulse">Loading your Launch Kit…</div>;

  const { kit, progress } = data;
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {data.demo && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Demo mode: this kit was generated from templates. Add an <code>ANTHROPIC_API_KEY</code> to get a fully personalised plan.
        </div>
      )}
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-stone-500">{data.founderName}&apos;s Launch Kit{data.cohort ? ` · Cohort ${data.cohort}` : ""}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{kit.name}</h1>
          <p className="mt-2 max-w-2xl text-lg text-stone-600">{kit.oneLiner}</p>
        </div>
        <div className="w-full rounded-2xl border border-stone-200 bg-white p-4 sm:w-64">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Roadmap progress</span>
            <span className="font-semibold text-indigo-700">{progress.pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-stone-100">
            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">{progress.done} of {progress.total} tasks done</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setShared(true);
              setTimeout(() => setShared(false), 1500);
            }}
            className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-stone-50"
          >
            {shared ? "Link copied ✓" : "Share with a mentor"}
          </button>
          {data.isOwner && (
            <button onClick={() => setChatOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              💬 Ask your co-founder
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {tab === "Overview" && <Overview kit={kit} />}
        {tab === "Validate" && <Validate kit={kit} />}
        {tab === "Lean Canvas" && <LeanCanvas kit={kit} />}
        {tab === "MVP & Build" && <Build kit={kit} />}
        {tab === "Roadmap" && <Roadmap kit={kit} done={data.done} onToggle={toggle} editable={data.isOwner} />}
        {tab === "Business & Pitch" && <Business kit={kit} />}
      </div>

      {/* Kept mounted while hidden so the conversation survives closing the panel. */}
      {data.isOwner && (
        <div className={chatOpen ? "" : "hidden"}>
          <Chat id={id} initial={data.messages} onClose={() => setChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-stone-500 fp-pulse">Loading your Launch Kit…</div>}>
      <KitPage />
    </Suspense>
  );
}
