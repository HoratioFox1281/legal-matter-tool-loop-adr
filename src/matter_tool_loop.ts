import type OpenAI from "openai";
import { matterIntakeSchema, type MatterIntake } from "./matter_intake_schema";
import { legalToolDefinitions, legalToolHandlers, type ToolResult } from "./legal_tools";

export type MatterAutomationResult = {
  requestId: string;
  transcript: ToolResult[];
  finalDecision: string;
};

function parseToolArgs(payload: string): MatterIntake {
  return matterIntakeSchema.parse(JSON.parse(payload));
}

export async function runMatterToolLoop(ai: OpenAI, rawInput: unknown): Promise<MatterAutomationResult> {
  const input = matterIntakeSchema.parse(rawInput);
  const transcript: ToolResult[] = [];
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: [
        "You are a legal operations assistant.",
        "Use the provided tools to process the matter intake.",
        "Always cover intake recording, signed document delivery, and deadline follow-up before giving the final answer.",
        "Keep the final answer brief and operational."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify(input)
    }
  ];

  for (let step = 0; step < 4; step += 1) {
    const completion = await ai.chat.completions.create({
      model: "auto",
      messages,
      tools: legalToolDefinitions,
      tool_choice: "auto"
    });

    const choice = completion.choices[0];
    const message = choice.message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        requestId: input.requestId,
        transcript,
        finalDecision: message.content ?? "No final decision returned"
      };
    }

    for (const toolCall of message.tool_calls) {
      const handler = legalToolHandlers[toolCall.function.name as keyof typeof legalToolHandlers];
      if (!handler) {
        throw new Error(`Unknown tool: ${toolCall.function.name}`);
      }

      const args = parseToolArgs(toolCall.function.arguments);
      const toolResult = handler(args);
      transcript.push(toolResult);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult.result)
      });
    }
  }

  throw new Error("Tool loop exceeded step limit");
}
