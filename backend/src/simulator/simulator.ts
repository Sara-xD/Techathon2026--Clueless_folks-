import { EventEmitter } from "node:events";
import { config } from "../config.js";
import { simNow, simNowIso } from "../simClock.js";
import type { Device, RoomId, RoomSummary, UsageSnapshot } from "../types.js";
import { buildDeviceBlueprints } from "./devices.js";

function jitterWatts(rated: number): number {
  // +/- 5% to look like a live current sensor reading, not a static constant.
  const jitter = rated * 0.05 * (Math.random() * 2 - 1);
  return Math.round((rated + jitter) * 10) / 10;
}

export class Simulator extends EventEmitter {
  private devices: Map<string, Device> = new Map();
  private energyWhSinceStart = 0;
  private lastTickAt = Date.now();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.seedInitialState();
  }

  private seedInitialState() {
    const blueprints = buildDeviceBlueprints();
    const now = simNow();

    for (const bp of blueprints) {
      // Seed roughly realistic starting states: office is close to closing
      // time (see SIM_START_HOUR), so a mix of devices are already on.
      let isOn = Math.random() < 0.55;
      let onSince: Date | null = isOn
        ? new Date(now.getTime() - Math.random() * 45 * 60 * 1000)
        : null;

      // Deliberately seed Work Room 2 as fully-on for a while so the
      // "continuous 2h+" alert is demonstrable immediately on startup,
      // without waiting for the sim clock to organically get there.
      if (bp.roomId === "work2") {
        isOn = true;
        onSince = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
      }

      const device: Device = {
        id: bp.id,
        type: bp.type,
        label: bp.label,
        roomId: bp.roomId,
        roomName: bp.roomName,
        status: isOn ? "on" : "off",
        ratedWatts: bp.ratedWatts,
        currentWatts: isOn ? jitterWatts(bp.ratedWatts) : 0,
        lastChanged: (onSince ?? now).toISOString(),
        onSince: onSince ? onSince.toISOString() : null,
      };

      this.devices.set(device.id, device);
    }
  }

  start() {
    if (this.timer) return;
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => this.tick(), config.simTickMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const now = simNow();
    const nowIso = now.toISOString();

    // Integrate energy usage (Wh) using the power draw over the interval
    // that just elapsed, measured in simulated seconds.
    const realMsElapsed = Date.now() - this.lastTickAt;
    const simSecondsElapsed = (realMsElapsed / 1000) * config.simSpeedMultiplier;
    const totalWattsBeforeTick = this.getTotalWatts();
    this.energyWhSinceStart += (totalWattsBeforeTick * simSecondsElapsed) / 3600;
    this.lastTickAt = Date.now();

    // Randomly flip a small number of devices each tick to keep the office
    // "alive" -- people walking in/out, forgetting to turn things off, etc.
    const allDevices = [...this.devices.values()];
    const flipCount = Math.random() < 0.5 ? 1 : 0;
    for (let i = 0; i < flipCount; i++) {
      const target = allDevices[Math.floor(Math.random() * allDevices.length)];
      this.toggleDevice(target.id, undefined, now);
    }

    // Refresh jitter on currently-on devices so the wattage reading looks live.
    for (const device of this.devices.values()) {
      if (device.status === "on") {
        device.currentWatts = jitterWatts(device.ratedWatts);
      }
    }

    this.emit("tick", nowIso);
  }

  private getTotalWatts(): number {
    let total = 0;
    for (const d of this.devices.values()) total += d.currentWatts;
    return total;
  }

  getDevices(): Device[] {
    return [...this.devices.values()];
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  getRoomSummaries(): RoomSummary[] {
    const byRoom = new Map<RoomId, Device[]>();
    for (const d of this.devices.values()) {
      if (!byRoom.has(d.roomId)) byRoom.set(d.roomId, []);
      byRoom.get(d.roomId)!.push(d);
    }
    return [...byRoom.entries()].map(([roomId, devices]) => ({
      id: roomId,
      name: devices[0].roomName,
      devices,
      totalWatts: Math.round(devices.reduce((s, d) => s + d.currentWatts, 0) * 10) / 10,
      devicesOn: devices.filter((d) => d.status === "on").length,
      devicesTotal: devices.length,
    }));
  }

  getUsage(): UsageSnapshot {
    const rooms = this.getRoomSummaries();
    const perRoomWatts = Object.fromEntries(
      rooms.map((r) => [r.id, r.totalWatts])
    ) as Record<RoomId, number>;
    const totalWatts = Math.round(rooms.reduce((s, r) => s + r.totalWatts, 0) * 10) / 10;

    return {
      totalWatts,
      perRoomWatts,
      todayEstimatedKwh: Math.round((this.energyWhSinceStart / 1000) * 1000) / 1000,
      simulatedNow: simNowIso(),
    };
  }

  /**
   * Toggle a device. Used both by the internal random simulator and by the
   * optional manual-control API (dashboard "flip switch" button).
   */
  toggleDevice(id: string, forceStatus?: "on" | "off", at: Date = simNow()): Device | undefined {
    const device = this.devices.get(id);
    if (!device) return undefined;

    const nextStatus = forceStatus ?? (device.status === "on" ? "off" : "on");
    if (nextStatus === device.status) return device;

    device.status = nextStatus;
    device.lastChanged = at.toISOString();
    if (nextStatus === "on") {
      device.onSince = at.toISOString();
      device.currentWatts = jitterWatts(device.ratedWatts);
    } else {
      device.onSince = null;
      device.currentWatts = 0;
    }

    this.emit("device-change", device);
    return device;
  }
}

export const simulator = new Simulator();
