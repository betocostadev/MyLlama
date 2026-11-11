import { useState, useEffect, useCallback } from "react";
import type {
  HealthResponse,
  BackendConnectivity,
} from "@myllama/types";
import { useApiUrl } from "@myllama/hooks";

export interface UseServiceHealthOptions {
  pollInterval?: number;
}

export interface UseServiceHealthReturn {
  backendStatus: BackendConnectivity;
  healthData: HealthResponse | null;
  latency: number | null;
  lastChecked: Date | null;
  isRefreshing: boolean;
  isBackendReady: boolean;
  isPostgresReady: boolean;
  isOllamaReady: boolean;
  checkHealth: () => Promise<void>;
}

export function useServiceHealth({
  pollInterval = 8000,
}: UseServiceHealthOptions): UseServiceHealthReturn {
  const [backendStatus, setBackendStatus] = useState<BackendConnectivity>("checking");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const apiUrl = useApiUrl();

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = performance.now();

    try {
      // 1. Basic server probe
      const baseRes = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!baseRes.ok) {
        throw new Error(`Server returned HTTP ${baseRes.status}`);
      }

      setBackendStatus("online");
      setLatency(Math.round(performance.now() - startTime));

      // 2. Full readiness inspection
      const readyRes = await fetch(`${apiUrl}/health/ready`, {
        signal: AbortSignal.timeout(4000),
      });
      const readyJson = (await readyRes.json()) as HealthResponse;
      setHealthData(readyJson);
    } catch {
      setBackendStatus("offline");
      setLatency(null);
      setHealthData(null);
    } finally {
      setIsRefreshing(false);
      setLastChecked(new Date());
    }
  }, [apiUrl]);

  useEffect(() => {
    checkHealth();
    if (pollInterval > 0) {
      const interval = setInterval(checkHealth, pollInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, pollInterval]);

  const isBackendReady = backendStatus === "online";
  const isPostgresReady = healthData?.services?.database?.status === "connected";
  const isOllamaReady = healthData?.services?.ollama?.status === "connected";

  return {
    backendStatus,
    healthData,
    latency,
    lastChecked,
    isRefreshing,
    isBackendReady,
    isPostgresReady,
    isOllamaReady,
    checkHealth,
  };
}
