# Office Watch — Lights, Fans, Discord

**Team:** Clueless_Folks · **Event:** Techathon Nationals 2026 — Preliminary Round (Hackathon), IUT Robotics Society

A live office monitoring system for a 3-room office (Drawing Room, Work Room 1,
Work Room 2). A simulated device layer drives one backend, which is the single
source of truth for a real-time web dashboard and a Discord bot — exactly per
the required architecture:

```
[Simulated Device Layer] → [Backend API] → [ Web UI ] && [ Discord Bot ]
```

## 1. Problem statement understanding

The boss wants to see every light/fan in the office, know how much power is
being burned, and be able to ask a Discord bot about it — without opening a
browser. There's no physical hardware for this hackathon; device state must be
simulated but dynamic, and both interfaces must read from **one** shared
backend so they never disagree.

**A note on a discrepancy in the source problem statement:** the brief states
*"2 fans and 3 lights (so 6 devices per room, 18 devices total)"* and the office
layout image's own device summary claims "Total Devices: 18" — but 2 fans + 3
lights = **5** devices/room, and 5 × 3 rooms = **15**, not 18 (the image's own
fan/light subtotals, "Total Fans: 6, Total Lights: 9", are internally consistent
with 2+3 per room and also sum to 15, not 18). We treated this as an arithmetic
slip in the brief and built for the literal, explicit per-room device list:
**2 fans + 3 lights × 3 rooms = 15 devices total.**

## 2. Solution approach & architecture

| Layer | What it does | Where |
|---|---|---|
| Simulated Device Layer | In-process simulator generates/evolves state for all 15 devices (status, wattage, timestamps) on a fast-forwarded virtual clock | `backend/src/simulator/` |
| Backend API | Express REST endpoints + a Socket.IO server; alerts are derived on read, not stored, so there's exactly one source of truth (current device state) | `backend/src/` |
| Web Dashboard | React + Vite SPA, subscribes to the WebSocket for push updates (no polling, no manual refresh) | `dashboard/src/` |
| Discord Bot | discord.js bot (or a local mock CLI when no bot token is configured) that calls the same REST API and optionally rephrases answers with Gemini | `bot/src/` |

Full data-flow diagram: [`diagrams/system-diagram.svg`](diagrams/system-diagram.svg).

### Why a fast-forwarded simulated clock?

Two of the required alert rules are time-based ("after office hours",
"on continuously for 2h+"). Waiting on a real 2-hour clock during a demo isn't
practical, so the simulator runs its own virtual clock at a configurable
multiplier (`SIM_SPEED_MULTIPLIER`, default **60x** — 1 real minute = 1
simulated hour) starting near 4:30 PM, and seeds Work Room 2 as already having
been fully-on for 2.5 simulated hours. Result: both alert types are visible
within the **first ~30–60 seconds** of running the backend, without faking or
hardcoding the alerts themselves — they're still computed live from real
device state each time they're requested.

## 3. Technologies used

