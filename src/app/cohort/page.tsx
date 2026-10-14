"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CohortLanding() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-indigo-600">FounderPath Campus</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Mentor 100 student founders without 100 meetings.</h1>
          <p className="mt-4 text-stone-600">
            Give your school, incubator or hackathon a cohort code. Every student gets an AI co-founder; you get one
            dashboard showing who&apos;s validating, who&apos;s building and who&apos;s stuck.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-stone-700">
            <li>✓ Live progress for every team</li>
            <li>✓ Spot stuck founders early and step in</li>
            <li>✓ Idea quality scores to prioritise mentor time</li>
            <li>✓ $499/year per cohort, unlimited students</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold">Open a cohort dashboard</h2>
          <p className="mt-1 text-sm text-stone-500">Students join by entering this code when they create an idea, or via the invite link.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) router.push(`/cohort/${encodeURIComponent(code.trim().toUpperCase())}`);
            }}
            className="mt-5 flex gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BITS-GOA"
              className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 uppercase outline-none focus:border-indigo-600"
            />
            <button className="rounded-xl bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700">Open</button>
          </form>
        </div>
      </div>
    </div>
  );
}
