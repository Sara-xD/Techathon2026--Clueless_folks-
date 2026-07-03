import type { Server as HttpServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";
import { config } from "../config.js";
import { simulator } from "../simulator/simulator.js";
import { buildStatePayload } from "../state.js";

/**
 * Single broadcast channel: every tick (simulator heartbeat) and every
 * manual toggle re-emits the full state snapshot to all connected clients.
 * The dashboard is the only consumer today, but the Discord bot could
 * subscribe the same way instead of polling REST if that's ever needed.
 */
export function attachWebsocket(httpServer: HttpServer) {
  const io = new SocketIoServer(httpServer, {
    cors: { origin: config.corsOrigin },
  });

  io.on("connection", (socket) => {
    socket.emit("state:update", buildStatePayload());

    socket.on("device:toggle", (deviceId: string) => {
      simulator.toggleDevice(deviceId);
    });
  });

  const broadcast = () => io.emit("state:update", buildStatePayload());

  simulator.on("tick", broadcast);
  simulator.on("device-change", broadcast);

  return io;
}
