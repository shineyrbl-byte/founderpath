// Seeds a cohort with sample founders at different stages, for demos and the video.
// Goes through the running app's own API, so kits use whatever AI provider .env.local configures
// (about 1-3 minutes per kit on Gemini's free tier; instant in demo mode).
//
// usage: npm run dev   (in another terminal), then
//        npm run seed [-- --cohort BITS-GOA --url http://localhost:3000]
// Safe to re-run: founders already in the cohort are skipped.

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const COHORT = arg("cohort", "BITS-GOA").toUpperCase();
const URL_BASE = arg("url", "http://localhost:3000");
// Seeded ideas belong to a separate owner, so they don't clutter your own "My ideas" page.
const OWNER = "seed-" + COHORT.toLowerCase();

const FOUNDERS = [
  {
    founderName: "Aarav Mehta",
    idea: "An app for hostel students to book washing-machine slots, so nobody waits in line or finds their clothes dumped on the floor.",
    profile: { skill: "some-code", hoursPerWeek: 8, budget: "zero", goal: "school" },
    answers: [
      ["Who exactly has this problem?", "Students in BITS Goa hostels, about 300 per block sharing 4 machines."],
      ["How do they deal with it today?", "They walk down to check, or ask in the hostel WhatsApp group. Clothes get left in machines for hours."],
      ["Why are you the right person?", "I live in the hostel, know the wardens, and can test it with my wing next week."],
      ["Who would pay?", "Students won't, but the hostel office or the laundry vendor might pay a small monthly fee."],
    ],
    tasksDone: 7,
  },
  {
    founderName: "Diya Fernandes",
    idea: "A marketplace connecting Goan home chefs with students who want affordable home-cooked tiffins delivered near campus.",
    profile: { skill: "no-code", hoursPerWeek: 6, budget: "under-100", goal: "side-project" },
    answers: [
      ["Who exactly has this problem?", "Students tired of mess food, and home cooks in Zuarinagar and Vasco who want extra income."],
      ["How do they deal with it today?", "A few aunties take orders over WhatsApp, but students only hear about them by word of mouth."],
      ["Why are you the right person?", "I'm from Goa and my mother already cooks for four students."],
      ["Who would pay?", "Students pay per tiffin (around ₹80); I take a 10% commission from the chef."],
    ],
    tasksDone: 4,
  },
  {
    founderName: "Kabir Rao",
    idea: "A platform that matches college fest organisers with local businesses looking to sponsor student events.",
    profile: { skill: "developer", hoursPerWeek: 12, budget: "zero", goal: "startup" },
    answers: [
      ["Who exactly has this problem?", "Sponsorship teams for college fests, who cold-call hundreds of businesses every year."],
      ["How do they deal with it today?", "Spreadsheets of contacts handed down from seniors, plus cold emails with a PDF deck."],
      ["Why are you the right person?", "I led sponsorships for our fest and closed ₹4 lakh from 20 local sponsors."],
      ["Who would pay?", "Businesses pay a listing fee, and fests pay a small cut of sponsorships closed."],
    ],
    tasksDone: 11,
  },
  {
    founderName: "Sneha Pillai",
    idea: "A campus exchange where seniors sell or donate used textbooks, lab coats and drafters to juniors.",
    profile: { skill: "no-code", hoursPerWeek: 4, budget: "zero", goal: "side-project" },
    answers: [
      ["Who exactly has this problem?", "First-years who buy new lab coats and drafters, and seniors who throw theirs away."],
      ["How do they deal with it today?", "Random posts in batch WhatsApp groups that get buried within hours."],
      ["Why are you the right person?", "I'm on the student welfare team and can announce it to every freshman."],
      ["Who would pay?", "Probably nobody at first; it could be funded by the student union or small listing fees."],
    ],
    tasksDone: 0,
  },
];

async function api(path, init = {}) {
  const res = await fetch(URL_BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-owner": OWNER, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function main() {
  try {
    await fetch(URL_BASE);
  } catch {
    console.error(`Can't reach ${URL_BASE}. Start the app with "npm run dev" first.`);
    process.exit(1);
  }

  const existing = new Set((await api(`/api/cohort/${encodeURIComponent(COHORT)}`)).map((r) => r.founderName));
  console.log(`Seeding cohort ${COHORT} at ${URL_BASE}`);
  let failed = 0;

  for (const f of FOUNDERS) {
    if (existing.has(f.founderName)) {
      console.log(`- ${f.founderName}: already in cohort, skipping`);
      continue;
    }
    const started = Date.now();
    process.stdout.write(`- ${f.founderName}: generating Launch Kit (can take 1-3 minutes)... `);
    try {
      const { id } = await api("/api/ideas", {
        method: "POST",
        body: JSON.stringify({
          founderName: f.founderName,
          idea: f.idea,
          profile: f.profile,
          answers: f.answers.map(([question, answer]) => ({ question, answer })),
          cohort: COHORT,
        }),
      });
      // Tick roadmap tasks in order, so each founder sits at a different week.
      const { kit } = await api(`/api/ideas/${id}`);
      const taskIds = kit.roadmap.flatMap((w, wi) => w.tasks.map((_, ti) => `w${wi + 1}t${ti}`));
      for (const taskId of taskIds.slice(0, f.tasksDone)) {
        await api(`/api/ideas/${id}`, { method: "PATCH", body: JSON.stringify({ taskId, done: true }) });
      }
      console.log(`done in ${Math.round((Date.now() - started) / 1000)} s: "${kit.name}" (/kit/${id})`);
    } catch (err) {
      failed++;
      console.log(`failed: ${err.message}`);
    }
  }

  console.log(`\nOpen ${URL_BASE}/cohort/${encodeURIComponent(COHORT)}`);
  if (failed) {
    console.log(`${failed} founder(s) failed. Re-run "npm run seed" to retry just those.`);
    process.exit(1);
  }
}

main();
