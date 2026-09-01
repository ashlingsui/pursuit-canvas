import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, generateText } from "ai";
import { z } from "zod";
import { CONTACT_STAGES } from "@/data/types";

const InputSchema = z.object({
  name: z.string(),
  org: z.string(),
  role: z.string(),
  stage: z.string(),
  today: z.string(),
  notes: z.array(z.object({ date: z.string(), body: z.string() })),
});

const SuggestionSchema = z.object({
  summary: z.string(),
  nextAction: z.string(),
  nextActionDue: z.string(),
  stage: z.enum(CONTACT_STAGES),
  stageReason: z.string(),
});

export type NoteSuggestion = z.infer<typeof SuggestionSchema>;

const STAGE_GUIDE = `not_contacted (no outreach yet), reached_out (message sent, no reply), responded (they replied but nothing booked), chat_scheduled (a call or coffee is on the calendar), first_chat (the first conversation happened), ongoing (a continuing relationship with repeated contact)`;

export const summarizeContactNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Lovable AI is not configured.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const notes = data.notes
      .map((n) => `[${n.date}] ${n.body}`)
      .join("\n\n");

    const prompt = [
      `Today is ${data.today}.`,
      `Contact: ${data.name} — ${data.role} at ${data.org}. Current pipeline stage: ${data.stage}.`,
      `Pipeline stages: ${STAGE_GUIDE}.`,
      "",
      "My notes, newest first:",
      notes,
      "",
      "Write a 2-3 sentence summary of where this relationship stands, in plain second-person language addressed to me.",
      "Then suggest one concrete next action (a short imperative phrase, under 12 words) and a due date as YYYY-MM-DD, no earlier than today and within the next three weeks.",
      "Then pick the stage the notes actually support, and give a one-sentence reason.",
    ].join("\n");

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.7-flash"),
        output: Output.object({ schema: SuggestionSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        try {
          return SuggestionSchema.parse(JSON.parse(error.text));
        } catch {
          /* fall through */
        }
      }
      throw error;
    }
  });
