/**
 * Weaviate Embedded Client Wrapper for Clawdbot Memory System
 *
 * ⚠️ CRITICAL IMPLEMENTATION NOTES:
 *
 * ## Current State (2026-01)
 * 
 * This implementation faces a significant challenge with Weaviate's TypeScript ecosystem:
 * 
 * ### The Embedded Client Problem:
 * 
 * 1. **weaviate-ts-embedded** (official embedded package)
 *    - Last published: June 2023 (2+ years old)
 *    - Uses ancient weaviate-ts-client v1.x
 *    - Modern client is v3.x (completely different API)
 *    - Status: Officially deprecated/unmaintained
 * 
 * 2. **weaviate-client v3.x** (modern client)
 *    - Well-maintained, feature-rich
 *    - NO embedded support
 *    - Requires external Weaviate server
 *    - Documentation explicitly states: "Embedded Weaviate is not supported in the v3 client"
 * 
 * 3. **Python client v4**
 *    - Full embedded support via connect_to_embedded()
 *    - Downloads binaries automatically
 *    - Works seamlessly on Linux/macOS
 * 
 * ### Strategic Options:
 * 
 * **Option A: Use Legacy weaviate-ts-embedded (CURRENT CHOICE)**
 * - ✅ Truly embedded (no external server)
 * - ✅ Downloads/manages Weaviate binary automatically
 * - ❌ Uses deprecated v1 client API
 * - ❌ May break with newer Weaviate server versions
 * - ❌ Limited features compared to v3
 * - ⚠️ Technical debt - will need migration eventually
 * 
 * **Option B: Subprocess + Modern Client**
 * - Start Weaviate binary as subprocess
 * - Connect with weaviate-client v3
 * - ✅ Modern API
 * - ❌ Complex lifecycle management
 * - ❌ Port conflicts, process cleanup issues
 * 
 * **Option C: Python Bridge**
 * - Use Python embedded client via subprocess/FFI
 * - ✅ Official embedded support
 * - ❌ Requires Python runtime
 * - ❌ Complex IPC
 * - ❌ Added dependency
 * 
 * **Option D: Fork & Update weaviate-ts-embedded**
 * - Fork the embedded client repo
 * - Update to use weaviate-client v3
 * - ✅ Best of both worlds
 * - ❌ Significant engineering effort
 * - ❌ Ongoing maintenance burden
 * - 💡 Could contribute back to Weaviate community
 * 
 * **Option E: Wait for Official Support**
 * - Weaviate team may add embedded support to v3 client
 * - ✅ Official, maintained solution
 * - ❌ No timeline, may never happen
 * - ❌ Blocks this project indefinitely
 * 
 * ### Recommendation:
 * 
 * **Short-term (Wave 1 - NOW):**
 * - Use weaviate-ts-embedded v1.2.0 despite deprecation
 * - Wrap it cleanly behind IVectorStorage interface
 * - Document limitations and tech debt
 * - Mark as "experimental" in docs
 * 
 * **Medium-term (3-6 months):**
 * - Monitor for Weaviate v3 embedded support
 * - Consider forking weaviate-ts-embedded if critical
 * - Evaluate subprocess approach if stability issues arise
 * 
 * **Long-term (6-12 months):**
 * - If no official solution: fork and modernize
 * - Contribute back to Weaviate project
 * - Or switch to alternative embedded vector DB (e.g., Qdrant, Chroma)
 * 
 * ### Migration Path (if needed):
 * 
 * Because we're using the IVectorStorage interface abstraction, switching
 * implementations is straightforward:
 * 
 * 1. Implement new client in new file (e.g., weaviate-client-v3.ts)
 * 2. Implement IVectorStorage interface
 * 3. Add data migration utility (if schema differs)
 * 4. Switch factory function in manager.ts
 * 5. Run migration script on user data
 * 
 * ### Why This Approach Works:
 * 
 * - ✅ Unblocks Wave 1 implementation
 * - ✅ Better than sqlite-vec (richer features, better performance)
 * - ✅ Interface abstraction protects against future changes
 * - ✅ Documents technical debt clearly
 * - ✅ Provides clear migration path
 * 
 * ---
 * 
 * ## Implementation Details
 * 
 * This module provides a concrete implementation of the IVectorStorage interface
 * using Weaviate Embedded via the legacy weaviate-ts-embedded package.
 */

