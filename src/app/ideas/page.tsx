"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

type Item = { id: string; name: string; oneLiner: string; cohort: string | null; createdAt: string; progress: { pct: number; done: number; total: number } };

export default function MyIdeas() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    api<Item[]>("/api/ideas").then(setItems, () => setItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center">
        <h1 className="text-3xl font-semibold tracking-tight">My ideas</h1>
        <Link href="/new" className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New idea</Link>
      </div>
      {!items && <p className="mt-10 text-stone-500 fp-pulse">Loading…</p>}
      {items?.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-600">No ideas yet. Every company started as one.</p>
          <Link href="/new" className="mt-4 inline-block font-medium text-indigo-600">Build your first Launch Kit →</Link>
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items?.map((i) => (
          <Link key={i.id} href={`/kit/${i.id}`} className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-indigo-400 hover:shadow-sm">
            <div className="flex items-baseline gap-2">
              <h2 className="font-semibold">{i.name}</h2>
              {i.cohort && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{i.cohort}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-stone-600">{i.oneLiner}</p>
            <div className="mt-4 h-1.5 rounded-full bg-stone-100">
              <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${i.progress.pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-stone-500">{i.progress.done}/{i.progress.total} tasks · {new Date(i.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
