import { mastra } from "../../../src/mastra"; // Adjust the import path if necessary

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the messages from the request body
  const { messages } = await req.json();

  // Get the chefAgent instance from Mastra
  const agent = mastra.getAgent("chefAgent");

  // Stream the response using the agent
  const result = await agent.stream(messages);

  return result.aisdk.v5.toUIMessageStreamResponse();
}