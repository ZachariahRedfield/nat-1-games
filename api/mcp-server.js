#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

/**
 * Minimal MCP server for Nat-1 Games
 * Exposes:
 *  - run_verify(mode)
 *  - run_doc_sync()
 */

function runCommand(cmd, args = []) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      resolve({ success: code === 0, exitCode: code });
    });
  });
}

async function main() {
  const input = await new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(JSON.parse(data)));
  });

  let result;

  switch (input.tool) {
    case "run_verify": {
      const mode = input.args?.mode === "fast" ? "verify:fast" : "verify";
      result = await runCommand("npm", ["run", mode]);
      break;
    }

    case "run_doc_sync": {
      result = await runCommand("npm", ["run", "codex:doc-sync"]);
      break;
    }

    default:
      result = { success: false, error: "Unknown tool" };
  }

  process.stdout.write(JSON.stringify(result));
}

main();
