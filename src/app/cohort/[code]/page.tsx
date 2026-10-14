"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";

type Row = {
  id: string;
  founderName: string;
  name: string;
  oneLiner: string;
  skill: string;
  avgScore: number;
  progress: { pct: number; done: number; total: number };
  currentWeek: string;
  createdAt: string;
};

function CohortDashboard() {
  const { code } = useParams<{ code: string }>();
  const cohort = decodeURIComponent(code).toUpperCase();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRows = () => api<Row[]>(`/api/cohort/${encodeURIComponent(cohort)}`).then(setRows, () => setRows([]));
    fetchRows();
    const t = setInterval(fetchRows, 10000);
    return () => clearInterval(t);
  }, [cohort]);

  const avgProgress = rows?.length ? Math.round(rows.reduce((s, r) => s + r.progress.pct, 0) / rows.length) : 0;
  const stuck = rows?.filter((r) => r.progress.pct === 0).length ?? 0;
  const invite = typeof window !== "undefined" ? `${window.location.origin}/new?cohort=${encodeURIComponent(cohort)}` : "";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm text-stone-500">Cohort dashboard</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{cohort}</h1>
        <button
          onClick={() => {
            navigator.clipboard.writeText(invite);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="ml-auto rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-stone-50"
        >
          {copied ? "Invite link copied ✓" : "Copy student invite link"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Founders", rows?.length ?? "–"],
          ["Avg. roadmap progress", `${avgProgress}%`],
          ["Not started yet", stuck],
        ].map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="text-sm text-stone-500">{label}</div>
            <div className="mt-1 text-3xl font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-5 py-3">Founder</th>
              <th className="px-5 py-3">Idea</th>
              <th className="px-5 py-3">Idea score</th>
              <th className="px-5 py-3">Now working on</th>
              <th className="px-5 py-3 w-48">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-stone-500">No founders yet. Share the invite link with your students.</td></tr>
            )}
            {rows?.map((r) => (
              <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-5 py-3">
                  <div className="font-medium">{r.founderName}</div>
                  <div className="text-xs text-stone-500">{r.skill}</div>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/kit/${r.id}`} className="font-medium text-indigo-700 hover:underline">{r.name}</Link>
                  <div className="line-clamp-1 max-w-xs text-xs text-stone-500">{r.oneLiner}</div>
                </td>
                <td className="px-5 py-3 font-semibold">{r.avgScore}/10</td>
                <td className="px-5 py-3 text-stone-700">{r.currentWeek}</td>
                <td className="px-5 py-3">
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className={`h-2 rounded-full ${r.progress.pct === 0 ? "bg-amber-400" : "bg-indigo-600"}`} style={{ width: `${Math.max(r.progress.pct, 3)}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{r.progress.done}/{r.progress.total} tasks</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-stone-500 fp-pulse">Loading cohort…</div>}>
      <CohortDashboard />
    </Suspense>
  );
}
