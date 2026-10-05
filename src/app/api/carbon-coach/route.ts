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
import { hasTrustedOrigin } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/server-rate-limit";
import { readBoundedJson, RequestBodyTooLarge } from "@/lib/request-body";

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
  if (!hasTrustedOrigin(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const limited0 = await rateLimitResponse(
    request,
    "carbon-coach",
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
  );
  if (limited0) return limited0;

  try {
    const rawBody = await readBoundedJson(request, 64_000);
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
  } catch (error) {
    if (error instanceof RequestBodyTooLarge)
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    if (error instanceof SyntaxError)
      return Response.json({ error: "invalid_json" }, { status: 400 });
    return Response.json({ error: "chat_unavailable" }, { status: 503 });
  }
}
