// Manual dev script (`npm run smoketest`) -- exercises the real command
// handlers against a running backend, without needing Discord. Useful for
// quickly verifying REST connectivity and LLM/template output after changes.
import { handleRoom, handleStatus, handleUsage } from "./commands.js";

const status = await handleStatus();
console.log("STATUS:", status);

const room = await handleRoom("work2");
console.log("ROOM work2:", room);

const usage = await handleUsage();
console.log("USAGE:", usage);

const unknown = await handleRoom("kitchen");
console.log("UNKNOWN ROOM:", unknown);
