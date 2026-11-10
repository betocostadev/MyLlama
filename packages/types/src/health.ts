export type ServiceConnectivity = "connected" | "disconnected";
export type BackendConnectivity = "checking" | "online" | "offline";
export type SystemReadiness = "ready" | "degraded" | "unknown";

export interface DatabaseHealth {
  status: ServiceConnectivity;
  message: string;
}

export interface OllamaHealth {
  status: ServiceConnectivity;
  version?: string;
  modelsCount?: number;
  models?: string[];
  message: string;
}

export interface HealthResponse {
  status: SystemReadiness;
  timestamp: string;
  services: {
    database: DatabaseHealth;
    ollama: OllamaHealth;
  };
}
