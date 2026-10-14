import Anthropic from "@anthropic-ai/sdk";

export function errorResponse(err: unknown) {
  console.error(err);
  let message = err instanceof Error ? err.message : "Something went wrong.";
  let status = 500;
  if (err instanceof Anthropic.RateLimitError) {
    message = "FounderPath is busy right now. Please try again in a minute.";
    status = 429;
  } else if (err instanceof Anthropic.AuthenticationError) {
    message = "The server's Anthropic API key is invalid.";
  } else if (err instanceof Anthropic.APIError) {
    message = `AI service error (${err.status ?? "network"}). Please try again.`;
    status = 502;
  }
  return Response.json({ error: message }, { status });
}

export const ownerOf = (req: Request) => req.headers.get("x-owner")?.slice(0, 64) || null;
