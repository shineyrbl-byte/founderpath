import { connection } from "next/server";
import { z } from "zod";
import { getIdea, listMessages, setDone } from "@/lib/db";
import { ownerOf } from "@/lib/http";
import { progressOf } from "@/lib/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  await connection();
  const rec = getIdea((await params).id);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  const { owner, ...pub } = rec;
  return Response.json({
    ...pub,
    isOwner: owner === ownerOf(req),
    progress: progressOf(rec),
    messages: owner === ownerOf(req) ? listMessages(rec.id) : [],
  });
}

const Patch = z.object({ taskId: z.string().regex(/^w\d+t\d+$/), done: z.boolean() });

export async function PATCH(req: Request, { params }: Ctx) {
  const rec = getIdea((await params).id);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  if (rec.owner !== ownerOf(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const done = new Set(rec.done);
  if (body.data.done) done.add(body.data.taskId);
  else done.delete(body.data.taskId);
  setDone(rec.id, [...done]);
  return Response.json({ done: [...done], progress: progressOf({ kit: rec.kit, done: [...done] }) });
}
