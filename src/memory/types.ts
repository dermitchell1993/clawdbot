/**
 * Vector Storage Interfaces for Clawdbot Memory System
 * 
 * This module defines the abstract interfaces for vector storage operations,
 * enabling pluggable implementations (Weaviate, sqlite-vec, etc.)
 */

/**
 * Configuration for vector storage initialization
 */
export interface VectorStorageConfig {
  /** Path to store vector data (for file-based implementations) */
  dataPath?: string;
  /** Embedding dimension size */
  embeddingDimension: number;
  /** Optional custom configuration */
  custom?: Record<string, unknown>;
}

/**
 * Represents a vector embedding with metadata
 */
export interface VectorEmbedding {
  /** Unique identifier for this embedding */
  id: string;
  /** The actual vector values */
  vector: number[];
  /** Metadata associated with the embedding */
  metadata: VectorMetadata;
  /** Timestamp when this was created/updated */
  updatedAt: number;
}

/**
 * Metadata for vector embeddings
 */
export interface VectorMetadata {
  /** Source file path */
  path: string;
  /** Content source (memory, workspace, etc.) */
  source: string;
  /** Start line in source file */
  startLine: number;
  /** End line in source file */
  endLine: number;
  /** Content hash for deduplication */
  hash: string;
  /** Model used to generate embedding */
  model: string;
  /** Original text content */
  text: string;
}

/**
 * Parameters for vector similarity search
 */
export interface VectorSearchParams {
  /** Query vector to search against */
  queryVector: number[];
  /** Maximum number of results to return */
  limit: number;
  /** Optional filters on metadata */
  filters?: VectorSearchFilters;
  /** Minimum similarity score (0-1) */
  minScore?: number;
}

/**
 * Filters for vector search
 */
export interface VectorSearchFilters {
  /** Filter by source (memory, workspace, etc.) */
  source?: string;
  /** Filter by file paths */
  paths?: string[];
  /** Filter by model used */
  model?: string;
  /** Custom metadata filters */
  metadata?: Record<string, unknown>;
}

/**
 * Result from vector similarity search
 */
export interface VectorSearchResult {
  /** The embedding that matched */
  embedding: VectorEmbedding;
  /** Similarity score (0-1, higher is more similar) */
  score: number;
  /** Distance metric (lower is more similar) */
  distance: number;
}

/**
 * Statistics about the vector storage
 */
export interface VectorStorageStats {
  /** Total number of embeddings stored */
  totalEmbeddings: number;
  /** Total size in bytes */
  sizeBytes?: number;
  /** Number of unique sources */
  uniqueSources: number;
  /** Implementation-specific details */
  details?: Record<string, unknown>;
}

/**
 * Abstract interface for vector storage implementations
 * 
 * This enables swapping between different vector storage backends
 * (Weaviate embedded, sqlite-vec, etc.) without changing the memory manager.
 */
export interface IVectorStorage {
  /**
   * Initialize the vector storage
   * Creates collections/tables, sets up indexes, etc.
   */
  initialize(config: VectorStorageConfig): Promise<void>;

  /**
   * Insert a single embedding
   */
  insert(embedding: VectorEmbedding): Promise<void>;

  /**
   * Insert multiple embeddings in batch
   */
  insertBatch(embeddings: VectorEmbedding[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  search(params: VectorSearchParams): Promise<VectorSearchResult[]>;

  /**
   * Get an embedding by ID
   */
  getById(id: string): Promise<VectorEmbedding | null>;

  /**
   * Delete embeddings by IDs
   */
  deleteByIds(ids: string[]): Promise<void>;

  /**
   * Delete all embeddings matching a filter
   */
  deleteByFilter(filters: VectorSearchFilters): Promise<number>;

  /**
   * Get statistics about the vector storage
   */
  getStats(): Promise<VectorStorageStats>;

  /**
   * Close/cleanup the storage connection
   */
  close(): Promise<void>;
}

/**
 * Factory function type for creating vector storage instances
 */
export type VectorStorageFactory = (config: VectorStorageConfig) => Promise<IVectorStorage>;

