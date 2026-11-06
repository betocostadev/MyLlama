const ollamaBaseUrl =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export async function checkOllamaConnection(): Promise<{
  connected: boolean;
  version?: string;
  models: OllamaModel[];
  message: string;
}> {
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
