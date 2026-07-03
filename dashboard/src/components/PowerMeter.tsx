import type { RoomSummary, UsageSnapshot } from "../types";

export function PowerMeter({ usage, rooms }: { usage: UsageSnapshot; rooms: RoomSummary[] }) {
  const maxRoomWatts = Math.max(1, ...rooms.map((r) => r.totalWatts));

  return (
    <section className="power-meter">
      <div className="power-meter-total">
        <span className="power-meter-label">Total power right now</span>
        <span className="power-meter-value">{usage.totalWatts}W</span>
        <span className="power-meter-sub">Today&apos;s estimated usage: {usage.todayEstimatedKwh} kWh</span>
      </div>
      <div className="power-meter-rooms">
        {rooms.map((room) => (
          <div className="power-meter-room" key={room.id}>
            <div className="power-meter-room-labels">
              <span>{room.name}</span>
              <span>{room.totalWatts}W</span>
            </div>
            <div className="power-meter-bar-track">
              <div
                className="power-meter-bar-fill"
                style={{ width: `${(room.totalWatts / maxRoomWatts) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
