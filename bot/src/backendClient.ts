import { config } from "./config.js";
import type { Alert, RoomId, RoomSummary, StatePayload, UsageSnapshot } from "./types.js";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${config.backendUrl}${path}`);
  if (!res.ok) {
    throw new Error(`Backend request failed: GET ${path} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const backend = {
  getState: () => getJson<StatePayload>("/api/state"),
  getRoom: (roomId: RoomId) => getJson<{ room: RoomSummary }>(`/api/rooms/${roomId}`),
  getUsage: () => getJson<UsageSnapshot>("/api/usage"),
  getAlerts: () => getJson<{ alerts: Alert[] }>("/api/alerts"),
};
