import { connection } from "next/server";
import { listIdeasByCohort } from "@/lib/db";
import { progressOf, taskId } from "@/lib/schema";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  await connection();
  const ideas = listIdeasByCohort((await params).code.toUpperCase());
  return Response.json(
    ideas.map((r) => {
      const p = progressOf(r);
      const avg = Math.round(r.kit.scores.reduce((s, x) => s + x.score, 0) / Math.max(r.kit.scores.length, 1));
      // Current week = first roadmap week with an unfinished task.
      const current = r.kit.roadmap.find((w, wi) => w.tasks.some((_, ti) => !r.done.includes(taskId(wi + 1, ti))));
      return {
        id: r.id,
        founderName: r.founderName,
        name: r.kit.name,
        oneLiner: r.kit.oneLiner,
        skill: r.profile.skill,
        avgScore: avg,
        progress: p,
        currentWeek: current ? `Week ${current.week}: ${current.theme}` : "Launched 🎉",
        createdAt: r.createdAt,
      };
    }),
  );
}
