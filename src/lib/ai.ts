import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { KitSchema, QuestionsSchema, type Kit, type Profile, type Questions } from "./schema";
import { demoKit, demoQuestions, demoReply } from "./demo";
import type { ChatMessage } from "./db";
import { geminiChat, geminiStructured } from "./gemini";

const MODEL = "claude-opus-5-5";
// If Opus declines a request, the API transparently retries on a fallback model.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export type Provider = "claude" | "gemini" | "demo";

// AI_PROVIDER picks explicitly; otherwise use whichever key is configured.
// No credentials -> demo mode, so the app still runs end to end for judges without a key.
export function provider(): Provider {
  const env = process.env;
  if (env.FOUNDERPATH_DEMO === "1") return "demo";
  const hasClaude = Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN);
  const hasGemini = Boolean(env.GEMINI_API_KEY);
  if (env.AI_PROVIDER === "claude" && hasClaude) return "claude";
  if (env.AI_PROVIDER === "gemini" && hasGemini) return "gemini";
  return hasClaude ? "claude" : hasGemini ? "gemini" : "demo";
}
export const isDemoMode = () => provider() === "demo";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const SKILL_LABEL: Record<Profile["skill"], string> = {
  "no-code": "cannot code at all; recommend only no-code / low-code tools",
  "some-code": "knows some HTML/JS or Python; can follow tutorials and use low-code + simple scripts",
  developer: "is a capable software developer",
};
const BUDGET_LABEL: Record<Profile["budget"], string> = {
  zero: "$0 (free tiers only)",
  "under-100": "under $100 total",
  "under-1000": "under $1,000 total",
};
const GOAL_LABEL: Record<Profile["goal"], string> = {
  "side-project": "a side project that might earn some income",
  startup: "a venture they want to grow into a real company",
  school: "a school / university project they want to make real",
};

function founderContext(idea: string, profile: Profile) {
  return `<idea>\n${idea}\n</idea>
<founder>
- Technical skill: ${SKILL_LABEL[profile.skill]}
- Time available: ${profile.hoursPerWeek} hours per week
- Budget: ${BUDGET_LABEL[profile.budget]}
- Goal: ${GOAL_LABEL[profile.goal]}
</founder>`;
}

const COFOUNDER_PERSONA = `You are FounderPath, an experienced startup co-founder and mentor who helps first-time founders with no connections, money or technical background get from "I have an idea" to "I built something real".
You are candid: point out weak spots and risks plainly, but stay encouraging and always give a concrete next step. Everything you recommend must be doable by this specific founder with their skill, time and budget. Prefer real, named tools and real competitors over generic advice. Write in plain language a high-school student would understand.`;

async function parse<T extends z.ZodType>(schema: T, system: string, user: string, effort: "low" | "medium") {
  if (provider() === "gemini") return geminiStructured(schema, system, user);
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") throw new Error("The AI declined to help with this idea. Try rephrasing it.");
  if (res.stop_reason === "max_tokens") throw new Error("The response was cut off. Please try again.");
  if (!res.parsed_output) throw new Error("Could not read the AI response. Please try again.");
  return res.parsed_output as z.infer<T>;
}

export async function generateQuestions(idea: string, profile: Profile): Promise<Questions> {
  if (isDemoMode()) return demoQuestions(idea);
  return parse(
    QuestionsSchema,
    COFOUNDER_PERSONA,
    `${founderContext(idea, profile)}

Before writing a launch plan, ask this founder exactly 4 sharp follow-up questions whose answers would most change the plan (e.g. who exactly has this problem, how they solve it today, what the founder's unfair advantage or access is, how it could make money). Keep each question under 20 words.`,
    "low",
  );
}

export async function generateKit(
  idea: string,
  profile: Profile,
  answers: { question: string; answer: string }[],
): Promise<Kit> {
  if (isDemoMode()) return demoKit(idea, profile);
  const qa = answers
    .filter((a) => a.answer.trim())
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");
  return parse(
    KitSchema,
    COFOUNDER_PERSONA,
    `${founderContext(idea, profile)}

<founder_answers>
${qa || "(no answers given)"}
</founder_answers>

Create this founder's Launch Kit: a complete, specific plan to validate and build the first version of this idea.
- The build plan and roadmap must fit their skill level, ${profile.hoursPerWeek} h/week and budget. Name real tools with real prices.
- Roadmap: 6 weeks. Week 1 is customer validation before building. End with getting the first real users.
- Competitors must be real products or real substitutes people use today.
- Scores are honest, 1-10; don't inflate them.
- Keep every string concise: one or two sentences, bullet-sized list items.`,
    "medium",
  );
}

function kitDigest(idea: string, profile: Profile, kit: Kit, done: string[]) {
  return `${founderContext(idea, profile)}

<launch_kit>
${JSON.stringify(kit)}
</launch_kit>

<completed_task_ids>${done.join(", ") || "none yet"}</completed_task_ids>
(Task ids are w{week}t{index}, index starting at 0.)`;
}

/** Streams the co-founder chat reply as plain text chunks. */
export async function* chatStream(
  idea: string,
  profile: Profile,
  kit: Kit,
  done: string[],
  history: ChatMessage[],
): AsyncGenerator<string> {
  if (isDemoMode()) {
    for (const word of demoReply(kit, history.at(-1)?.content ?? "").split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 15));
      yield word;
    }
    return;
  }
  const chatInstructions = `${kitDigest(idea, profile, kit, done)}

You are now chatting with this founder about their plan. Answer in under 200 words unless they ask for a longer artifact (an email, a script, a landing-page copy). Use short markdown: bullet points and **bold** only.`;
  if (provider() === "gemini") {
    yield* geminiChat(`${COFOUNDER_PERSONA}\n\n${chatInstructions}`, history);
    return;
  }
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    ...FALLBACK,
    output_config: { effort: "low" },
    // The kit is stable across a conversation, so cache it as part of the system prefix.
    system: [
      { type: "text", text: COFOUNDER_PERSONA },
      { type: "text", text: chatInstructions, cache_control: { type: "ephemeral" } },
    ],
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") yield "\n\n_(I can't help with that one. Try asking another way.)_";
}

