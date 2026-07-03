# Hardware / Electrical Schematic — Representative Circuit (Work Room 1)

> Concept/simulation only, per the problem statement. No physical hardware was built.
> This document is a build spec for you to lay out in **Wokwi** (recommended over
> Tinkercad here — Wokwi has native ESP32 + relay + DC motor parts and a code
> editor that's easier to pair with AI assistance while wiring). It intentionally
> is not a pre-made project export — build it yourself in the editor using the
> pin table below so you fully understand the wiring before demo Q&A.

## 1. Scope

One representative room — **Work Room 1** (2 fans + 3 lights = 5 switched circuits) —
wired to a single ESP32. The other two rooms would be physically identical repeats
(a second and third ESP32, or one ESP32 with more relay channels — see §7).

## 2. Bill of materials

| # | Component | Purpose | Wokwi part search |
|---|---|---|---|
| 1 | ESP32 DevKit V1 | Microcontroller: drives relays, reads current sensor, talks to backend over Wi-Fi | `esp32-devkit-v1` |
| 2 | 5V 5-channel (or 8-channel, using 5) opto-isolated relay module | Switches mains AC to each fan/light without exposing the ESP32 to line voltage | `relay-module` |
| 3 | ACS712 current sensor (5A or 20A variant) | Senses aggregate current drawn by the room's devices | not in default Wokwi library — see §5 substitution note |
| 4 | 2x small DC motor + diode | Stand-ins for the 2 fans in simulation (Wokwi can't simulate real AC induction fan motors) | `dc-motor` |
| 5 | 3x LED + 220Ω resistor | Stand-ins for the 3 lights in simulation | `led`, `resistor` |
| 6 | Potentiometer | Stand-in for ACS712's analog output, since Wokwi has no stock current-sensor part (§5) | `potentiometer` |
| 7 | Breadboard + jumper wires | Prototyping | `breadboard-half` |

In a **real build**, items 4–5 would instead be the relay's COM/NO contacts wired
into the room's actual 220V mains circuit feeding the real fans/lights — see §4.

## 3. Pin mapping table (ESP32)

| ESP32 pin | Connects to | Function | Notes |
|---|---|---|---|
| GPIO 16 | Relay IN1 | Fan 1 control | Active-LOW on most cheap relay boards — confirm polarity on your module |
| GPIO 17 | Relay IN2 | Fan 2 control | |
| GPIO 18 | Relay IN3 | Light 1 control | |
| GPIO 19 | Relay IN4 | Light 2 control | |
| GPIO 21 | Relay IN5 | Light 3 control | |
| GPIO 34 (ADC1_CH6, input-only) | ACS712 OUT (or potentiometer wiper in sim) | Aggregate room current reading | ADC1 channels stay usable even while Wi-Fi is active, unlike ADC2 |
| 5V (VIN) | Relay module VCC, ACS712 VCC | Power for relay coils + sensor | Relay coils draw more current than a GPIO can supply — never power from 3.3V pin |
| 3V3 | — | Not used for relay drive | Kept isolated from the relay coil side by design |
| GND | Relay module GND, ACS712 GND | Common ground reference | Must be common between ESP32 and relay module logic side for IN signals to register correctly |

## 4. Wiring / connection list

**Low-voltage control side (breadboard, ESP32 logic — 3.3V/5V DC, safe to touch):**
1. ESP32 GPIO16 → Relay IN1; GPIO17 → IN2; GPIO18 → IN3; GPIO19 → IN4; GPIO21 → IN5.
2. ESP32 5V → Relay module VCC. ESP32 GND → Relay module GND.
3. ACS712 (or potentiometer stand-in) OUT → ESP32 GPIO34. ACS712 VCC → 5V, GND → GND.

**High-voltage load side (mains AC — conceptual only, NOT built in Wokwi):**
4. Mains **Live** → in through each relay's **COM** terminal.
5. Each relay's **NO** (Normally Open) terminal → that device's live input. NO (not NC)
   so devices default OFF if the ESP32 loses power or resets — a deliberate fail-safe.
6. Mains **Neutral** is bussed directly to all 5 devices (never switched — only Live
   is switched, per standard single-pole switching practice).
7. The ACS712 (or a clamp-on CT sensor like an SCT-013 for a non-invasive real build)
   sits in series with the room's Live feed, **after** the relay bank, so it measures
   the sum of whatever is actually switched on — this is what produces the room's
   `totalWatts` aggregate reading.
8. Each relay module has onboard opto-isolation between its low-voltage control
   side and its high-voltage switching side — this is the safety boundary that
   keeps the ESP32 and breadboard fully isolated from mains voltage.

**⚠️ Safety note:** mains wiring (steps 4–7) must only be done by a qualified
person, with the circuit de-energized while wiring, in a real deployment. This
project only simulates the logic; no mains wiring was physically built.

## 5. Wokwi part substitutions (documented, not hidden)

Wokwi's stock library doesn't include an ACS712 or a "generic AC light/fan" part,
so the simulation stands in as follows — this substitution is deliberate and
explained here so it doesn't read as a mistake during Q&A:

| Real component | Wokwi stand-in | Why it's a fair substitute |
|---|---|---|
| Fan (AC induction motor) | DC motor | Same control signal path (relay-switched), demonstrates the on/off + rotation behavior |
| Light (AC bulb/LED panel) | LED + resistor | Same control signal path, demonstrates on/off + visual brightness state |
| ACS712 current sensor | Potentiometer into ADC pin | Both produce a variable analog voltage into GPIO34 — the potentiometer lets you manually demonstrate the firmware's ADC-to-watts conversion logic without a real current draw to measure |

## 6. Electrical reasoning: from ADC reading to watts

The ACS712 outputs an analog voltage centered at `Vcc/2` that swings proportionally
to instantaneous current (sensitivity ~185mV/A for the 5A variant). Firmware logic:

```
raw          = analogRead(GPIO34)          // 0–4095 (ESP32 12-bit ADC)
voltage      = raw * (3.3 / 4095)          // convert to volts at the pin
centered     = voltage - (3.3 / 2)         // remove the sensor's DC offset
currentAmps  = abs(centered) / 0.185       // sensitivity for ACS712-05B
roomWatts    = currentAmps * MAINS_VOLTAGE // MAINS_VOLTAGE = 220 (assumed, not measured)
```

`MAINS_VOLTAGE` is a constant here rather than sensed, since a voltage sensor
(e.g. ZMPT101B) is a reasonable stretch upgrade but out of scope for "makes
physical sense at a representative/conceptual level."

This mirrors the simulated data model deliberately: the software layer estimates
each **device's** wattage from its known rated value when its relay is commanded
ON (`ratedWatts`), while the **room total** would, in a real deployment, come from
the one physical current sensor per room — exactly like `RoomSummary.totalWatts`
in `backend/src/simulator/simulator.ts` is a sum of per-device estimates today,
and would instead be a real aggregate measurement once hardware is attached.

## 7. Scaling to all 3 rooms

- **Option A (simplest):** one ESP32 per room (3 total), each running identical
  firmware with its own Wi-Fi connection and room ID, each POSTing its 5 device
  states + 1 current reading to the backend's `/api/devices/:id/toggle`-style
  ingestion endpoint (would need a small firmware-facing endpoint added if this
  became a real hardware phase 2).
- **Option B:** one ESP32 with an 8/16-channel relay module and a current sensor
  per room feed (3x ACS712, one per room's main breaker), all on one board's ADC
  pins (GPIO34/35/32/33 are all valid ADC1 input-only pins).

Both keep the same control logic in §6 per room; Option B just multiplies the
relay/sensor count on one microcontroller instead of three.

## 8. How this maps back into the software system

See [`system-diagram.svg`](./system-diagram.svg) Layer 1. Today, Layer 1 is the
in-process `Simulator` class (no hardware). If real ESP32s were attached, they
would replace `Simulator`'s random tick logic 1:1 — same `Device` shape
(`status`, `currentWatts`, `roomId`, `lastChanged`, `onSince`) — by having each
ESP32 report readings to the backend instead of the backend generating them.
Nothing downstream (REST API, WebSocket broadcast, dashboard, bot) would need to
change, because they only ever consume the `Device`/`RoomSummary` shape, not the
simulator internals.
