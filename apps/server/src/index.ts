import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkDatabaseConnection } from "./db.ts";
import { checkOllamaConnection } from "./ollama.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({
    name: "MyLlama Backend API",
    status: "running",
    endpoints: ["/health", "/health/ready", "/api/models"],
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "myllama-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", async (c) => {
  const [dbStatus, ollamaStatus] = await Promise.all([
    checkDatabaseConnection(),
    checkOllamaConnection(),
  ]);

  const isReady = dbStatus.connected;

  return c.json(
    {
      status: isReady ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus.connected ? "connected" : "disconnected",
          message: dbStatus.message,
        },
        ollama: {
          status: ollamaStatus.connected ? "connected" : "disconnected",
          version: ollamaStatus.version,
          modelsCount: ollamaStatus.models.length,
          message: ollamaStatus.message,
        },
      },
    },
    isReady ? 200 : 503
  );
});

app.get("/api/models", async (c) => {
  const ollama = await checkOllamaConnection();
  if (!ollama.connected) {
    return c.json(
      {
        error: "Ollama service unavailable",
        message: ollama.message,
        models: [],
      },
      503
    );
  }
  return c.json({
    models: ollama.models,
  });
});

const port = Number(process.env.PORT) || 4000;

console.log(`🦙 MyLlama server listening on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
