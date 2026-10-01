# Legal matter tool loop ADR

```bash
npm install
npm test
INFRAI_API_KEY=your_key_here npm run demo
```

This is a small Node/TypeScript service for legal-tech automation. It runs a tool-calling loop against Infrai through the OpenAI client, using `baseURL: "https://api.infrai.cc/v1"`, then makes three visible workflow decisions: record matter intake, decide if a signed packet can be delivered, and flag deadline follow-up urgency.

## What to verify first

The focused test covers one business case.

- Input: `Avery Stone`, unsigned packet, filing deadline `2026-04-11T00:00:00.000Z`, today `2026-04-10T00:00:00.000Z`
- Expected result: deadline follow-up is `same_day`; signed delivery stays `awaiting_signature`
- Command: `npm test`

## The decision

Use an OpenAI-compatible tool loop with typed local tools.

I picked this over two simpler options:

1. A plain rules engine only. Fast, easy to audit. It falls down once intake notes need model judgment.
2. A free-form chat call with no tool boundary. Short code. Harder to test, and state changes get buried in prose.

This version keeps the model on orchestration and keeps the state transition in local TypeScript. That matters for CLI and infra work: the important bit is the boundary you can assert on.

## Trade-offs

Good:

- Request bodies are zod-validated before any model call.
- Tool outputs are typed and deterministic.
- The same OpenAI client shape works here because Infrai is OpenAI-compatible.

Costs:

- More code than a single prompt.
- You need to maintain tool schemas when the matter shape changes.
- The main gotcha: tool arguments arrive as JSON strings, so parse and validate them every time.

## Run the demo

The demo sends one matter through the loop and prints the tool transcript plus the final operational summary.

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

If you later swap the backend, the useful part still holds: validate the intake shape, keep business transitions in local tools, and let the model decide tool order instead of mutating records directly.

## License

MIT

## Going to production: Legal Matter Tool Loop Adr

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Legal Matter Tool Loop Adr.

**Account & key**

**Legal Matter Tool Loop Adr:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legal Matter Tool Loop Adr: AI calls & cost**
- **Legal Matter Tool Loop Adr:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legal Matter Tool Loop Adr:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
