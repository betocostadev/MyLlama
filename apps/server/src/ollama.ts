import type { OllamaModel, ChatMessage } from "@myllama/types";

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

export async function checkOllamaConnection(): Promise<{
  connected: boolean;
  version?: string;
  models: OllamaModel[];
  message: string;
}> {
  const ollamaBaseUrl = getOllamaBaseUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const versionRes = await fetch(`${ollamaBaseUrl}/api/version`, {
      signal: controller.signal,
    }).catch(() => null);

    const tagsRes = await fetch(`${ollamaBaseUrl}/api/tags`, {
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (!versionRes && !tagsRes) {
      return {
        connected: false,
        models: [],
        message: `Could not connect to Ollama at ${ollamaBaseUrl}`,
      };
    }

    let version = "unknown";
    if (versionRes && versionRes.ok) {
      const data = (await versionRes.json()) as { version?: string };
      version = data.version || "detected";
    }

    let models: OllamaModel[] = [];
    if (tagsRes && tagsRes.ok) {
      const data = (await tagsRes.json()) as { models?: OllamaModel[] };
      models = data.models || [];
    }

    return {
      connected: true,
      version,
      models,
      message: `Ollama connected (${models.length} model${models.length === 1 ? "" : "s"} found)`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      models: [],
      message: `Ollama check failed: ${message}`,
    };
  }
}

export async function chatWithOllama({
  model,
  messages,
}: {
  model: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<{
  model: string;
  content: string;
  thinking?: string;
  totalDuration?: number;
}> {
  const ollamaBaseUrl = getOllamaBaseUrl();
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Ollama returned status ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    model: string;
    message?: {
      role: string;
      content: string;
      thinking?: string;
    };
    total_duration?: number;
  };

  return {
    model: data.model,
    content: data.message?.content || "",
    thinking: data.message?.thinking,
    totalDuration: data.total_duration,
  };
}
