/**
 * Weaviate Schema Definitions for Clawdbot Memory System
 *
 * This module defines the Weaviate collection schemas for vector storage,
 * replacing the previous SQLite-based implementation.
 */

/**
 * Weaviate collection schema for memory chunks with embeddings
 */
export interface WeaviateMemoryChunkSchema {
  class: "MemoryChunk";
  description: "Memory chunks with vector embeddings for semantic search";
  vectorizer: "none"; // We provide our own embeddings
  properties: [
    {
      name: "chunkId";
      dataType: ["text"];
      description: "Unique identifier for the chunk";
      indexSearchable: true;
    },
    {
      name: "path";
      dataType: ["text"];
      description: "Source file path";
      indexSearchable: true;
      indexFilterable: true;
    },
    {
      name: "source";
      dataType: ["text"];
      description: "Content source (memory, workspace, etc.)";
      indexFilterable: true;
    },
    {
      name: "startLine";
      dataType: ["int"];
      description: "Start line in source file";
    },
    {
      name: "endLine";
      dataType: ["int"];
      description: "End line in source file";
    },
    {
      name: "hash";
      dataType: ["text"];
      description: "Content hash for deduplication";
      indexFilterable: true;
    },
    {
      name: "model";
      dataType: ["text"];
      description: "Model used to generate embedding";
      indexFilterable: true;
    },
    {
      name: "text";
      dataType: ["text"];
      description: "Original text content";
      indexSearchable: true;
    },
    {
      name: "updatedAt";
      dataType: ["int"];
      description: "Timestamp when this was created/updated";
    },
  ];
  vectorIndexConfig: {
    distance: "cosine";
  };
}

/**
 * Weaviate collection schema for embedding cache
 */
export interface WeaviateEmbeddingCacheSchema {
  class: "EmbeddingCache";
  description: "Cache for generated embeddings to avoid recomputation";
  vectorizer: "none";
  properties: [
    {
      name: "provider";
      dataType: ["text"];
      description: "Embedding provider (openai, gemini, etc.)";
      indexFilterable: true;
    },
    {
      name: "model";
      dataType: ["text"];
      description: "Embedding model name";
      indexFilterable: true;
    },
    {
      name: "providerKey";
      dataType: ["text"];
      description: "Provider-specific key";
      indexFilterable: true;
    },
    {
      name: "hash";
      dataType: ["text"];
      description: "Content hash";
      indexFilterable: true;
    },
    {
      name: "dims";
      dataType: ["int"];
      description: "Embedding dimension count";
    },
    {
      name: "updatedAt";
      dataType: ["int"];
      description: "Timestamp when this was created/updated";
    },
  ];
  vectorIndexConfig: {
    distance: "cosine";
  };
}

/**
 * Weaviate collection schema for file metadata
 */
export interface WeaviateFileMetadataSchema {
  class: "FileMetadata";
  description: "Metadata for tracked memory files";
  vectorizer: "none";
  properties: [
    {
      name: "path";
      dataType: ["text"];
      description: "File path";
      indexSearchable: true;
      indexFilterable: true;
    },
    {
      name: "source";
      dataType: ["text"];
      description: "Content source";
      indexFilterable: true;
    },
    {
      name: "hash";
      dataType: ["text"];
      description: "File content hash";
    },
    {
      name: "mtime";
      dataType: ["int"];
      description: "Last modified timestamp";
    },
    {
      name: "size";
      dataType: ["int"];
      description: "File size in bytes";
    },
  ];
}

/**
 * Get the Weaviate collection schema for memory chunks
 */
export function getMemoryChunkCollectionSchema(): WeaviateMemoryChunkSchema {
  return {
    class: "MemoryChunk",
    description: "Memory chunks with vector embeddings for semantic search",
    vectorizer: "none",
    properties: [
      {
        name: "chunkId",
        dataType: ["text"],
        description: "Unique identifier for the chunk",
        indexSearchable: true,
      },
      {
        name: "path",
        dataType: ["text"],
        description: "Source file path",
        indexSearchable: true,
        indexFilterable: true,
      },
      {
        name: "source",
        dataType: ["text"],
        description: "Content source (memory, workspace, etc.)",
        indexFilterable: true,
      },
      {
        name: "startLine",
        dataType: ["int"],
        description: "Start line in source file",
      },
      {
        name: "endLine",
        dataType: ["int"],
        description: "End line in source file",
      },
      {
        name: "hash",
        dataType: ["text"],
        description: "Content hash for deduplication",
        indexFilterable: true,
      },
      {
        name: "model",
        dataType: ["text"],
        description: "Model used to generate embedding",
        indexFilterable: true,
      },
      {
        name: "text",
        dataType: ["text"],
        description: "Original text content",
        indexSearchable: true,
      },
      {
        name: "updatedAt",
        dataType: ["int"],
        description: "Timestamp when this was created/updated",
      },
    ],
    vectorIndexConfig: {
      distance: "cosine",
    },
  };
}

/**
 * Get the Weaviate collection schema for embedding cache
 */
