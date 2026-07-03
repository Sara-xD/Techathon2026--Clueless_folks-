import { computeAlerts } from "./alerts.js";
import { simulator } from "./simulator/simulator.js";
import { simNowIso } from "./simClock.js";
import type { StatePayload } from "./types.js";

/** Composes the full snapshot shared by REST, WebSocket, and the bot. */
export function buildStatePayload(): StatePayload {
  const devices = simulator.getDevices();
  const rooms = simulator.getRoomSummaries();
  const usage = simulator.getUsage();
  const alerts = computeAlerts(rooms);

  return {
    devices,
    rooms,
    usage,
    alerts,
    simulatedNow: simNowIso(),
  };
}
