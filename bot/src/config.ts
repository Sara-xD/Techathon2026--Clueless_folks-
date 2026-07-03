import "dotenv/config";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  commandPrefix: process.env.COMMAND_PREFIX ?? "!",

  discordBotToken: process.env.DISCORD_BOT_TOKEN?.trim() || null,
  discordAlertChannelId: process.env.DISCORD_ALERT_CHANNEL_ID?.trim() || null,
  alertPollMs: envInt("ALERT_POLL_MS", 8000),

  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || null,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
};