import type weaviateEmbedded from "weaviate-ts-embedded";
import type {
  IVectorStorage,
  VectorStorageConfig,
  VectorEmbedding,
  VectorSearchParams,
  VectorSearchResult,
  VectorSearchFilters,
  VectorStorageStats,
} from "./types.js";

// Type for the legacy embedded client
type EmbeddedClient = any; // weaviate-ts-embedded uses old v1 types

/**
 * Configuration for Weaviate Embedded client
 */
export interface WeaviateEmbeddedConfig extends VectorStorageConfig {
  /** Port for embedded Weaviate instance (default: 6666) */
  port?: number;
  /** Weaviate version to use (default: "latest") */
  version?: string;
  /** Additional environment variables for Weaviate */
  env?: Record<string, string | number>;
  /** Path to store Weaviate binary (optional) */
  binaryPath?: string;
}

/**
 * Weaviate Embedded vector storage implementation
 * 
 * Uses legacy weaviate-ts-embedded package (v1 API)
 * See file header for detailed notes on technical debt and migration strategy
 */
export class WeaviateEmbeddedStorage implements IVectorStorage {
  private client: EmbeddedClient | null = null;
  private config: WeaviateEmbeddedConfig | null = null;
  private className = "MemoryChunk";
  private initialized = false;

  /**
   * Initialize the Weaviate Embedded instance
   */
  async initialize(config: VectorStorageConfig): Promise<void> {
    const weaviateConfig = config as WeaviateEmbeddedConfig;
    this.config = weaviateConfig;

    // Dynamic import to avoid bundling if not used
    const weaviate = await import("weaviate-ts-embedded");

    // Configure embedded options
    const embeddedOptions = new weaviate.EmbeddedOptions({
      port: weaviateConfig.port ?? 6666,
      version: weaviateConfig.version ?? "latest",
      env: {
        LOG_LEVEL: "error", // Reduce verbosity
        PERSISTENCE_DATA_PATH: weaviateConfig.dataPath ?? "~/.clawdbot/weaviate/data",
        QUERY_DEFAULTS_LIMIT: 100,
        DEFAULT_VECTORIZER_MODULE: "none", // We provide our own vectors
        ...weaviateConfig.env,
      },
      binaryPath: weaviateConfig.binaryPath,
    });

    // Create client with connection params
    this.client = weaviate.default.client(embeddedOptions, {
      scheme: "http",
      host: `127.0.0.1:${weaviateConfig.port ?? 6666}`,
    });

    // Start the embedded instance
    await this.client.embedded.start();

    // Create schema if needed
    await this.ensureSchema(weaviateConfig.embeddingDimension);
    
    this.initialized = true;
  }

  /**
   * Ensure the schema exists with the correct configuration
   */
  private async ensureSchema(dimensions: number): Promise<void> {
    if (!this.client) {
      throw new Error("Weaviate client not initialized");
    }

    // Check if class already exists
    const schema = await this.client.schema.getter().do();
    const classExists = schema.classes?.some((c: any) => c.class === this.className);

    if (!classExists) {
      // Create class schema
      await this.client.schema
        .classCreator()
        .withClass({
          class: this.className,
          description: "Memory chunks with embeddings",
          vectorizer: "none", // We provide pre-computed vectors
          properties: [
            {
              name: "chunkId",
              dataType: ["string"],
              description: "Unique identifier for the chunk",
            },
            {
              name: "path",
              dataType: ["string"],
              description: "File path",
            },
            {
              name: "source",
              dataType: ["string"],
              description: "Content source (memory, workspace, etc.)",
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
              dataType: ["string"],
              description: "Content hash for deduplication",
            },
            {
              name: "model",
              dataType: ["string"],
              description: "Model used to generate embedding",
            },
            {
              name: "text",
              dataType: ["text"],
              description: "Original text content",
            },
            {
              name: "updatedAt",
              dataType: ["number"],
              description: "Timestamp of last update",
            },
          ],
        })
        .do();
    }
  }

