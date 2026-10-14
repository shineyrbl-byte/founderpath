import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { IdeaRecord } from "./schema";

// SQLite keeps the hackathon build zero-config. Every query lives in this file,
// so moving to Postgres later means swapping this module only.
const dir = path.join(process.cwd(), "data");
mkdirSync(dir, { recursive: true });

const globalForDb = globalThis as unknown as { fpDb?: DatabaseSync };
const db = globalForDb.fpDb ?? new DatabaseSync(path.join(dir, "founderpath.db"));
globalForDb.fpDb = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    cohort TEXT,
    founder_name TEXT NOT NULL,
    idea TEXT NOT NULL,
    profile TEXT NOT NULL,
    answers TEXT NOT NULL,
    kit TEXT NOT NULL,
    done TEXT NOT NULL DEFAULT '[]',
    demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ideas_owner ON ideas(owner);
  CREATE INDEX IF NOT EXISTS ideas_cohort ON ideas(cohort);
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idea_id TEXT NOT NULL REFERENCES ideas(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_idea ON messages(idea_id);
`);

type Row = Record<string, unknown>;

function toRecord(r: Row): IdeaRecord {
  return {
    id: r.id as string,
    owner: r.owner as string,
    cohort: (r.cohort as string | null) ?? null,
    founderName: r.founder_name as string,
    idea: r.idea as string,
    profile: JSON.parse(r.profile as string),
    answers: JSON.parse(r.answers as string),
    kit: JSON.parse(r.kit as string),
    done: JSON.parse(r.done as string),
    demo: Boolean(r.demo),
    createdAt: r.created_at as string,
  };
}

export function insertIdea(rec: IdeaRecord) {
  db.prepare(
    `INSERT INTO ideas (id, owner, cohort, founder_name, idea, profile, answers, kit, done, demo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    rec.id,
    rec.owner,
    rec.cohort,
    rec.founderName,
    rec.idea,
    JSON.stringify(rec.profile),
    JSON.stringify(rec.answers),
    JSON.stringify(rec.kit),
    JSON.stringify(rec.done),
    rec.demo ? 1 : 0,
    rec.createdAt,
  );
}

export function getIdea(id: string): IdeaRecord | null {
  const r = db.prepare("SELECT * FROM ideas WHERE id = ?").get(id) as Row | undefined;
  return r ? toRecord(r) : null;
}

export function listIdeasByOwner(owner: string): IdeaRecord[] {
  return (db.prepare("SELECT * FROM ideas WHERE owner = ? ORDER BY created_at DESC").all(owner) as Row[]).map(toRecord);
}

export function listIdeasByCohort(cohort: string): IdeaRecord[] {
  return (db.prepare("SELECT * FROM ideas WHERE cohort = ? ORDER BY created_at DESC").all(cohort) as Row[]).map(toRecord);
}

export function setDone(id: string, done: string[]) {
  db.prepare("UPDATE ideas SET done = ? WHERE id = ?").run(JSON.stringify(done), id);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function listMessages(ideaId: string): ChatMessage[] {
  return db
    .prepare("SELECT role, content FROM messages WHERE idea_id = ? ORDER BY id")
    .all(ideaId) as ChatMessage[];
}

export function addMessage(ideaId: string, role: ChatMessage["role"], content: string) {
  db.prepare("INSERT INTO messages (idea_id, role, content, created_at) VALUES (?, ?, ?, ?)").run(
    ideaId,
    role,
    content,
    new Date().toISOString(),
  );
}
