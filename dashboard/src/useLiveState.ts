import { useEffect, useState } from "react";
import { socket } from "./socket";
import type { StatePayload } from "./types";

export function useLiveState() {
  const [state, setState] = useState<StatePayload | null>(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onUpdate = (payload: StatePayload) => setState(payload);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("state:update", onUpdate);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("state:update", onUpdate);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { state, connected };
}

export function toggleDevice(deviceId: string) {
  socket.emit("device:toggle", deviceId);
}
