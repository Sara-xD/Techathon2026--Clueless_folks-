import { backend } from "./backendClient.js";
import { humanize } from "./llm.js";
import {
  UNKNOWN_ROOM_TEMPLATE,
  buildRoomTemplate,
  buildStatusTemplate,
  buildUsageTemplate,
} from "./templates.js";
import type { RoomId } from "./types.js";

const ROOM_ALIASES: Record<string, RoomId> = {
  drawing: "drawing",
  "drawing-room": "drawing",
  "drawingroom": "drawing",
  "drawing room": "drawing",
  work1: "work1",
  "work-room-1": "work1",
  "work room 1": "work1",
  "workroom1": "work1",
  "work-1": "work1",
  "1": "work1",
  work2: "work2",
  "work-room-2": "work2",
  "work room 2": "work2",
  "workroom2": "work2",
  "work-2": "work2",
  "2": "work2",
};

export function resolveRoomId(input: string): RoomId | null {
  const key = input.trim().toLowerCase();
  return ROOM_ALIASES[key] ?? null;
}

export async function handleStatus(): Promise<string> {
  const state = await backend.getState();
  const facts = buildStatusTemplate(state);
  return humanize(facts);
}

export async function handleRoom(rawArg: string | undefined): Promise<string> {
  if (!rawArg) {
    return "Which room? Try `!room drawing`, `!room work1`, or `!room work2`.";
  }
  const roomId = resolveRoomId(rawArg);
  if (!roomId) {
    return UNKNOWN_ROOM_TEMPLATE(rawArg, "drawing, work1, work2");
  }
  const { room } = await backend.getRoom(roomId);
  const facts = buildRoomTemplate(room);
  return humanize(facts);
}

export async function handleUsage(): Promise<string> {
  const usage = await backend.getUsage();
  const facts = buildUsageTemplate(usage);
  return humanize(facts);
}
