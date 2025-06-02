#!/usr/bin/env node
import { runServer } from "./server.js";

async function start() {
  try {
    await runServer();
  } catch (error) {
    console.error("Fatal error starting GitLab MCP server:", error);
    process.exit(1);
  }
}

start();
