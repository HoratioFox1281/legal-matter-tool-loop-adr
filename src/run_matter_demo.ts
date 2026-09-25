import { createLegalAiClient } from "./legal_ai_client";
import { runMatterToolLoop } from "./matter_tool_loop";

const sampleMatter = {
  requestId: "matter-2026-0042",
  clientName: "Jordan Lee",
  clientEmail: "jordan.lee@example.com",
  matterType: "employment" as const,
  opposingParty: "North Harbor Logistics",
  signedDocumentDelivered: true,
  filingDeadlineIso: "2026-03-06T00:00:00.000Z",
  todayIso: "2026-03-03T00:00:00.000Z",
  intakeNotes: "Client reports wage claim and needs filing packet reviewed this week."
};

async function main() {
  const ai = createLegalAiClient();
  const result = await runMatterToolLoop(ai, sampleMatter);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
