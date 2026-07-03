import { config } from "./config.js";

if (config.discordBotToken) {
  const { startDiscordBot } = await import("./discordBot.js");
  startDiscordBot();
} else {
  const { startMockCli } = await import("./mockCli.js");
  startMockCli();
}
