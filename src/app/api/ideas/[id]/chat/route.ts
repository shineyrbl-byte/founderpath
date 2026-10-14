import { z } from "zod";
import { chatStream } from "@/lib/ai";
import { addMessage, getIdea, listMessages } from "@/lib/db";
import { errorResponse, ownerOf } from "@/lib/http";

const Body = z.object({ message: z.string().trim().min(1).max(2000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rec = getIdea((await params).id);
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  if (rec.owner !== ownerOf(req)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Empty message" }, { status: 400 });

  // Keep the last 20 turns so long chats stay fast and cheap.
  const history = [...listMessages(rec.id), { role: "user" as const, content: body.data.message }].slice(-20);
  if (history[0].role !== "user") history.shift();
  const gen = chatStream(rec.idea, rec.profile, rec.kit, rec.done, history);

  // Pull the first chunk before responding so API errors return a proper status.
  let first: IteratorResult<string>;
  try {
    first = await gen.next();
  } catch (err) {
    return errorResponse(err);
  }
  addMessage(rec.id, "user", body.data.message);

  const encoder = new TextEncoder();
  let reply = first.done ? "" : first.value;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (reply) controller.enqueue(encoder.encode(reply));
    },
    async pull(controller) {
      try {
        const { value, done } = await gen.next();
        if (done) {
          if (reply) addMessage(rec.id, "assistant", reply);
          controller.close();
          return;
        }
        reply += value;
        controller.enqueue(encoder.encode(value));
      } catch (err) {
        console.error(err);
        controller.enqueue(encoder.encode("\n\n_(Connection to the AI was interrupted. Please try again.)_"));
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
