import type { RoomSummary } from "../types";

// Fixed top-down layout: 3 rooms side-by-side, matching the office plan in
// the problem statement (Drawing Room | Work Room 1 | Work Room 2).
const ROOM_WIDTH = 260;
const ROOM_HEIGHT = 220;
const GAP = 16;
const SVG_WIDTH = ROOM_WIDTH * 3 + GAP * 2;
const SVG_HEIGHT = ROOM_HEIGHT + 40;

function FanIcon({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="18" fill={on ? "#2b3550" : "#1c2333"} stroke={on ? "#7fd4ff" : "#3a4666"} strokeWidth="2" />
      <g className={on ? "fan-blades spin" : "fan-blades"}>
        <ellipse cx="0" cy="-8" rx="4" ry="9" fill={on ? "#7fd4ff" : "#4a5678"} />
        <ellipse cx="7" cy="4" rx="4" ry="9" fill={on ? "#7fd4ff" : "#4a5678"} transform="rotate(120 7 4)" />
        <ellipse cx="-7" cy="4" rx="4" ry="9" fill={on ? "#7fd4ff" : "#4a5678"} transform="rotate(240 -7 4)" />
      </g>
      <circle r="3" fill={on ? "#e7f7ff" : "#6b7aa0"} />
    </g>
  );
}

function LightIcon({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {on && <circle r="16" fill="#ffd873" opacity="0.35" className="glow-pulse" />}
      <circle r="9" fill={on ? "#ffd873" : "#333c56"} stroke={on ? "#ffb703" : "#4a5678"} strokeWidth="2" />
    </g>
  );
}

function roomDevicePositions(room: RoomSummary) {
  const fans = room.devices.filter((d) => d.type === "fan");
  const lights = room.devices.filter((d) => d.type === "light");
  const fanPositions = fans.map((d, i) => ({ device: d, x: 70 + i * 120, y: 60 }));
  const lightPositions = lights.map((d, i) => ({ device: d, x: 45 + i * 85, y: 160 }));
  return [...fanPositions, ...lightPositions];
}

export function OfficeLayout({ rooms }: { rooms: RoomSummary[] }) {
  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="office-layout"
      role="img"
      aria-label="Top-down office layout showing live device state"
    >
      {rooms.map((room, roomIndex) => {
        const ox = roomIndex * (ROOM_WIDTH + GAP);
        const positions = roomDevicePositions(room);
        return (
          <g key={room.id} transform={`translate(${ox}, 20)`}>
            <rect
              width={ROOM_WIDTH}
              height={ROOM_HEIGHT}
              rx="10"
              fill="#141a2b"
              stroke="#2c3552"
              strokeWidth="2"
            />
            <text x="14" y="24" className="room-label">
              {room.name}
            </text>
            <text x="14" y={ROOM_HEIGHT - 10} className="room-sub">
              {room.devicesOn}/{room.devicesTotal} on · {room.totalWatts}W
            </text>
            {/* simple desk/furniture flavor */}
            <rect x="30" y="100" width="46" height="26" rx="3" fill="#20283f" stroke="#333c56" />
            <rect x={ROOM_WIDTH - 76} y="100" width="46" height="26" rx="3" fill="#20283f" stroke="#333c56" />

            {positions.map(({ device, x, y }) =>
              device.type === "fan" ? (
                <FanIcon key={device.id} x={x} y={y} on={device.status === "on"} />
              ) : (
                <LightIcon key={device.id} x={x} y={y} on={device.status === "on"} />
              )
            )}
          </g>
        );
      })}
    </svg>
  );
}
