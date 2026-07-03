// Mirrors backend/src/types.ts (kept as a plain duplicate, see dashboard for rationale).
export type DeviceType = "fan" | "light";
export type DeviceStatus = "on" | "off";
export type RoomId = "drawing" | "work1" | "work2";

export interface Device {
  id: string;
  type: DeviceType;
  label: string;
  roomId: RoomId;
  roomName: string;
  status: DeviceStatus;
  ratedWatts: number;
  currentWatts: number;
  lastChanged: string;
  onSince: string | null;
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
  triggeredAt: string;
  detectedAt: string;
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
