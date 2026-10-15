import type { Kit, Profile, Questions } from "./schema";

// Offline fallback used when no Anthropic credentials are configured.
// Output is templated from the idea text so the full product flow can be demoed.

function shortName(idea: string) {
  const words = idea
    .replace(/[^a-zA-Z ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^(that|with|they|their|which|from|have|help|helps|people|where|would|could|this|app|platform)$/i.test(w));
  const base = words[0] ? words[0][0].toUpperCase() + words[0].slice(1).toLowerCase() : "Launch";
  return `${base}ly`;
}

const firstSentence = (idea: string) => idea.split(/(?<=[.!?])\s/)[0].trim().replace(/[.!?]$/, "");

export function demoQuestions(idea: string): Questions {
  void idea;
  return {
    questions: [
      {
        question: "Who exactly has this problem? Describe one real person.",
        why: "A specific first customer makes every other decision easier.",
        placeholder: "e.g. Priya, a 2nd-year student who cooks for herself on a tight budget",
      },
      {
        question: "How do they deal with it today, and what's annoying about that?",
        why: "Your real competitor is usually a workaround, not another startup.",
        placeholder: "e.g. WhatsApp groups and spreadsheets that nobody updates",
      },
      {
        question: "Why are you the right person to build this?",
        why: "Access to users or insight is an unfair advantage worth naming.",
        placeholder: "e.g. I'm in that community and know 50 people with this problem",
      },
      {
        question: "Who would pay for it, and roughly how much?",
        why: "Knowing the payer early shapes the product and pricing.",
        placeholder: "e.g. Students wouldn't pay, but campus canteens might pay $20/month",
      },
    ],
  };
}

const TOOLS: Record<Profile["skill"], Kit["buildPlan"]> = {
  "no-code": {
    approach: "Build with no-code tools: a Softr front-end on top of an Airtable database, with Tally forms and Zapier automations. No programming needed.",
    tools: [
      { name: "Airtable", purpose: "Database for users and listings", cost: "Free" },
      { name: "Softr", purpose: "Turns Airtable into a web app with logins", cost: "Free – $59/mo" },
      { name: "Tally", purpose: "Sign-up and feedback forms", cost: "Free" },
      { name: "Zapier", purpose: "Email notifications and automations", cost: "Free tier" },
    ],
    estimatedMonthlyCost: "$0 – $60",
  },
  "some-code": {
    approach: "Start with a low-code stack: Next.js template on Vercel with Supabase for auth and data, using AI coding assistants to fill gaps.",
    tools: [
      { name: "Supabase", purpose: "Database, auth, file storage", cost: "Free" },
      { name: "Vercel", purpose: "Hosting the web app", cost: "Free" },
      { name: "Cursor / Claude Code", purpose: "AI pair-programmer", cost: "$0 – $20/mo" },
      { name: "Stripe", purpose: "Payments when ready", cost: "2.9% + 30¢ per charge" },
    ],
    estimatedMonthlyCost: "$0 – $25",
  },
  developer: {
    approach: "Ship a thin full-stack MVP: Next.js + Postgres (Supabase) on Vercel, Stripe for payments, PostHog for analytics. Optimise for speed, not scale.",
    tools: [
      { name: "Next.js + Vercel", purpose: "Web app and hosting", cost: "Free" },
      { name: "Supabase Postgres", purpose: "Database and auth", cost: "Free" },
      { name: "Stripe", purpose: "Payments", cost: "2.9% + 30¢ per charge" },
      { name: "PostHog", purpose: "Product analytics", cost: "Free" },
    ],
    estimatedMonthlyCost: "$0 – $20",
  },
};

export function demoKit(idea: string, profile: Profile): Kit {
  const name = shortName(idea);
  const core = firstSentence(idea);
  return {
    name,
    oneLiner: `${name}: ${core.charAt(0).toLowerCase()}${core.slice(1)}.`,
    problem: {
      statement: "Today people deal with this through slow, manual workarounds that cost them time and money, and nothing is built specifically for them.",
      whoFeelsIt: "Busy individuals and small teams who face this weekly but can't justify expensive tools.",
      currentAlternatives: ["Spreadsheets and notes apps", "WhatsApp / social media groups", "Asking friends for help", "Generic tools not built for this"],
    },
    targetCustomer: {
      primaryPersona: "A 19–30 year old who faces this problem at least once a week and already uses their phone to manage it.",
      earlyAdopters: "People in your own community (campus, neighbourhood, online group) who complain about this problem out loud.",
      whereToFindThem: ["Reddit and Discord communities", "Campus / local WhatsApp groups", "Instagram and TikTok niche creators", "Local meetups and clubs"],
    },
    competitors: [
      { name: "Spreadsheets (Google Sheets)", whatTheyDo: "Free, flexible manual tracking", gap: "No automation, easy to abandon" },
      { name: "Facebook / WhatsApp groups", whatTheyDo: "Informal community coordination", gap: "Messy, unsearchable, no trust layer" },
      { name: "Large horizontal apps", whatTheyDo: "General-purpose tools for everyone", gap: "Too broad and expensive for this specific need" },
    ],
    leanCanvas: {
      problem: ["Current workarounds are slow and manual", "No tool fits this specific need", "Hard to trust or coordinate with others"],
      customerSegments: ["Early adopters in the founder's own community", "Students and young professionals", "Small businesses (later)"],
      uniqueValueProposition: ["The simplest, most trusted way to solve this, built for one community first"],
      solution: ["One focused workflow that replaces the workaround", "Reminders and automation", "Simple sharing"],
      channels: ["Community posts and word of mouth", "Short-form video demos", "Partnerships with clubs and local groups"],
      revenueStreams: ["Freemium with a Pro plan", "B2B plan for organisations"],
      costStructure: ["Hosting and tools (~$0–60/mo)", "Founder time", "Small marketing experiments"],
      keyMetrics: ["Weekly active users", "% of users who return in week 2", "Free → paid conversion"],
      unfairAdvantage: ["Founder is part of the target community", "Early trust and feedback loop"],
    },
    mvp: {
      mustHave: [
        { feature: "Sign up in under 30 seconds", why: "Every extra step loses early users" },
        { feature: "The one core workflow", why: "This is the value: do it 10x better than the workaround" },
        { feature: "Simple dashboard of activity", why: "Users need to see progress to come back" },
        { feature: "Feedback button", why: "Fastest way to learn what to build next" },
      ],
      notNow: ["Mobile app (start with a mobile-friendly website)", "Payments inside the app", "AI features", "Admin analytics"],
      successMetric: "10 people use it 3 weeks in a row without being reminded by you.",
    },
    buildPlan: TOOLS[profile.skill],
    roadmap: [
      {
        week: 1,
        theme: "Talk to customers before building",
        tasks: [
          { title: "List 20 people who have this problem", detail: "Friends, classmates, community members; write their names down." },
          { title: "Run 5 problem interviews", detail: "Use the interview script in the Validate tab. Don't pitch, just listen." },
          { title: "Write down the top 3 pains you heard", detail: "Use their exact words; these become your landing page copy." },
        ],
      },
      {
        week: 2,
        theme: "Test demand with a landing page",
        tasks: [
          { title: "Build a one-page landing site", detail: "Headline = the pain in their words. Add a waitlist form." },
          { title: "Share it in 3 communities", detail: "Post where your early adopters already hang out." },
          { title: "Goal: 30 waitlist sign-ups", detail: "If you get under 10, revisit the problem or audience." },
        ],
      },
      {
        week: 3,
        theme: "Build the smallest working version",
        tasks: [
          { title: "Set up your tools", detail: `${TOOLS[profile.skill].tools.map((t) => t.name).join(", ")}.` },
          { title: "Build the core workflow only", detail: "Ignore everything in the 'Not now' list." },
          { title: "Test it yourself end to end", detail: "Use it for real for two days." },
        ],
      },
      {
        week: 4,
        theme: "First 5 users",
        tasks: [
          { title: "Onboard 5 people from the waitlist personally", detail: "Watch them use it on a call or in person." },
          { title: "Fix the top 3 friction points", detail: "Only fix what blocks people from getting value." },
          { title: "Ask each user for one referral", detail: "Referrals show real value." },
        ],
      },
      {
        week: 5,
        theme: "Retention and money",
        tasks: [
          { title: "Track weekly active users", detail: "A simple spreadsheet is fine." },
          { title: "Test willingness to pay", detail: "Offer a Pro plan pre-sale to your most active users." },
          { title: "Interview 3 users who stopped", detail: "Learn why they left." },
        ],
      },
      {
        week: 6,
        theme: "Launch publicly",
        tasks: [
          { title: "Record a 60-second demo video", detail: "Show the before/after." },
          { title: "Launch on Product Hunt / Reddit / campus", detail: "Pick the channel where your users are." },
          { title: "Decide: double down, pivot or stop", detail: "Use your success metric honestly." },
        ],
      },
    ],
    validation: {
      riskiestAssumption: "People feel this pain strongly enough to switch from their current workaround.",
      interviewQuestions: [
        "Tell me about the last time you dealt with this. What happened?",
        "How do you handle it today?",
        "What's the most frustrating part of that?",
        "Have you tried anything else to solve it? Why did/didn't it work?",
        "If this were solved perfectly, what would that look like for you?",
        "Who else do you know who has this problem?",
      ],
      experiment: "Landing page + waitlist shared in 3 communities for 7 days.",
      goSignal: "30+ sign-ups and at least 3 people asking 'when can I use it?'",
    },
    businessModel: {
      pricing: "Free for individuals; Pro at $5/month for power features; $49/month plan for organisations.",
      revenueStreams: ["Pro subscriptions", "Organisation / B2B plans", "Partnerships and sponsorships (later)"],
      first10Customers: "Hand-pick 10 of your most active free users, offer them a founding-member price of $2/month for life in exchange for feedback.",
    },
    pitch: {
      tagline: `${name}: the simpler way.`,
      elevator: `Right now people handle this with messy workarounds like spreadsheets and group chats. ${name} gives them one simple tool that does the job in minutes. We're starting with our own community, where we've already talked to people who feel this pain, and we'll grow through referrals and a freemium model.`,
    },
    scores: [
      { label: "Problem clarity", score: 7, note: "Clear pain, but needs to be confirmed in interviews." },
      { label: "Market pull", score: 6, note: "Real demand likely; size depends on the niche you start with." },
      { label: "Feasibility for this founder", score: profile.skill === "no-code" ? 7 : 8, note: "Buildable with the recommended tools in ~4 weeks." },
      { label: "Differentiation", score: 5, note: "Focus and community access are your edge; sharpen this." },
    ],
    risks: [
      { risk: "People like the idea but don't change behaviour", mitigation: "Measure real usage, not compliments." },
      { risk: "Scope creep delays launch", mitigation: "Ship only the must-have list first." },
      { risk: "Hard to reach users beyond your circle", mitigation: "Test 2–3 acquisition channels in week 5." },
    ],
  };
}

export function demoReply(kit: Kit, question: string): string {
  const q = question.toLowerCase();
  if (q.includes("price") || q.includes("money") || q.includes("charge"))
    return `**Pricing idea:** ${kit.businessModel.pricing}\n\n- Start by asking your 5 most active users if they'd pre-pay.\n- Don't build payments yet: use a Stripe payment link.\n\n_(Demo mode: add an AI API key for tailored answers.)_`;
  if (q.includes("start") || q.includes("first") || q.includes("next"))
    return `**Your next step:** ${kit.roadmap[0].tasks[0].title}.\n\n${kit.roadmap[0].tasks[0].detail}\n\nThen run 5 interviews using the script in the **Validate** tab.\n\n_(Demo mode: add an AI API key for tailored answers.)_`;
  return `Good question. Based on your Launch Kit, focus on your riskiest assumption first:\n\n> ${kit.validation.riskiestAssumption}\n\n- Run the experiment: ${kit.validation.experiment}\n- Go signal: ${kit.validation.goSignal}\n\n_(Demo mode: add an AI API key for tailored answers.)_`;
}
