import { z } from "zod";
import { generateQuestions } from "@/lib/ai";
import { ProfileSchema } from "@/lib/schema";
import { errorResponse } from "@/lib/http";

const Body = z.object({ idea: z.string().trim().min(15).max(2000), profile: ProfileSchema });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Describe your idea in at least a sentence." }, { status: 400 });
  try {
    return Response.json(await generateQuestions(body.data.idea, body.data.profile));
  } catch (err) {
    return errorResponse(err);
  }
}
