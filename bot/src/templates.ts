import type { Alert, RoomSummary, StatePayload, UsageSnapshot } from "./types.js";

/**
 * Deterministic, data-accurate message builders. These are the fallback
 * used when no LLM key is configured (or the LLM call fails), and they're
 * also handed to the LLM as the "facts" it's allowed to rephrase -- the
 * LLM never invents numbers, it only restyles these.
 */

function roomOnCounts(room: RoomSummary) {
  const fansOn = room.devices.filter((d) => d.type === "fan" && d.status === "on").length;
  const lightsOn = room.devices.filter((d) => d.type === "light" && d.status === "on").length;
  return { fansOn, lightsOn };
}

export function roomStatusPhrase(room: RoomSummary): string {
  const { fansOn, lightsOn } = roomOnCounts(room);
  if (fansOn === 0 && lightsOn === 0) return "all off";
  const parts: string[] = [];
  if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? "s" : ""} ON`);
  if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? "s" : ""} ON`);
  return parts.join(", ");
}

export function buildStatusTemplate(state: StatePayload): string {
  return state.rooms.map((room) => `${room.name}: ${roomStatusPhrase(room)}.`).join(" ");
}

export function buildRoomTemplate(room: RoomSummary): string {
  const deviceLines = room.devices
    .map((d) => `${d.label} ${d.status === "on" ? `ON (${d.currentWatts}W)` : "OFF"}`)
    .join(", ");
  return `${room.name}: ${roomStatusPhrase(room)}. [${deviceLines}] Room total: ${room.totalWatts}W.`;
}

export function buildUsageTemplate(usage: UsageSnapshot): string {
  return `Total power right now: ${usage.totalWatts}W. Today's estimated usage: ${usage.todayEstimatedKwh} kWh.`;
}

export function buildAlertTemplate(alert: Alert): string {
  const icon = alert.severity === "critical" ? "🛑" : "⚠️";
  return `${icon} Hey! ${alert.message}`;
}

export const UNKNOWN_ROOM_TEMPLATE = (input: string, validNames: string) =>
  `I don't know a room called "${input}". Try one of: ${validNames}.`;
