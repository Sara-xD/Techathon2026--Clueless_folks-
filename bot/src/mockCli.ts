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

  // Readline emits "line" synchronously for every buffered line (relevant
  // when stdin is piped rather than typed interactively) and fires "close"
  // right after, without waiting for our async handlers. Chaining each
  // line's processing onto a single promise -- and awaiting that chain
  // before exiting on close -- guarantees every command's output is
  // printed even when input arrives faster than the backend can respond.
  let processingChain: Promise<void> = Promise.resolve();
  let closing = false;

  async function processLine(line: string) {
    const input = line.trim();
    if (input === "exit" || input === "quit") {
      closing = true;
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

    if (!closing) rl.prompt();
  }

  rl.on("line", (line) => {
    processingChain = processingChain.then(() => processLine(line));
  });

  rl.on("close", async () => {
    // Readline auto-closes as soon as stdin hits EOF (always true for piped
    // input, since all lines are available instantly) -- independently of
    // whichever "exit" line is still working its way through the queue.
    // Set the flag immediately so any processLine still pending skips its
    // now-invalid rl.prompt() call instead of throwing ERR_USE_AFTER_CLOSE.
    closing = true;
    await processingChain;
    stopWatching();
    console.log("[bot] mock CLI stopped.");
    process.exit(0);
  });
}
