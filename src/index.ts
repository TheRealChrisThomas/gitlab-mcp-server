#!/usr/bin/env node

// Import environment validation
import "./utils/constants.js";

// Import and start the server
import { runServer } from "./server.js";

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
