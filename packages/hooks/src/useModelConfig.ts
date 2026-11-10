import { useState, useEffect, useCallback } from "react";
import type { OllamaModel, ModelConfig } from "@myllama/types";

export interface UseModelConfigOptions {
  apiUrl: string;
  defaultConfig?: ModelConfig;
  storageKey?: string;
}

export interface UseModelConfigReturn {
  models: OllamaModel[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  config: ModelConfig;
  updateConfig: (partial: Partial<ModelConfig>) => void;
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;
  error: string | null;
}

const STORAGE_PREFIX = "myllama:model-settings";

export function useModelConfig({
  apiUrl,
  defaultConfig = { temperature: 0.7 },
  storageKey = STORAGE_PREFIX,
}: UseModelConfigOptions): UseModelConfigReturn {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore saved model name
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(`${storageKey}:selected`);
        if (saved) return saved;
      } catch {
        // Ignore storage access errors
      }
    }
    return "";
  });

  // Restore saved model config
  const [config, setConfig] = useState<ModelConfig>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(`${storageKey}:config`);
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore storage access errors
      }
    }
    return defaultConfig;
  });

  const setSelectedModel = useCallback(
    (model: string) => {
      setSelectedModelState(model);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(`${storageKey}:selected`, model);
        } catch {
          // Ignore storage access errors
        }
      }
    },
    [storageKey]
  );

  const updateConfig = useCallback(
    (partial: Partial<ModelConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            window.localStorage.setItem(`${storageKey}:config`, JSON.stringify(next));
          } catch {
            // Ignore storage access errors
          }
        }
        return next;
      });
    },
    [storageKey]
  );

  const refreshModels = useCallback(async () => {
    setIsLoadingModels(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/models`, {
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) {
        throw new Error(`Failed to load models (HTTP ${response.status})`);
      }

      const data = (await response.json()) as { models?: OllamaModel[] };
      const list = data.models || [];
      setModels(list);

      // Auto-select first model if none currently selected or if previously selected model is not in list
      if (list.length > 0) {
        setSelectedModelState((current) => {
          const exists = list.some((m) => m.name === current);
          if (!current || !exists) {
            const first = list[0].name;
            if (typeof window !== "undefined" && window.localStorage) {
              try {
                window.localStorage.setItem(`${storageKey}:selected`, first);
              } catch {
                // Ignore
              }
            }
            return first;
          }
          return current;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiUrl, storageKey]);

  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  return {
    models,
    selectedModel,
    setSelectedModel,
    config,
    updateConfig,
    isLoadingModels,
    refreshModels,
    error,
  };
}
