import { Type } from "@sinclair/typebox";
import { homedir } from "node:os";
import { join } from "node:path";

export type MemoryConfig = {
  embedding: {
    provider: "openai" | "ollama";
    model?: string;
    apiKey?: string;
    baseUrl?: string;
  };
  dbPath?: string;
  autoCapture?: boolean;
  autoRecall?: boolean;
};

export const MEMORY_CATEGORIES = ["preference", "fact", "decision", "entity", "other"] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_DB_PATH = join(homedir(), ".clawdbot", "memory", "lancedb");

const EMBEDDING_DIMENSIONS: Record<string, number> = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
  "all-minilm:33m-l12-v2-fp16": 384, // Added for Ollama model
  // Add more as needed
};

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: string[],
  label: string,
) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length === 0) return;
  throw new Error(`${label} has unknown keys: ${unknown.join(", ")}`);
}

export function vectorDimsForModel(model: string): number {
  const dims = EMBEDDING_DIMENSIONS[model];
  if (!dims) {
    throw new Error(`Unsupported embedding model: ${model}`);
  }
  return dims;
}

function resolveEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}

function resolveEmbeddingModel(embedding: Record<string, unknown>): string {
  const model = typeof embedding.model === "string" ? embedding.model : DEFAULT_MODEL;
  vectorDimsForModel(model);
  return model;
}

export const memoryConfigSchema = {
  parse(value: unknown): MemoryConfig {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("memory config required");
    }
    const cfg = value as Record<string, unknown>;
    assertAllowedKeys(cfg, ["embedding", "dbPath", "autoCapture", "autoRecall"], "memory config");

    const embedding = cfg.embedding as Record<string, unknown> | undefined;
    if (!embedding) {
      throw new Error("embedding config is required");
    }
    assertAllowedKeys(embedding, ["provider", "model", "apiKey", "baseUrl"], "embedding config");

    const provider = typeof embedding.provider === "string" ? embedding.provider : "openai";
    if (provider !== "openai" && provider !== "ollama") {
      throw new Error("Invalid provider: must be 'openai' or 'ollama'");
    }

    const model = resolveEmbeddingModel(embedding);

    let apiKey: string | undefined;
    if (embedding.apiKey) {
      if (typeof embedding.apiKey !== "string") {
        throw new Error("embedding.apiKey must be a string");
      }
      apiKey = resolveEnvVars(embedding.apiKey);
    }

    let baseUrl: string | undefined;
    if (embedding.baseUrl) {
      if (typeof embedding.baseUrl !== "string") {
        throw new Error("embedding.baseUrl must be a string");
      }
      baseUrl = embedding.baseUrl;
    }

    if (provider === "ollama") {
      if (!baseUrl) {
        throw new Error("baseUrl is required for ollama provider");
      }
      // apiKey is optional for ollama
    } else { // openai
      if (!apiKey) {
        throw new Error("apiKey is required for openai provider");
      }
    }

    return {
      embedding: {
        provider,
        model,
        apiKey,
        baseUrl,
      },
      dbPath: typeof cfg.dbPath === "string" ? cfg.dbPath : DEFAULT_DB_PATH,
      autoCapture: cfg.autoCapture !== false,
      autoRecall: cfg.autoRecall !== false,
    };
  },
  uiHints: {
    "embedding.provider": {
      label: "Embedding Provider",
      placeholder: "openai",
      help: "Provider for embeddings: 'openai' or 'ollama'"
    },
    "embedding.model": {
      label: "Embedding Model",
      placeholder: DEFAULT_MODEL,
      help: "Embedding model to use"
    },
    "embedding.apiKey": {
      label: "API Key",
      sensitive: true,
      placeholder: "sk-proj-... or ollama",
      help: "API key for the provider (optional for local ollama)"
    },
    "embedding.baseUrl": {
      label: "Base URL",
      placeholder: "http://127.0.0.1:11434/v1",
      help: "Base URL for ollama (required for ollama provider)"
    },
    dbPath: {
      label: "Database Path",
      placeholder: "~/.clawdbot/memory/lancedb",
      advanced: true,
    },
    autoCapture: {
      label: "Auto-Capture",
      help: "Automatically capture important information from conversations",
    },
    autoRecall: {
      label: "Auto-Recall",
      help: "Automatically inject relevant memories into context",
    },
  },
};

