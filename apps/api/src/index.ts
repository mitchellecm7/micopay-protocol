import "./config.js"; // load .env into process.env first
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { cashRoutes } from "./routes/cash.js";
import { reputationRoutes } from "./routes/reputation.js";
import { fundRoutes } from "./routes/fund.js";
import { serviceRoutes } from "./routes/services.js";
import { demoRoutes } from "./routes/demo.js";
import { bazaarRoutes } from "./routes/bazaar.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";

const app = Fastify({
  logger:
    NODE_ENV === "development"
      ? {
          level: "info",
          transport: { target: "pino-pretty", options: { colorize: true } },
        }
      : true,
});

// --- Plugins ---

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// --- Global error handler ---
app.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.status(400).send({ error: "ValidationError", message: error.message });
    return;
  }
  request.log.error(error);
  reply.status(500).send({ error: "InternalServerError", message: "Something went wrong" });
});

// --- Health check ---
app.get("/health", async () => ({
  status: "ok",
  service: "micopay-protocol-api",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  payment_method: "x402",
  network: process.env.STELLAR_NETWORK ?? "testnet",
}));

// --- Routes ---
app.register(cashRoutes);
app.register(reputationRoutes);
app.register(fundRoutes);
app.register(serviceRoutes);
app.register(demoRoutes);
app.register(bazaarRoutes);

// --- Start ---
async function start() {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n  Micopay Protocol API — http://localhost:${PORT}`);
    console.log(`  Payment method: x402 (USDC on Stellar)`);
    console.log(`  Service discovery: http://localhost:${PORT}/api/v1/services\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
