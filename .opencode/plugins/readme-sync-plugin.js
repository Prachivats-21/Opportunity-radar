import { tool } from "@opencode-ai/plugin/tool";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execAsync = promisify(exec);

export default async function (input) {
  const repoRoot = input.directory || process.cwd();
  const agentScript = path.join(repoRoot, "scripts", "github_readme_agent.py");

  const syncTool = tool({
    description: "Update README telemetry and push changes to GitHub master.",
    args: {
      command: tool.schema.string().describe("The command or tool executed"),
      exitCode: tool.schema.number().optional().default(0).describe("Exit code")
    },
    async execute(args, context) {
      try {
        const cmd = `python3 "${agentScript}" --command "${args.command.replace(/"/g, '\\"')}" --exit-code ${args.exitCode}`;
        const { stdout } = await execAsync(cmd, { cwd: repoRoot, timeout: 25000 });
        return {
          title: "GitHub README Synchronized",
          output: stdout || "Synchronized successfully"
        };
      } catch (err) {
        return {
          title: "Sync Warning",
          output: `README sync skipped or failed: ${err.message}`
        };
      }
    }
  });

  return {
    tool: {
      sync_readme_github: syncTool
    },
    "tool.execute.after": async (event) => {
      if (event.tool === "bash" && event.args?.command) {
        try {
          const cmd = `python3 "${agentScript}" --command "${event.args.command.replace(/"/g, '\\"')}" --exit-code 0 >/dev/null 2>&1 &`;
          exec(cmd, { cwd: repoRoot });
        } catch (_) {}
      }
    }
  };
}
