import { z } from "zod";
import type { MatterIntake } from "./matter_intake_schema";

const deadlineDecisionSchema = z.object({
  urgency: z.enum(["same_day", "this_week", "normal"]),
  followUpRequired: z.boolean(),
  daysUntilDeadline: z.number().int()
});

const signedDeliverySchema = z.object({
  deliveryStatus: z.enum(["ready", "awaiting_signature"]),
  recipient: z.string().email(),
  message: z.string().min(1)
});

const intakeRecordSchema = z.object({
  matterSummary: z.string().min(1),
  docketTag: z.string().min(1),
  ownerQueue: z.enum(["priority_review", "standard_review"])
});

export type ToolResult = {
  tool: string;
  result: unknown;
};

export function recordMatterIntake(input: MatterIntake): ToolResult {
  const docketTag = `${input.matterType}-${input.requestId}`;
  const ownerQueue = input.matterType === "employment" ? "priority_review" : "standard_review";

  return {
    tool: "record_matter_intake",
    result: intakeRecordSchema.parse({
      matterSummary: `${input.clientName} vs ${input.opposingParty}`,
      docketTag,
      ownerQueue
    })
  };
}

export function deliverSignedDocument(input: MatterIntake): ToolResult {
  const deliveryStatus = input.signedDocumentDelivered ? "ready" : "awaiting_signature";
  const message = input.signedDocumentDelivered
    ? `Signed packet ready for ${input.clientName}`
    : `Hold delivery until ${input.clientName} signs the packet`;

  return {
    tool: "deliver_signed_document",
    result: signedDeliverySchema.parse({
      deliveryStatus,
      recipient: input.clientEmail,
      message
    })
  };
}

export function scheduleDeadlineFollowUp(input: MatterIntake): ToolResult {
  const deadline = new Date(input.filingDeadlineIso).getTime();
  const today = new Date(input.todayIso).getTime();
  const daysUntilDeadline = Math.floor((deadline - today) / 86400000);

  const urgency = daysUntilDeadline <= 1 ? "same_day" : daysUntilDeadline <= 7 ? "this_week" : "normal";
  const followUpRequired = daysUntilDeadline <= 7 || !input.signedDocumentDelivered;

  return {
    tool: "schedule_deadline_follow_up",
    result: deadlineDecisionSchema.parse({
      urgency,
      followUpRequired,
      daysUntilDeadline
    })
  };
}

export const legalToolHandlers = {
  record_matter_intake: recordMatterIntake,
  deliver_signed_document: deliverSignedDocument,
  schedule_deadline_follow_up: scheduleDeadlineFollowUp
};

export const legalToolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "record_matter_intake",
      description: "Create the intake record and assign a review queue.",
      parameters: {
        type: "object",
        properties: {
          requestId: { type: "string" },
          clientName: { type: "string" },
          clientEmail: { type: "string" },
          matterType: { type: "string", enum: ["employment", "commercial", "estate"] },
          opposingParty: { type: "string" },
          signedDocumentDelivered: { type: "boolean" },
          filingDeadlineIso: { type: "string" },
          todayIso: { type: "string" },
          intakeNotes: { type: "string" }
        },
        required: [
          "requestId",
          "clientName",
          "clientEmail",
          "matterType",
          "opposingParty",
          "signedDocumentDelivered",
          "filingDeadlineIso",
          "todayIso",
          "intakeNotes"
        ]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "deliver_signed_document",
      description: "Decide if the signed packet can go out to the client now.",
      parameters: {
        type: "object",
        properties: {
          requestId: { type: "string" },
          clientName: { type: "string" },
          clientEmail: { type: "string" },
          matterType: { type: "string", enum: ["employment", "commercial", "estate"] },
          opposingParty: { type: "string" },
          signedDocumentDelivered: { type: "boolean" },
          filingDeadlineIso: { type: "string" },
          todayIso: { type: "string" },
          intakeNotes: { type: "string" }
        },
        required: [
          "requestId",
          "clientName",
          "clientEmail",
          "matterType",
          "opposingParty",
          "signedDocumentDelivered",
          "filingDeadlineIso",
          "todayIso",
          "intakeNotes"
        ]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_deadline_follow_up",
      description: "Decide urgency and whether deadline follow-up is required.",
      parameters: {
        type: "object",
        properties: {
          requestId: { type: "string" },
          clientName: { type: "string" },
          clientEmail: { type: "string" },
          matterType: { type: "string", enum: ["employment", "commercial", "estate"] },
          opposingParty: { type: "string" },
          signedDocumentDelivered: { type: "boolean" },
          filingDeadlineIso: { type: "string" },
          todayIso: { type: "string" },
          intakeNotes: { type: "string" }
        },
        required: [
          "requestId",
          "clientName",
          "clientEmail",
          "matterType",
          "opposingParty",
          "signedDocumentDelivered",
          "filingDeadlineIso",
          "todayIso",
          "intakeNotes"
        ]
      }
    }
  }
];
