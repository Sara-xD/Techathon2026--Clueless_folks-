import { Router } from "express";
import { computeAlerts } from "../alerts.js";
import { simulator } from "../simulator/simulator.js";
import { buildStatePayload } from "../state.js";
import type { RoomId } from "../types.js";

const VALID_ROOM_IDS: RoomId[] = ["drawing", "work1", "work2"];

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "techathon-backend" });
});

// Full combined snapshot -- convenient single call for the bot and for the
// dashboard's initial load before the WebSocket connection takes over.
apiRouter.get("/state", (_req, res) => {
  res.json(buildStatePayload());
});

apiRouter.get("/devices", (_req, res) => {
  res.json({ devices: simulator.getDevices() });
});

apiRouter.get("/rooms", (_req, res) => {
  res.json({ rooms: simulator.getRoomSummaries() });
});

apiRouter.get("/rooms/:roomId", (req, res) => {
  const roomId = req.params.roomId as RoomId;
  if (!VALID_ROOM_IDS.includes(roomId)) {
    res.status(404).json({
      error: `Unknown room "${req.params.roomId}". Valid rooms: ${VALID_ROOM_IDS.join(", ")}`,
    });
    return;
  }
  const room = simulator.getRoomSummaries().find((r) => r.id === roomId);
  res.json({ room });
});

apiRouter.get("/usage", (_req, res) => {
  res.json(simulator.getUsage());
});

apiRouter.get("/alerts", (_req, res) => {
  res.json({ alerts: computeAlerts(simulator.getRoomSummaries()) });
});

// Manual override -- lets the dashboard act as a real control surface
// (and gives judges something interactive to click), on top of the
// autonomous simulator. Not required by the spec but low-risk and useful.
apiRouter.post("/devices/:id/toggle", (req, res) => {
  const device = simulator.getDevice(req.params.id);
  if (!device) {
    res.status(404).json({ error: `Unknown device "${req.params.id}"` });
    return;
  }
  const updated = simulator.toggleDevice(req.params.id);
  res.json({ device: updated });
});