  /**
   * Insert a single embedding
   */
  async insert(embedding: VectorEmbedding): Promise<void> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    await this.client.data
      .creator()
      .withClassName(this.className)
      .withProperties({
        chunkId: embedding.id,
        path: embedding.metadata.path,
        source: embedding.metadata.source,
        startLine: embedding.metadata.startLine,
        endLine: embedding.metadata.endLine,
        hash: embedding.metadata.hash,
        model: embedding.metadata.model,
        text: embedding.metadata.text,
        updatedAt: embedding.updatedAt,
      })
      .withVector(embedding.vector)
      .do();
  }

  /**
   * Insert multiple embeddings in batch
   */
  async insertBatch(embeddings: VectorEmbedding[]): Promise<void> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    if (embeddings.length === 0) return;

    // Batch insert using v1 API
    let batcher = this.client.batch.objectsBatcher();

    for (const embedding of embeddings) {
      batcher = batcher.withObject({
        class: this.className,
        properties: {
          chunkId: embedding.id,
          path: embedding.metadata.path,
          source: embedding.metadata.source,
          startLine: embedding.metadata.startLine,
          endLine: embedding.metadata.endLine,
          hash: embedding.metadata.hash,
          model: embedding.metadata.model,
          text: embedding.metadata.text,
          updatedAt: embedding.updatedAt,
        },
        vector: embedding.vector,
      });
    }

    await batcher.do();
  }

  /**
   * Search for similar vectors
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    // Build query
    let query = this.client.graphql
      .get()
      .withClassName(this.className)
      .withNearVector({ vector: params.queryVector })
      .withLimit(params.limit)
      .withFields("chunkId path source startLine endLine hash model text updatedAt _additional { distance }");

    // Apply filters if specified
    if (params.filters) {
      const whereFilter = this.buildWhereFilter(params.filters);
      if (whereFilter) {
        query = query.withWhere(whereFilter);
      }
    }

    const result = await query.do();
    const objects = result.data?.Get?.[this.className] ?? [];

    return objects
      .map((obj: any) => {
        const distance = obj._additional?.distance ?? 1.0;
        const score = 1 - distance;

        // Apply minimum score filter
        if (params.minScore !== undefined && score < params.minScore) {
          return null;
        }

        return {
          embedding: {
            id: obj.chunkId,
            vector: [], // Not returned to save bandwidth
            metadata: {
              path: obj.path,
              source: obj.source,
              startLine: obj.startLine,
              endLine: obj.endLine,
              hash: obj.hash,
              model: obj.model,
              text: obj.text,
            },
            updatedAt: obj.updatedAt,
          },
          score,
          distance,
        };
      })
      .filter((result: VectorSearchResult | null): result is VectorSearchResult => result !== null);
  }

  /**
   * Build WHERE filter for GraphQL query
   */
  private buildWhereFilter(filters: VectorSearchFilters): any {
    const operands: any[] = [];

    if (filters.source) {
      operands.push({
        path: ["source"],
        operator: "Equal",
        valueString: filters.source,
      });
    }

    if (filters.model) {
      operands.push({
        path: ["model"],
        operator: "Equal",
        valueString: filters.model,
      });
    }

    if (filters.paths && filters.paths.length > 0) {
      if (filters.paths.length === 1) {
        operands.push({
          path: ["path"],
          operator: "Equal",
          valueString: filters.paths[0],
        });
      } else {
        // Multiple paths - use OR
        operands.push({
          operator: "Or",
          operands: filters.paths.map((path) => ({
            path: ["path"],
            operator: "Equal",
            valueString: path,
          })),
        });
      }
    }

    if (operands.length === 0) return undefined;
    if (operands.length === 1) return operands[0];

    return {
      operator: "And",
      operands,
    };
  }

  /**
   * Get an embedding by ID
   */
  async getById(id: string): Promise<VectorEmbedding | null> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    const result = await this.client.graphql
      .get()
      .withClassName(this.className)
      .withWhere({
        path: ["chunkId"],
        operator: "Equal",
        valueString: id,
      })
      .withFields("chunkId path source startLine endLine hash model text updatedAt")
      .withLimit(1)
      .do();

    const objects = result.data?.Get?.[this.className] ?? [];
    if (objects.length === 0) return null;

    const obj = objects[0];

    return {
      id: obj.chunkId,
      vector: [], // Would need separate query with vector field
      metadata: {
        path: obj.path,
        source: obj.source,
        startLine: obj.startLine,
        endLine: obj.endLine,
        hash: obj.hash,
        model: obj.model,
        text: obj.text,
      },
      updatedAt: obj.updatedAt,
    };
  }

  /**
   * Delete embeddings by IDs
   */
  async deleteByIds(ids: string[]): Promise<void> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    if (ids.length === 0) return;

    // Delete each by chunkId property
    for (const id of ids) {
      await this.client.batch
        .objectsBatchDeleter()
        .withClassName(this.className)
        .withWhere({
          path: ["chunkId"],
          operator: "Equal",
          valueString: id,
        })
        .do();
    }
  }

  /**
   * Delete all embeddings matching a filter
   */
  async deleteByFilter(filters: VectorSearchFilters): Promise<number> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    const whereFilter = this.buildWhereFilter(filters);
    if (!whereFilter) {
      throw new Error("Cannot delete without filters");
    }

    // First, count how many will be deleted
    const countResult = await this.client.graphql
      .aggregate()
      .withClassName(this.className)
      .withWhere(whereFilter)
      .withFields("meta { count }")
      .do();

    const count = countResult.data?.Aggregate?.[this.className]?.[0]?.meta?.count ?? 0;

    // Delete matching objects
    await this.client.batch
      .objectsBatchDeleter()
      .withClassName(this.className)
      .withWhere(whereFilter)
      .do();

    return count;
  }

  /**
   * Get statistics about the vector storage
   */
  async getStats(): Promise<VectorStorageStats> {
    if (!this.client || !this.initialized) {
      throw new Error("Weaviate client not initialized");
    }

    // Get total count
    const countResult = await this.client.graphql
      .aggregate()
      .withClassName(this.className)
      .withFields("meta { count }")
      .do();

    const totalEmbeddings = countResult.data?.Aggregate?.[this.className]?.[0]?.meta?.count ?? 0;

    // Get unique sources (this is expensive, consider caching)
    const sourcesResult = await this.client.graphql
      .aggregate()
      .withClassName(this.className)
      .withFields("groupedBy { value } meta { count }")
      .withGroupBy("source")
      .do();

    const uniqueSources = sourcesResult.data?.Aggregate?.[this.className]?.length ?? 0;

    return {
      totalEmbeddings,
      uniqueSources,
      details: {
        className: this.className,
        implementation: "weaviate-ts-embedded v1.2.0 (legacy)",
        warning: "Using deprecated embedded client - see weaviate-client.ts header for migration strategy",
      },
    };
  }

  /**
   * Close the Weaviate Embedded instance
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.embedded.stop();
      this.client = null;
      this.initialized = false;
    }
  }
}

/**
 * Factory function to create a Weaviate Embedded storage instance
 */
export async function createWeaviateEmbeddedStorage(
  config: VectorStorageConfig,
): Promise<IVectorStorage> {
  const storage = new WeaviateEmbeddedStorage();
  await storage.initialize(config);
  return storage;
}

