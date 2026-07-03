import { AlertsPanel } from "./components/AlertsPanel";
import { OfficeLayout } from "./components/OfficeLayout";
import { PowerMeter } from "./components/PowerMeter";
import { RoomPanel } from "./components/RoomPanel";
import { useLiveState } from "./useLiveState";

function SimulatedClock({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <span className="sim-clock" title="Simulated office clock (runs faster than real time for demo purposes)">
      Office clock: {d.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export default function App() {
  const { state, connected } = useLiveState();

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Office Watch</h1>
          <p className="app-subtitle">Live lights &amp; fans monitoring — Clueless_Folks</p>
        </div>
        <div className="app-header-right">
          {state && <SimulatedClock iso={state.simulatedNow} />}
          <span className={`connection-badge ${connected ? "online" : "offline"}`}>
            {connected ? "● Live" : "○ Reconnecting…"}
          </span>
        </div>
      </header>

      {!state ? (
        <div className="loading">Connecting to backend…</div>
      ) : (
        <main className="app-main">
          <OfficeLayout rooms={state.rooms} />

          <div className="app-columns">
            <div className="app-column">
              <PowerMeter usage={state.usage} rooms={state.rooms} />
              <AlertsPanel alerts={state.alerts} />
            </div>
            <div className="app-column rooms-grid">
              {state.rooms.map((room) => (
                <RoomPanel key={room.id} room={room} />
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
