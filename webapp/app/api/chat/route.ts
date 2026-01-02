import { mastra } from "../../../mastra"; // Adjust the import path if necessary

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the messages and optional agentName from the request body
  const { messages, agentName } = await req.json();

  // Determine which agent to use based on the request
  // Default to chefAgent if not specified
  const selectedAgentName = agentName || "chefAgent";

  // Get the agent instance from Mastra
  const agent = mastra.getAgent(selectedAgentName);

  // Stream the response using the agent
  const result = await agent.stream(messages);

  return result.aisdk.v5.toUIMessageStreamResponse();
}