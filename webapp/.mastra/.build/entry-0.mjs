import { Mastra } from '@mastra/core';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

const model = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const bedrock = createAmazonBedrock({
  region: "us-west-2",
  apiKey: process.env.BEDROCK_API_KEY
});

const chefAgent = new Agent({
  name: "chef-agent",
  instructions: "You are Michel, a practical and experienced home chef.You help people cook with whatever ingredients they have available.",
  model: bedrock(model),
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db"
    })
  })
});

const mastra = new Mastra({
  agents: {
    chefAgent
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to
    // persist, change to file:../mastra.db
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: {
      enabled: true
    }
  }
});

export { mastra };
