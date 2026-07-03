import type { RoomSummary } from "../types";
import { toggleDevice } from "../useLiveState";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function RoomPanel({ room }: { room: RoomSummary }) {
  return (
    <section className="room-panel">
      <header className="room-panel-header">
        <h3>{room.name}</h3>
        <span className="room-panel-badge">
          {room.devicesOn}/{room.devicesTotal} ON &middot; {room.totalWatts}W
        </span>
      </header>
      <ul className="device-list">
        {room.devices.map((device) => (
          <li key={device.id} className={`device-row ${device.status}`}>
            <button
              className={`device-toggle ${device.status}`}
              onClick={() => toggleDevice(device.id)}
              aria-pressed={device.status === "on"}
              title="Click to toggle (manual override)"
            >
              <span className="device-icon">{device.type === "fan" ? "🌀" : "💡"}</span>
              <span className="device-name">{device.label}</span>
              <span className="device-state">{device.status.toUpperCase()}</span>
            </button>
            <div className="device-meta">
              <span>{device.status === "on" ? `${device.currentWatts}W` : "0W"}</span>
              <span>changed {formatTime(device.lastChanged)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
