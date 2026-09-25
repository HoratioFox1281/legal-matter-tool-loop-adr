import test from "node:test";
import assert from "node:assert/strict";
import { scheduleDeadlineFollowUp, deliverSignedDocument } from "../src/legal_tools";

test("deadline follow-up becomes same_day when filing deadline is tomorrow", () => {
  const input = {
    requestId: "matter-1",
    clientName: "Avery Stone",
    clientEmail: "avery@example.com",
    matterType: "commercial" as const,
    opposingParty: "Kestrel Supply",
    signedDocumentDelivered: false,
    filingDeadlineIso: "2026-04-11T00:00:00.000Z",
    todayIso: "2026-04-10T00:00:00.000Z",
    intakeNotes: "Urgent injunction filing."
  };

  const deadline = scheduleDeadlineFollowUp(input);
  const delivery = deliverSignedDocument(input);

  assert.deepEqual(deadline.result, {
    urgency: "same_day",
    followUpRequired: true,
    daysUntilDeadline: 1
  });

  assert.deepEqual(delivery.result, {
    deliveryStatus: "awaiting_signature",
    recipient: "avery@example.com",
    message: "Hold delivery until Avery Stone signs the packet"
  });
});