- **Backend:** Node.js, TypeScript, Express, Socket.IO
- **Dashboard:** React 18, TypeScript, Vite, socket.io-client (no CSS framework — hand-written CSS)
- **Bot:** discord.js v14 (real mode) / Node `readline` (mock CLI mode), Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai` for humanized replies, with a deterministic template fallback
- **Simulation:** custom in-process simulator + virtual clock (no external DB required; state lives in memory, matching the spec's "in-memory store... your choice")

## 4. Setup & installation

Requires **Node.js 20+** (tested on Node 24) and npm.

```bash
# from the repo root
npm run install:all
```

This installs dependencies for `backend/`, `dashboard/`, and `bot/` (each is an
independent Node project — no shared workspace magic to fight with).

Copy each service's `.env.example` to `.env`:

```bash
cp backend/.env.example backend/.env
cp dashboard/.env.example dashboard/.env
cp bot/.env.example bot/.env
```

Defaults work out of the box for local development. Optional keys:
- `bot/.env` → `GEMINI_API_KEY` (leave blank to use the template fallback — the
  bot works correctly either way, see §6)
- `bot/.env` → `DISCORD_BOT_TOKEN` + `DISCORD_ALERT_CHANNEL_ID` (leave blank to
  run the bot as a local mock CLI instead of a real Discord connection, see §6)

## 5. How to run

**One command from the repo root** (starts backend + dashboard + bot together):

```bash
npm run dev
```

Or run each service individually in separate terminals:

```bash
npm run dev:backend    # http://localhost:4000 (REST + WebSocket)
npm run dev:dashboard  # http://localhost:5173 (open this in a browser)
npm run dev:bot        # mock CLI in this terminal, or a real Discord bot if DISCORD_BOT_TOKEN is set
```

Open **http://localhost:5173** — the dashboard connects over WebSocket
immediately and updates live. In the bot terminal (mock CLI mode by default),
type commands directly: `!status`, `!room work1`, `!usage`.

### Running as a real Discord bot instead of the mock CLI

1. Create a Discord Application + Bot at the [Discord Developer Portal](https://discord.com/developers/applications), enable the **Message Content Intent**, invite it to a server with the `bot` + `applications.commands` scopes and `Send Messages`/`Read Message History` permissions.
2. Put the bot token in `bot/.env` as `DISCORD_BOT_TOKEN`.
3. (Optional, for proactive alerts) put a channel ID in `DISCORD_ALERT_CHANNEL_ID`.
4. `npm run dev:bot` — it now connects to Discord instead of starting the mock CLI.

## 6. AI integration details

- **Model:** Google Gemini (`gemini-2.0-flash` by default, configurable via `GEMINI_MODEL`), called through `bot/src/llm.ts`.
- **What it does:** takes a factual, backend-derived string (e.g. `"Work Room 2: 2 fans ON, 3 lights ON."`) and rewrites it as a short, warm Discord-style reply. The LLM is only allowed to *restyle* the facts, never asked to produce numbers itself — the raw facts always come straight from `/api/state`, `/api/rooms/:id`, `/api/usage`.
- **Fallback behavior (important):** if no `GEMINI_API_KEY` is set, the call times out (8s), or the API errors (rate limit, invalid key, etc.), `humanize()` catches the failure and returns the original factual string unchanged — which is already written to read naturally (see `bot/src/templates.ts`) and matches the exact style of the spec's own examples (`"Drawing Room: 1 fan ON, 2 lights ON..."`). **The bot never crashes or hangs because of the LLM.** This was verified during development: our test Gemini key returned `429 quota exceeded (limit: 0)` on every call, and the bot degraded to templates automatically without any user-visible failure.
- **Where this shows up in the rubric:** this is a direct implementation of "proper handling of AI limitations and edge cases."

## 7. API endpoints

All endpoints are served from the backend at `http://localhost:4000` (configurable via `PORT`).

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/state` | Full snapshot: devices + rooms + usage + alerts + simulated clock (one call, used by the bot and dashboard's initial load) |
| GET | `/api/devices` | Flat list of all 15 devices |
| GET | `/api/rooms` | All 3 rooms with their devices and aggregated wattage |
| GET | `/api/rooms/:roomId` | One room (`drawing`, `work1`, `work2`) |
| GET | `/api/usage` | Total watts, per-room watts, today's estimated kWh |
| GET | `/api/alerts` | Currently active alerts (after-hours, continuous-2h+), derived live |
| POST | `/api/devices/:id/toggle` | Manual override — flips one device (used by the dashboard's clickable device rows; not required by the spec but makes the dashboard genuinely interactive for judges) |

**WebSocket** (Socket.IO, same origin/port as REST): server emits `state:update`
with the same shape as `GET /api/state` on every simulator tick and on every
device change; clients can emit `device:toggle` with a device id to flip it.

## 8. Diagrams

- [`diagrams/system-diagram.svg`](diagrams/system-diagram.svg) — full data-flow diagram (hand-authored SVG, no Mermaid, per the rules)
- [`diagrams/circuit-schematic.md`](diagrams/circuit-schematic.md) — hardware/electrical build spec for a representative room circuit: bill of materials, ESP32 pin-mapping table, wiring list, safety-isolated relay design, and the ADC→watts current-sensing math
- [`diagrams/circuit-wiring-diagram.svg`](diagrams/circuit-wiring-diagram.svg) — companion wiring diagram for the schematic above

The circuit is written as a build spec rather than an exported Wokwi project
file, specifically so it can be laid out and understood component-by-component
in the Wokwi editor using the pin table, rather than imported as an opaque
black box.

## 9. Known limitations / honest notes

- **Device count:** built for 15 devices, not the internally-inconsistent "18" in the brief — see §1.
- **Gemini quota:** the development API key hit `429`/quota-0 on every call; the bot's template fallback is what you'll see live unless a working key is supplied (see §6). This is by design, not a bug — the app doesn't depend on the LLM being available.
- **Current sensing in the circuit schematic:** Wokwi has no stock ACS712 part, so a potentiometer stands in for it in the simulated circuit; this is documented explicitly in `circuit-schematic.md` §5, not hidden.
- **Dev-tooling `npm audit` findings:** a few moderate/high advisories show up in `dashboard`'s Vite dev-server chain and `bot`'s discord.js→undici chain. Both are upstream transitive dependencies (Vite's dev-only server, and discord.js's HTTP client) — fixing the discord.js one requires downgrading to discord.js v13, a larger breaking change not worth making under the hackathon deadline. Neither affects the app's actual runtime logic.

## 10. Project structure

```
backend/    Express + Socket.IO API, device simulator, alerts engine
dashboard/  React + Vite live dashboard
bot/        Discord bot / mock CLI, Gemini integration, backend REST client
diagrams/   System diagram + circuit schematic (required deliverables)
```

## 11. Team

**Clueless_Folks** — Techathon Nationals 2026, IUT Robotics Society.
