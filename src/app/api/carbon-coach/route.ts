import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  buildCarbonCoachInstructions,
  carbonCoachContextSchema,
} from "@/lib/carbon-coach";

export const maxDuration = 30;

const requestSchema = z
  .object({
    id: z.string().max(128).optional(),
    messages: z.array(z.unknown()).min(1).max(20),
    trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
    messageId: z.string().max(128).optional(),
    context: carbonCoachContextSchema,
  })
  .strict();

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_REQUESTS = 15;

type RateLimitEntry = { count: number; resetAt: number };
const globalRateLimit = globalThis as typeof globalThis & {
  carbonCoachRateLimit?: Map<string, RateLimitEntry>;
};
const rateLimitStore =
  globalRateLimit.carbonCoachRateLimit ?? new Map<string, RateLimitEntry>();
globalRateLimit.carbonCoachRateLimit = rateLimitStore;

function requestIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}

function isRateLimited(identifier: string) {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_REQUESTS;
}

function sanitizeMessages(messages: UIMessage[]) {
  return messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant",
    )
    .slice(-12)
    .map<UIMessage>((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts.flatMap((part) =>
        part.type === "text"
          ? [{ type: "text" as const, text: part.text.slice(0, 1_200) }]
          : [],
      ),
    }))
    .filter((message) => message.parts.length > 0);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  if (isRateLimited(requestIp(request))) {
    return Response.json(
      { error: "rate_limit" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  try {
    const rawBody: unknown = await request.json();
    const parsedBody = requestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const validatedMessages = await safeValidateUIMessages({
      messages: parsedBody.data.messages,
    });
    if (!validatedMessages.success) {
      return Response.json({ error: "invalid_messages" }, { status: 400 });
    }

    const messages = sanitizeMessages(validatedMessages.data);
    const totalCharacters = messages.reduce(
      (total, message) =>
        total +
        message.parts.reduce(
          (partTotal, part) =>
            partTotal + (part.type === "text" ? part.text.length : 0),
          0,
        ),
      0,
    );
    if (
      !messages.length ||
      messages.at(-1)?.role !== "user" ||
      totalCharacters > 8_000
    ) {
      return Response.json({ error: "conversation_too_long" }, { status: 400 });
    }

    const result = streamText({
      model: "openai/gpt-5.6-luna",
      instructions: buildCarbonCoachInstructions(parsedBody.data.context),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 700,
      abortSignal: request.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: () => "Le conseiller est momentanément indisponible.",
      }),
    });
  } catch {
    return Response.json({ error: "chat_unavailable" }, { status: 503 });
  }
}
