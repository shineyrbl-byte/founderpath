import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiError } from "@google/genai";

export function errorResponse(err: unknown) {
  console.error(err);
  let message = err instanceof Error ? err.message : "Something went wrong.";
  let status = 500;
  if (err instanceof Anthropic.RateLimitError) {
    message = "FounderPath is busy right now. Please try again in a minute.";
    status = 429;
  } else if (err instanceof Anthropic.AuthenticationError) {
    message = "The server's Anthropic API key is invalid.";
  } else if (err instanceof GeminiError) {
    if (err.status === 429) {
      message = "The free AI quota is used up for now. Please wait a minute and try again.";
      status = 429;
    } else if (err.status === 400 || err.status === 401 || err.status === 403) {
      message = "The server's Gemini API key is invalid or missing.";
    } else {
      message = `AI service error (${err.status}). Please try again.`;
      status = 502;
    }
  } else if (err instanceof Anthropic.APIError) {
    message = `AI service error (${err.status ?? "network"}). Please try again.`;
    status = 502;
  }
  return Response.json({ error: message }, { status });
}

export const ownerOf = (req: Request) => req.headers.get("x-owner")?.slice(0, 64) || null;
