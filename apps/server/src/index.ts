import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { checkDatabaseConnection } from "./db.ts";
import {
  checkOllamaConnection,
  chatWithOllama,
  getOllamaBaseUrl,
  type ChatMessage,
} from "./ollama.ts";

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
    endpoints: ["/health", "/health/ready", "/api/models", "/api/chat"],
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
          models: ollamaStatus.models.map((m) => m.name),
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

// Chat endpoint: handles both streaming (SSE) and synchronous responses
app.post("/api/chat", async (c) => {
  let body: {
    model?: string;
    prompt?: string;
    messages?: ChatMessage[];
    stream?: boolean;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Ensure we have messages
  const messages: ChatMessage[] = body.messages || [];
  if (messages.length === 0 && body.prompt) {
    messages.push({ role: "user", content: body.prompt });
  }

  if (messages.length === 0) {
    return c.json({ error: "No prompt or messages provided" }, 400);
  }

  // Determine model
  let model = body.model;
  if (!model) {
    const health = await checkOllamaConnection();
    if (health.models.length > 0) {
      model = health.models[0].name;
    } else {
      return c.json(
        {
          error: "No Ollama models found. Please pull a model using 'ollama pull <model>'",
        },
        400
      );
    }
  }

  // Check if client requested streaming
  const shouldStream = body.stream === true;

  if (shouldStream) {
    const ollamaBaseUrl = getOllamaBaseUrl();
    const ollamaRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      const errText = await ollamaRes.text().catch(() => "");
      return c.json(
        { error: `Ollama stream error: ${ollamaRes.status} ${errText}` },
        500
      );
    }

    return streamSSE(c, async (stream) => {
      const reader = ollamaRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              await stream.writeSSE({
                data: JSON.stringify({
                  content: chunk.message?.content || "",
                  thinking: chunk.message?.thinking || "",
                  done: chunk.done || false,
                }),
              });
            } catch {
              // ignore malformed chunk
            }
          }
        }

        // flush remaining buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer.trim());
            await stream.writeSSE({
              data: JSON.stringify({
                content: chunk.message?.content || "",
                thinking: chunk.message?.thinking || "",
                done: chunk.done || false,
              }),
            });
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Streaming error:", err);
      }
    });
  }

  // Non-streaming fallback
  try {
    const result = await chatWithOllama({ model, messages });
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

const port = Number(process.env.PORT) || 4000;

console.log(`🦙 MyLlama server listening on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
