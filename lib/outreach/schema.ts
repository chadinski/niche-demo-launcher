import { z } from "zod";
import type { SalesMessages } from "@/lib/types";

export const outreachMessagesSchema = z.object({
  whatsapp: z.string().min(1),
  emailSubject: z.string().min(1),
  email: z.string().min(1),
  dm: z.string().min(1),
  facebook: z.string().min(1),
  followUp: z.string().min(1),
  followUp2: z.string().min(1),
  finalFollowUp: z.string().min(1),
});

export type OutreachMessages = z.infer<typeof outreachMessagesSchema>;

export function parseOutreachMessages(value: unknown, fallback: SalesMessages): SalesMessages {
  const parsed = outreachMessagesSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  if (typeof value === "string") {
    const match = value.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const json = JSON.parse(match[0]);
        const jsonParsed = outreachMessagesSchema.safeParse(json);
        if (jsonParsed.success) return jsonParsed.data;
      } catch {
        // Fall through to deterministic fallback.
      }
    }
  }

  return fallback;
}
