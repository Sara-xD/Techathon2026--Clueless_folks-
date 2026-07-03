import { config } from "./config.js";

/**
 * The simulator runs on a virtual clock that moves faster than real time
 * (SIM_SPEED_MULTIPLIER seconds of sim-time per real second). This lets
 * time-of-day rules (office hours, "on for 2h+") become observable within
 * a short live demo instead of requiring real hours to pass.
 *
 * All timestamps returned to clients (lastChanged, onSince, alerts) are
 * simulated-clock ISO strings, so they always read as plausible wall-clock
 * times even though the underlying demo runs in minutes.
 */
const realStartMs = Date.now();

const virtualStart = new Date();
virtualStart.setHours(config.simStartHour, config.simStartMinute, 0, 0);
const virtualStartMs = virtualStart.getTime();

export function simNow(): Date {
  const elapsedRealMs = Date.now() - realStartMs;
  const elapsedSimMs = elapsedRealMs * config.simSpeedMultiplier;
  return new Date(virtualStartMs + elapsedSimMs);
}

export function simNowIso(): string {
  return simNow().toISOString();
}

export function isWithinOfficeHours(date: Date): boolean {
  const h = date.getHours();
  return h >= config.officeOpenHour && h < config.officeCloseHour;
}

/** Simulated hours elapsed between two simulated-clock timestamps. */
export function simHoursBetween(earlierIso: string, laterIso: string): number {
  const ms = new Date(laterIso).getTime() - new Date(earlierIso).getTime();
  return ms / (1000 * 60 * 60);
}