export function getEmbeddingCacheCollectionSchema(): WeaviateEmbeddingCacheSchema {
  return {
    class: "EmbeddingCache",
    description: "Cache for generated embeddings to avoid recomputation",
    vectorizer: "none",
    properties: [
      {
        name: "provider",
        dataType: ["text"],
        description: "Embedding provider (openai, gemini, etc.)",
        indexFilterable: true,
      },
      {
        name: "model",
        dataType: ["text"],
        description: "Embedding model name",
        indexFilterable: true,
      },
      {
        name: "providerKey",
        dataType: ["text"],
        description: "Provider-specific key",
        indexFilterable: true,
      },
      {
        name: "hash",
        dataType: ["text"],
        description: "Content hash",
        indexFilterable: true,
      },
      {
        name: "dims",
        dataType: ["int"],
        description: "Embedding dimension count",
      },
      {
        name: "updatedAt",
        dataType: ["int"],
        description: "Timestamp when this was created/updated",
      },
    ],
    vectorIndexConfig: {
      distance: "cosine",
    },
  };
}

/**
 * Get the Weaviate collection schema for file metadata
 */
export function getFileMetadataCollectionSchema(): WeaviateFileMetadataSchema {
  return {
    class: "FileMetadata",
    description: "Metadata for tracked memory files",
    vectorizer: "none",
    properties: [
      {
        name: "path",
        dataType: ["text"],
        description: "File path",
        indexSearchable: true,
        indexFilterable: true,
      },
      {
        name: "source",
        dataType: ["text"],
        description: "Content source",
        indexFilterable: true,
      },
      {
        name: "hash",
        dataType: ["text"],
        description: "File content hash",
      },
      {
        name: "mtime",
        dataType: ["int"],
        description: "Last modified timestamp",
      },
      {
        name: "size",
        dataType: ["int"],
        description: "File size in bytes",
      },
    ],
  };
}

/**
 * Configuration for Weaviate memory schema initialization
 */
export interface WeaviateMemorySchemaConfig {
  /** Collection name for memory chunks (customizable) */
  memoryChunkCollection?: string;
  /** Collection name for embedding cache (customizable) */
  embeddingCacheCollection?: string;
  /** Collection name for file metadata (customizable) */
  fileMetadataCollection?: string;
  /** Whether to enable text search indexing */
  textSearchEnabled?: boolean;
}

/**
 * Result of schema initialization
 */
export interface WeaviateSchemaInitResult {
  /** Whether collections were created successfully */
  success: boolean;
  /** Any error messages */
  errors?: string[];
  /** Collections that were created */
  collectionsCreated: string[];
}

// ==========================================
// LEGACY SQLITE COMPATIBILITY (DEPRECATED)
// ==========================================
// These exports maintain backward compatibility with the old sqlite-vec implementation.
// They will be removed once the migration to Weaviate is complete (PRI-723, PRI-724).

import type { DatabaseSync } from "node:sqlite";

/**
 * @deprecated This function is for sqlite-vec compatibility only.
 * Use Weaviate schema functions instead. Will be removed in PRI-723.
 */
export function ensureMemoryIndexSchema(params: {
  db: DatabaseSync;
  embeddingCacheTable: string;
  ftsTable: string;
  ftsEnabled: boolean;
}): { ftsAvailable: boolean; ftsError?: string } {
  // Create legacy SQLite tables for backward compatibility
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'memory',
      hash TEXT NOT NULL,
      mtime INTEGER NOT NULL,
      size INTEGER NOT NULL
    );
  `);
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'memory',
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      hash TEXT NOT NULL,
      model TEXT NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  params.db.exec(`
    CREATE TABLE IF NOT EXISTS ${params.embeddingCacheTable} (
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      provider_key TEXT NOT NULL,
      hash TEXT NOT NULL,
      embedding TEXT NOT NULL,
      dims INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (provider, model, provider_key, hash)
    );
  `);
  params.db.exec(
    `CREATE INDEX IF NOT EXISTS idx_embedding_cache_updated_at ON ${params.embeddingCacheTable}(updated_at);`,
  );

  let ftsAvailable = false;
  let ftsError: string | undefined;
  if (params.ftsEnabled) {
    try {
      params.db.exec(
        `CREATE VIRTUAL TABLE IF NOT EXISTS ${params.ftsTable} USING fts5(\n` +
          `  text,\n` +
          `  id UNINDEXED,\n` +
          `  path UNINDEXED,\n` +
          `  source UNINDEXED,\n` +
          `  model UNINDEXED,\n` +
          `  start_line UNINDEXED,\n` +
          `  end_line UNINDEXED\n` +
          `);`,
      );
      ftsAvailable = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ftsAvailable = false;
      ftsError = message;
    }
  }

  ensureColumn(params.db, "files", "source", "TEXT NOT NULL DEFAULT 'memory'");
  ensureColumn(params.db, "chunks", "source", "TEXT NOT NULL DEFAULT 'memory'");
  params.db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);`);
  params.db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source);`);

  return { ftsAvailable, ...(ftsError ? { ftsError } : {}) };
}

/**
 * @deprecated Helper function for sqlite-vec compatibility.
 * Will be removed in PRI-723.
 */
function ensureColumn(
  db: DatabaseSync,
  table: "files" | "chunks",
  column: string,
  definition: string,
): void {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (rows.some((row) => row.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
