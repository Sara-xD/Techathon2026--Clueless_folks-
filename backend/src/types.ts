export type DeviceType = "fan" | "light";
export type DeviceStatus = "on" | "off";

export type RoomId = "drawing" | "work1" | "work2";

export interface RoomMeta {
  id: RoomId;
  name: string;
  fanCount: number;
  lightCount: number;
}

export interface Device {
  id: string; // e.g. "work1-fan-1"
  type: DeviceType;
  label: string; // e.g. "Fan 1" (scoped to its room, matches spec examples)
  roomId: RoomId;
  roomName: string;
  status: DeviceStatus;
  ratedWatts: number; // nameplate draw when ON
  currentWatts: number; // 0 when off, ratedWatts (+/- jitter) when on
  lastChanged: string; // ISO timestamp (simulated clock)
  onSince: string | null; // ISO timestamp of the start of the current ON streak, null if off
}

export interface RoomSummary {
  id: RoomId;
  name: string;
  devices: Device[];
  totalWatts: number;
  devicesOn: number;
  devicesTotal: number;
}

export type AlertType = "after-hours" | "continuous-2h";
export type AlertSeverity = "warning" | "critical";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  roomId: RoomId | null;
  deviceId: string | null;
  message: string;
  triggeredAt: string; // ISO timestamp (simulated clock) when condition first became true
  detectedAt: string; // ISO timestamp (simulated clock) of this evaluation
}

export interface UsageSnapshot {
  totalWatts: number;
  perRoomWatts: Record<RoomId, number>;
  todayEstimatedKwh: number;
  simulatedNow: string;
}

export interface StatePayload {
  devices: Device[];
  rooms: RoomSummary[];
  usage: UsageSnapshot;
  alerts: Alert[];
  simulatedNow: string;
}
