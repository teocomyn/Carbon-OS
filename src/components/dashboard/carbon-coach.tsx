"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { BorderBeam } from "@/components/ui/border-beam";
import type { CarbonCoachContext } from "@/lib/carbon-coach";
import { cn } from "@/lib/utils";

const welcomeMessage: UIMessage = {
  id: "carbon-coach-welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Bonjour ! Je peux vous aider à comprendre votre bilan et à choisir une prochaine étape réaliste. Par quoi voulez-vous commencer ?",
    },
  ],
};

const quickQuestions = [
  "Quelle action aurait le plus d’impact pour moi ?",
  "Comment réduire sans dépenser plus ?",
  "Par quoi commencer cette semaine ?",
];

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function CarbonCoach({ context }: { context: CarbonCoachContext }) {
  const { resolvedTheme } = useTheme();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/carbon-coach" }),
    [],
  );
  const { messages, sendMessage, status, error, regenerate, setMessages } =
    useChat({
      id: "carbon-os-coach",
      messages: [welcomeMessage],
      transport,
      throttle: 40,
    });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!open) return;
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, open]);

  const submitQuestion = (question: string) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isBusy) return;
    void sendMessage({ text: trimmedQuestion }, { body: { context } });
    setInput("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="carbon-coach-trigger group fixed bottom-5 right-5 z-50 inline-flex min-h-12 items-center gap-3 rounded-full border border-[color-mix(in_srgb,var(--accent)_52%,var(--border))] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_16px_50px_rgba(0,0,0,.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--positive)] sm:bottom-6 sm:right-6"
          aria-label="Ouvrir le conseiller carbone"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[0_0_24px_var(--accent-soft)]">
            <Sparkles size={15} />
          </span>
          <span>Conseiller carbone</span>
          <span className="size-1.5 rounded-full bg-[var(--positive)] shadow-[0_0_10px_var(--positive)]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content className="carbon-coach-dialog fixed inset-x-3 bottom-3 z-[90] flex h-[min(720px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_30px_100px_rgba(0,0,0,.5)] outline-none sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px]">
          <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--positive)]">
              <Bot size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-sm font-semibold">
                Conseiller Carbon OS
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                <span className="size-1.5 rounded-full bg-[var(--positive)]" />
                Basé sur le résumé de votre bilan
              </Dialog.Description>
            </div>
            <button
              type="button"
              onClick={() => setMessages([welcomeMessage])}
              disabled={isBusy}
              className="grid size-9 place-items-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              aria-label="Nouvelle conversation"
            >
              <RotateCcw size={15} />
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                aria-label="Fermer le conseiller"
              >
                <X size={17} />
              </button>
            </Dialog.Close>
          </header>

          <div
            className="carbon-coach-conversation min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
            aria-live="polite"
          >
            <div className="space-y-4">
              {messages.map((message) => {
                const text = messageText(message);
                if (!text) return null;
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2.5",
                      isUser ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isUser && (
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--positive)]">
                        <Sparkles size={12} />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-[13px] leading-5",
                        isUser
                          ? "rounded-br-md bg-[var(--accent)] text-white"
                          : "rounded-bl-md border border-[var(--border)] bg-[var(--card)]",
                      )}
                    >
                      {text}
                    </div>
                  </div>
                );
              })}

              {messages.length === 1 && (
                <div className="grid gap-2 pt-1">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => submitQuestion(question)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-left text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {isBusy && (
                <div className="flex items-center gap-2.5 text-xs text-[var(--muted-foreground)]">
                  <span className="grid size-7 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--positive)]">
                    <Sparkles size={12} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    Réflexion
                    <span className="size-1 animate-pulse rounded-full bg-current" />
                    <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                    <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  </span>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-5 text-[var(--muted-foreground)]">
                  <p>Le conseiller est momentanément indisponible.</p>
                  <button
                    type="button"
                    onClick={() => void regenerate({ body: { context } })}
                    className="mt-2 font-semibold text-[var(--accent)]"
                  >
                    Réessayer
                  </button>
                </div>
              )}
              <div ref={scrollAnchorRef} />
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
            <BorderBeam
              size="pulse-inner"
              colorVariant="mono"
              theme={resolvedTheme === "light" ? "light" : "dark"}
              strength={isBusy ? 0.65 : 0.38}
              active={open}
              borderRadius={18}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitQuestion(input);
                }}
                className="relative rounded-[18px] border border-[var(--border)] bg-[var(--background)] p-2"
              >
                <label htmlFor="carbon-coach-input" className="sr-only">
                  Poser une question au conseiller carbone
                </label>
                <textarea
                  id="carbon-coach-input"
                  rows={2}
                  maxLength={1_200}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitQuestion(input);
                    }
                  }}
                  disabled={isBusy}
                  placeholder="Posez votre question…"
                  className="block max-h-28 min-h-12 w-full resize-none bg-transparent px-2 py-1 text-[13px] leading-5 outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-60"
                />
                <div className="flex items-center justify-between gap-3 px-1 pb-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[9px] text-[var(--muted-foreground)]">
                    <ShieldCheck size={11} className="text-[var(--positive)]" />
                    Conversation non enregistrée
                  </span>
                  <button
                    type="submit"
                    disabled={!input.trim() || isBusy}
                    className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-white transition-opacity disabled:opacity-35"
                    aria-label="Envoyer la question"
                  >
                    <ArrowUp size={15} />
                  </button>
                </div>
              </form>
            </BorderBeam>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9px] text-[var(--muted-foreground)]">
              <CheckCircle2 size={10} /> Conseils indicatifs · vérifiez avant
              une décision importante
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
