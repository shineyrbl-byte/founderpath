import { FinishReason, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { ChatMessage } from "./db";

// Free-tier alternative to Claude. The alias tracks Google's current Flash model;
// override with GEMINI_MODEL to pin a specific version.
const model = () => process.env.GEMINI_MODEL || "gemini-flash-latest";

let client: GoogleGenAI | null = null;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

/** Zod -> the JSON Schema subset Gemini accepts (it rejects the `$schema` keyword). */
function jsonSchemaFor(schema: z.ZodType) {
  const { $schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  void $schema;
  return rest;
}

export async function geminiStructured<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T>> {
  const res = await getClient().models.generateContent({
    model: model(),
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchemaFor(schema),
      maxOutputTokens: 16000,
    },
  });
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
  const stream = await getClient().models.generateContentStream({
    model: model(),
    contents: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    config: { systemInstruction: system, maxOutputTokens: 8000 },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
