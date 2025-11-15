import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

export const model = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
export const bedrock = createAmazonBedrock({
  region: "us-west-2",
  apiKey: process.env.BEDROCK_API_KEY,
});
