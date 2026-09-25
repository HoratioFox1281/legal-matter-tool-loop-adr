import { z } from "zod";

export const matterIntakeSchema = z.object({
  requestId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  matterType: z.enum(["employment", "commercial", "estate"]),
  opposingParty: z.string().min(1),
  signedDocumentDelivered: z.boolean(),
  filingDeadlineIso: z.string().datetime(),
  todayIso: z.string().datetime(),
  intakeNotes: z.string().min(1)
});

export type MatterIntake = z.infer<typeof matterIntakeSchema>;
