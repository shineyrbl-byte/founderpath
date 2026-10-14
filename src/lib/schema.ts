import { z } from "zod";

export const ProfileSchema = z.object({
  skill: z.enum(["no-code", "some-code", "developer"]),
  hoursPerWeek: z.number().int().positive().max(80),
  budget: z.enum(["zero", "under-100", "under-1000"]),
  goal: z.enum(["side-project", "startup", "school"]),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const QuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        why: z.string().describe("One short sentence on why this matters for the plan"),
        placeholder: z.string().describe("An example answer to show as input placeholder"),
      }),
    )
    .describe("Exactly 4 questions"),
});
export type Questions = z.infer<typeof QuestionsSchema>;

const strList = z.array(z.string());

export const KitSchema = z.object({
  name: z.string().describe("A short, memorable working name for the product"),
  oneLiner: z.string(),
  problem: z.object({
    statement: z.string(),
    whoFeelsIt: z.string(),
    currentAlternatives: strList,
  }),
  targetCustomer: z.object({
    primaryPersona: z.string(),
    earlyAdopters: z.string(),
    whereToFindThem: strList,
  }),
  competitors: z
    .array(z.object({ name: z.string(), whatTheyDo: z.string(), gap: z.string() }))
    .describe("3-5 real, existing competitors or substitutes"),
  leanCanvas: z.object({
    problem: strList,
    customerSegments: strList,
    uniqueValueProposition: strList,
    solution: strList,
    channels: strList,
    revenueStreams: strList,
    costStructure: strList,
    keyMetrics: strList,
    unfairAdvantage: strList,
  }),
  mvp: z.object({
    mustHave: z.array(z.object({ feature: z.string(), why: z.string() })).describe("3-5 features"),
    notNow: strList,
    successMetric: z.string(),
  }),
  buildPlan: z.object({
    approach: z.string().describe("How this founder should build it given their skill level"),
    tools: z.array(z.object({ name: z.string(), purpose: z.string(), cost: z.string() })),
    estimatedMonthlyCost: z.string(),
  }),
  roadmap: z
    .array(
      z.object({
        week: z.number().int(),
        theme: z.string(),
        tasks: z.array(z.object({ title: z.string(), detail: z.string() })).describe("3-4 tasks"),
      }),
    )
    .describe("A 6-week plan from validation to first users"),
  validation: z.object({
    riskiestAssumption: z.string(),
    interviewQuestions: strList,
    experiment: z.string(),
    goSignal: z.string(),
  }),
  businessModel: z.object({
    pricing: z.string(),
    revenueStreams: strList,
    first10Customers: z.string(),
  }),
  pitch: z.object({ tagline: z.string(), elevator: z.string() }),
  scores: z
    .array(z.object({ label: z.string(), score: z.number().int().describe("1-10"), note: z.string() }))
    .describe("Exactly 4: Problem clarity, Market pull, Feasibility for this founder, Differentiation"),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
});
export type Kit = z.infer<typeof KitSchema>;

export type IdeaRecord = {
  id: string;
  owner: string;
  cohort: string | null;
  founderName: string;
  idea: string;
  profile: Profile;
  answers: { question: string; answer: string }[];
  kit: Kit;
  done: string[];
  demo: boolean;
  createdAt: string;
};

export const taskId = (week: number, i: number) => `w${week}t${i}`;

export function progressOf(rec: Pick<IdeaRecord, "kit" | "done">) {
  const total = rec.kit.roadmap.reduce((n, w) => n + w.tasks.length, 0);
  return { done: rec.done.length, total, pct: total ? Math.round((rec.done.length / total) * 100) : 0 };
}
