import { Mastra } from "@mastra/core";
// import { chefAgent } from "./agents/chefAgent";
import { cdkReportAgent } from "./agents/cdkReportAgent";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  agents: { cdkReportAgent },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to
    // persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
