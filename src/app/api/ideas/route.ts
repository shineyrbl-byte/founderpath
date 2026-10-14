import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { z } from "zod";
import { generateKit, isDemoMode } from "@/lib/ai";
import { insertIdea, listIdeasByOwner } from "@/lib/db";
import { ProfileSchema, progressOf, type IdeaRecord } from "@/lib/schema";
import { errorResponse, ownerOf } from "@/lib/http";

const Body = z.object({
  founderName: z.string().trim().min(1).max(60),
  idea: z.string().trim().min(15).max(2000),
  profile: ProfileSchema,
  answers: z.array(z.object({ question: z.string().max(300), answer: z.string().max(1000) })).max(6),
  cohort: z
    .string()
    .trim()
    .max(32)
    .transform((s) => s.toUpperCase() || null)
    .nullable()
    .optional(),
});

export async function POST(req: Request) {
  const owner = ownerOf(req);
  if (!owner) return Response.json({ error: "Missing owner." }, { status: 400 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Please fill in your name and idea." }, { status: 400 });
  const { founderName, idea, profile, answers, cohort } = body.data;
  try {
    const kit = await generateKit(idea, profile, answers);
    const rec: IdeaRecord = {
      id: randomUUID().slice(0, 8),
      owner,
      cohort: cohort ?? null,
      founderName,
      idea,
      profile,
      answers,
      kit,
      done: [],
      demo: isDemoMode(),
      createdAt: new Date().toISOString(),
    };
    insertIdea(rec);
    return Response.json({ id: rec.id });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET(req: Request) {
  await connection();
  const owner = ownerOf(req);
  if (!owner) return Response.json([]);
  return Response.json(
    listIdeasByOwner(owner).map((r) => ({
      id: r.id,
      name: r.kit.name,
      oneLiner: r.kit.oneLiner,
      cohort: r.cohort,
      createdAt: r.createdAt,
      progress: progressOf(r),
    })),
  );
}
