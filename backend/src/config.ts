import "dotenv/config";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: envInt("PORT", 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),

  simTickMs: envInt("SIM_TICK_MS", 4000),
  simSpeedMultiplier: envInt("SIM_SPEED_MULTIPLIER", 60),
  simStartHour: envInt("SIM_START_HOUR", 16),
  simStartMinute: envInt("SIM_START_MINUTE", 30),

  officeOpenHour: 9,
  officeCloseHour: 17,
  continuousOnAlertHours: 2,
};
