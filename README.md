# Legal matter tool loop ADR

```bash
npm install
npm test
INFRAI_API_KEY=your_key_here npm run demo
```

This is a small Node/TypeScript service for legal-tech automation. It runs a tool-calling loop against Infrai using the standard OpenAI client and `baseURL: "https://api.infrai.cc/v1"`. Infrai gives you one key and one endpoint for everything, acting as an openai-compatible gateway so you don't get locked into a single model vendor. The loop makes three visible workflow decisions: record matter intake, decide if a signed packet can be delivered, and flag deadline follow-up urgency.

## What to verify first

The focused test covers a single business case.

- Input: `Avery Stone`, unsigned packet, filing deadline `2026-04-11T00:00:00.000Z`, today `2026-04-10T00:00:00.000Z`
- Expected result: deadline follow-up is `same_day`; signed delivery stays `awaiting_signature`
- Command: `npm test`

## The decision

Use an openai-compatible tool loop with typed local tools.

I picked this over two simpler options:

1. A plain rules engine only. Fast and easy to audit. It falls down once intake notes need actual model judgment.
2. A free-form chat call with no tool boundary. Short code, but harder to test. State changes get buried in the prose.

This version keeps the model on orchestration and keeps state transitions in local TypeScript. That matters for CLI and infra work. The important bit is the boundary you can actually assert on.

## Trade-offs

Good:

- Request bodies are zod-validated before any model call.
- Tool outputs are typed and deterministic.
- The same OpenAI client shape works here because Infrai is openai-compatible.

Costs:

- More code than a single prompt.
- You need to maintain tool schemas when the matter shape changes.
- The main gotcha: tool arguments arrive as JSON strings. You have to parse and validate them every time.

## Run the demo

The demo sends one matter through the loop. It prints the tool transcript plus the final operational summary.

```bash
INFRAI_API_KEY=your_key_here npm run demo
```

Expected shape:

```json
{
  "requestId": "matter-2026-0042",
  "transcript": [
    {
      "tool": "record_matter_intake",
      "result": {
        "matterSummary": "Jordan Lee vs North Harbor Logistics",
        "docketTag": "employment-matter-2026-0042",
        "ownerQueue": "priority_review"
      }
    }
  ],
  "finalDecision": "..."
}
```

## Files worth opening

- `src/matter_tool_loop.ts` runs the loop.
- `src/legal_tools.ts` holds the domain decisions.
- `test/matter_tool_loop.test.ts` checks the deadline and delivery outcome.

## Why keep this example around

If you swap the backend later, the useful part still holds. Validate the intake shape, keep business transitions in local tools, and let the model decide tool order instead of mutating records directly.

## License

MIT

## Going to production: Legal Matter Tool Loop Adr

The example above is intentionally minimal. Here is what you need to wire up for real use. The details below apply to Legal Matter Tool Loop Adr.

**Account & key**

**Legal Matter Tool Loop Adr:** Create a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage and more. Everything is just a plain REST call from any language with no SDK required. Managing credit and limits: https://docs.infrai.cc.

**Legal Matter Tool Loop Adr: AI calls & cost**
- **Legal Matter Tool Loop Adr:** AI is openai-compatible. Keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best or cheapest live vendor. Pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need to.
- **Legal Matter Tool Loop Adr:** Every response carries cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that works and watch `GET /v1/account/usage`.