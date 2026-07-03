import type { Device, DeviceType, RoomId, RoomMeta } from "../types.js";

export const ROOMS: RoomMeta[] = [
  { id: "drawing", name: "Drawing Room", fanCount: 2, lightCount: 3 },
  { id: "work1", name: "Work Room 1", fanCount: 2, lightCount: 3 },
  { id: "work2", name: "Work Room 2", fanCount: 2, lightCount: 3 },
];

// Small fixed per-unit variance so devices feel like real, distinct hardware
// rather than clones, while staying close to the spec's example wattages
// (fan ~60W, light ~15W).
const FAN_WATTS = [58, 62];
const LIGHT_WATTS = [14, 15, 16];

export function ratedWattsFor(type: DeviceType, indexInRoom: number): number {
  return type === "fan"
    ? FAN_WATTS[indexInRoom % FAN_WATTS.length]
    : LIGHT_WATTS[indexInRoom % LIGHT_WATTS.length];
}

/** Blueprint for a device, before any runtime state (status/timestamps) is assigned. */
export interface DeviceBlueprint {
  id: string;
  type: DeviceType;
  label: string;
  roomId: RoomId;
  roomName: string;
  ratedWatts: number;
}

export function buildDeviceBlueprints(): DeviceBlueprint[] {
  const blueprints: DeviceBlueprint[] = [];

  for (const room of ROOMS) {
    for (let i = 0; i < room.fanCount; i++) {
      blueprints.push({
        id: `${room.id}-fan-${i + 1}`,
        type: "fan",
        label: `Fan ${i + 1}`,
        roomId: room.id,
        roomName: room.name,
        ratedWatts: ratedWattsFor("fan", i),
      });
    }
    for (let i = 0; i < room.lightCount; i++) {
      blueprints.push({
        id: `${room.id}-light-${i + 1}`,
        type: "light",
        label: `Light ${i + 1}`,
        roomId: room.id,
        roomName: room.name,
        ratedWatts: ratedWattsFor("light", i),
      });
    }
  }

  return blueprints;
}

export type { Device };
