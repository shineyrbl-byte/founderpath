import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ChatMessage } from "./db";

// Free-tier alternative to Claude. The aliases track Google's current Flash models;
// override the first choice with GEMINI_MODEL to pin a specific version.
// Flash-Lite is the fallback when the main model is overloaded or out of free quota.
const models = () => [...new Set([process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"])];

// 503 = model overloaded, 429 = quota/rate limit, 500 = transient server error.
const isRetryable = (err: unknown) => err instanceof ApiError && [429, 500, 503].includes(err.status);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tries each model twice with a short backoff before moving to the next; rethrows the last error. */
async function withFallback<T>(call: (model: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (const model of models()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await call(model);
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) throw err;
        if (attempt === 0) await sleep(1500);
      }
    }
  }
  throw lastErr;
}

let client: GoogleGenAI | null = null;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

/** Zod -> the JSON Schema subset Gemini accepts (it rejects the `$schema` keyword). */
function jsonSchemaFor(schema: z.ZodType) {
  const { $schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  void $schema;
  return rest;
}

export async function geminiStructured<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T>> {
  const res = await withFallback((model) =>
    getClient().models.generateContent({
      model,
    contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchemaFor(schema),
        maxOutputTokens: 16000,
      },
    }),
  );
  if (res.promptFeedback?.blockReason) throw new Error("The AI declined to help with this idea. Try rephrasing it.");
  const finish = res.candidates?.[0]?.finishReason;
  if (finish === FinishReason.MAX_TOKENS) throw new Error("The response was cut off. Please try again.");
  if (finish === FinishReason.SAFETY) throw new Error("The AI declined to help with this idea. Try rephrasing it.");
  // The schema constrains the output, but validate anyway so the UI never sees a malformed kit.
  const parsed = schema.safeParse(JSON.parse(res.text ?? "null"));
  if (!parsed.success) throw new Error("Could not read the AI response. Please try again.");
  return parsed.data;
}

export async function* geminiChat(system: string, history: ChatMessage[]): AsyncGenerator<string> {
  // Fallback covers opening the stream; a failure mid-reply surfaces as an interrupted message.
  const stream = await withFallback((model) =>
    getClient().models.generateContentStream({
      model,
      contents: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      config: { systemInstruction: system, maxOutputTokens: 8000 },
    }),
  );
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
