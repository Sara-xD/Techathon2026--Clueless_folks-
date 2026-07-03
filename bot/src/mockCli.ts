import readline from "node:readline";
import { watchAlerts } from "./alertWatcher.js";
import { config } from "./config.js";
import { handleRoom, handleStatus, handleUsage } from "./commands.js";
import { buildAlertTemplate } from "./templates.js";

/**
 * Local console harness that exercises the exact same command handlers a
 * real Discord bot would use. Lets the whole !status / !room / !usage /
 * proactive-alert flow be demoed and tested without a Discord application,
 * bot token, or server -- swap in DISCORD_BOT_TOKEN later and the same
 * command logic runs for real (see discordBot.ts).
 */
export function startMockCli() {
  console.log("=".repeat(60));
  console.log("[bot] No DISCORD_BOT_TOKEN set -> running MOCK CLI mode.");
  console.log(`[bot] Type commands as you would in Discord, e.g. "${config.commandPrefix}status"`);
  console.log(`[bot] Commands: ${config.commandPrefix}status | ${config.commandPrefix}room <name> | ${config.commandPrefix}usage | exit`);
  console.log("=".repeat(60));

  const stopWatching = watchAlerts((alert) => {
    console.log(`\n[bot -> #office-alerts] ${buildAlertTemplate(alert)}\n> `);
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (input === "exit" || input === "quit") {
      rl.close();
      return;
    }

    try {
      if (input === `${config.commandPrefix}status`) {
        console.log(await handleStatus());
      } else if (input.startsWith(`${config.commandPrefix}room`)) {
        const arg = input.slice(`${config.commandPrefix}room`.length).trim();
        console.log(await handleRoom(arg || undefined));
      } else if (input === `${config.commandPrefix}usage`) {
        console.log(await handleUsage());
      } else if (input.length > 0) {
        console.log(`Unknown command. Try ${config.commandPrefix}status, ${config.commandPrefix}room <name>, or ${config.commandPrefix}usage.`);
      }
    } catch (err) {
      console.error(`[bot] command failed: ${(err as Error).message}`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    stopWatching();
    console.log("[bot] mock CLI stopped.");
    process.exit(0);
  });
}
