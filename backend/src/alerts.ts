import { config } from "./config.js";
import { isWithinOfficeHours, simHoursBetween, simNow, simNowIso } from "./simClock.js";
import type { Alert, RoomSummary } from "./types.js";

/**
 * Alerts are recomputed on demand from current device state rather than
 * stored -- state is the single source of truth (per architecture
 * requirement), alerts are a derived view of it.
 */
export function computeAlerts(rooms: RoomSummary[]): Alert[] {
  const alerts: Alert[] = [];
  const now = simNow();
  const nowIso = now.toISOString();
  const afterHours = !isWithinOfficeHours(now);

  for (const room of rooms) {
    // Rule 1: device left on outside office hours (9AM-5PM).
    if (afterHours) {
      for (const device of room.devices) {
        if (device.status === "on") {
          alerts.push({
            id: `after-hours-${device.id}`,
            type: "after-hours",
            severity: "warning",
            roomId: room.id,
            deviceId: device.id,
            message: `${device.label} in ${room.name} is still ON outside office hours (9AM-5PM).`,
            triggeredAt: device.onSince ?? nowIso,
            detectedAt: nowIso,
          });
        }
      }
    }

    // Rule 2: every device in the room has been continuously ON for
    // more than the configured threshold (default 2 simulated hours).
    if (room.devicesOn === room.devicesTotal && room.devicesTotal > 0) {
      const onSinceTimestamps = room.devices
        .map((d) => d.onSince)
        .filter((t): t is string => t !== null);

      if (onSinceTimestamps.length === room.devicesTotal) {
        // The room has only been "fully on" since the *last* device joined in.
        const groupOnSince = onSinceTimestamps.reduce((latest, t) =>
          t > latest ? t : latest
        );
        const hoursOn = simHoursBetween(groupOnSince, nowIso);

        if (hoursOn >= config.continuousOnAlertHours) {
          alerts.push({
            id: `continuous-${room.id}`,
            type: "continuous-2h",
            severity: "critical",
            roomId: room.id,
            deviceId: null,
            message: `${room.name}: all ${room.devicesTotal} devices have been ON continuously for ${hoursOn.toFixed(
              1
            )}h (threshold ${config.continuousOnAlertHours}h).`,
            triggeredAt: groupOnSince,
            detectedAt: nowIso,
          });
        }
      }
    }
  }

  // Most recent / most severe first.
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return b.triggeredAt.localeCompare(a.triggeredAt);
  });
}

export function usageNowIso(): string {
  return simNowIso();
}
