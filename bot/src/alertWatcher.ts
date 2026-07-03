import { config } from "./config.js";
import { backend } from "./backendClient.js";
import type { Alert } from "./types.js";

/**
 * Polls the backend and invokes onNewAlert for any alert id not seen
 * before (edge-triggered), so proactive notifications fire once per
 * alert condition instead of spamming every poll interval. If an alert
 * clears and later re-triggers, it is treated as new again.
 */
export function watchAlerts(onNewAlert: (alert: Alert) => void) {
  const announced = new Set<string>();

  const poll = async () => {
    try {
      const { alerts } = await backend.getAlerts();
      const currentIds = new Set(alerts.map((a) => a.id));

      for (const alert of alerts) {
        if (!announced.has(alert.id)) {
          announced.add(alert.id);
          onNewAlert(alert);
        }
      }

      for (const id of announced) {
        if (!currentIds.has(id)) announced.delete(id);
      }
    } catch (err) {
      console.warn(`[bot] alert poll failed: ${(err as Error).message}`);
    }
  };

  poll();
  const timer = setInterval(poll, config.alertPollMs);
  return () => clearInterval(timer);
}
