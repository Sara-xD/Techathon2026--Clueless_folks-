import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { config } from "./config.js";
import { apiRouter } from "./routes/api.js";
import { simulator } from "./simulator/simulator.js";
import { attachWebsocket } from "./ws/socket.js";

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use("/api", apiRouter);

const httpServer = createServer(app);
attachWebsocket(httpServer);

simulator.start();

httpServer.listen(config.port, () => {
  console.log(`[backend] REST + WebSocket server listening on :${config.port}`);
  console.log(`[backend] CORS origins: ${config.corsOrigin.join(", ")}`);
  console.log(
    `[backend] Simulated clock speed: ${config.simSpeedMultiplier}x (1 real second = ${config.simSpeedMultiplier} simulated seconds)`
  );
});
