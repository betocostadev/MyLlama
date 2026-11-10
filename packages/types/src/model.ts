export interface OllamaModelDetails {
  parent_model?: string;
  format?: string;
  family?: string;
  families?: string[] | null;
  parameter_size?: string;
  quantization_level?: string;
  runner?: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details?: OllamaModelDetails;
  modified_at?: string;
}

export interface ModelConfig {
  temperature?: number;
  topP?: number;
  systemPrompt?: string;
  maxTokens?: number;
}

export interface SelectedModelSettings {
  model: string;
  config: ModelConfig;
}
