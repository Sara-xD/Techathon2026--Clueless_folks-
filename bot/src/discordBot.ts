import { Client, Events, GatewayIntentBits, TextChannel } from "discord.js";
import { watchAlerts } from "./alertWatcher.js";
import { config } from "./config.js";
import { handleRoom, handleStatus, handleUsage } from "./commands.js";
import { buildAlertTemplate } from "./templates.js";

export function startDiscordBot() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`[bot] Logged in to Discord as ${c.user.tag}`);

    if (config.discordAlertChannelId) {
      watchAlerts(async (alert) => {
        try {
          const channel = await c.channels.fetch(config.discordAlertChannelId!);
          if (channel instanceof TextChannel) {
            await channel.send(buildAlertTemplate(alert));
          }
        } catch (err) {
          console.warn(`[bot] failed to post proactive alert: ${(err as Error).message}`);
        }
      });
    } else {
      console.log("[bot] DISCORD_ALERT_CHANNEL_ID not set -> proactive alert posting disabled.");
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.commandPrefix)) return;

    const [command, ...rest] = message.content.slice(config.commandPrefix.length).trim().split(/\s+/);
    const arg = rest.join(" ");

    try {
      if (command === "status") {
        await message.reply(await handleStatus());
      } else if (command === "room") {
        await message.reply(await handleRoom(arg || undefined));
      } else if (command === "usage") {
        await message.reply(await handleUsage());
      }
    } catch (err) {
      console.error(`[bot] command "${command}" failed:`, err);
      await message.reply("Sorry, I couldn't reach the office backend just now. Try again in a moment.");
    }
  });

  client.login(config.discordBotToken!);
}
