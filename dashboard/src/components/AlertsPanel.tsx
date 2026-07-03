import type { Alert } from "../types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="alerts-panel">
      <header className="alerts-panel-header">
        <h3>Active Alerts</h3>
        <span className="alerts-count">{alerts.length}</span>
      </header>
      {alerts.length === 0 ? (
        <p className="alerts-empty">No active alerts. Everything looks normal. ✅</p>
      ) : (
        <ul className="alerts-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-item ${alert.severity}`}>
              <span className="alert-icon">{alert.severity === "critical" ? "🛑" : "⚠️"}</span>
              <div className="alert-body">
                <p className="alert-message">{alert.message}</p>
                <p className="alert-timestamp">
                  since {formatTime(alert.triggeredAt)} &middot; detected {formatTime(alert.detectedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
