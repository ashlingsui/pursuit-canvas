import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PostingSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string(),
  seniority: z.string(),
  summary: z.string(),
});

export type PostingDetails = z.infer<typeof PostingSchema>;

export type PostingResult =
  | { ok: true; details: PostingDetails }
  | { ok: false; error: string };

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export const readJobPosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().url() }).parse(input))
  .handler(async ({ data }): Promise<PostingResult> => {
    let page = "";
    try {
      const res = await fetch(data.url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      if (!res.ok) {
        return { ok: false, error: `That page wouldn't load (${res.status}). Fill it in manually.` };
      }
      page = textFromHtml(await res.text()).slice(0, 14000);
    } catch {
      return { ok: false, error: "Couldn't reach that link. Fill it in manually." };
    }

    if (page.length < 120) {
      return {
        ok: false,
        error: "That page didn't return readable text (it may need a login). Fill it in manually.",
      };
    }

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured right now." };

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = [
      `Below is the text of a job posting page from ${data.url}.`,
      "Extract the hiring company name and the exact job title.",
      "Also extract the work location (city/state or Remote) and a seniority label (one of: Intern, Junior, Mid, Senior, Staff, Lead, Director, Executive).",
      "Write a one-sentence summary of what the role is responsible for, addressed to me in plain language.",
      'Use an empty string for anything the page does not state. Do not guess a company from the job board name (e.g. "LinkedIn", "Greenhouse", "Lever", "Ashby", "Workday").',
      "",
      "PAGE TEXT:",
      page,
    ].join("\n");

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.7-flash"),
        output: Output.object({ schema: PostingSchema }),
        prompt,
      });
      return { ok: true, details: output };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        try {
          return { ok: true, details: PostingSchema.parse(JSON.parse(error.text)) };
        } catch {
          /* fall through */
        }
      }
      console.error("readJobPosting failed", error);
      return { ok: false, error: "Couldn't read that posting. Fill it in manually." };
    }
  });
