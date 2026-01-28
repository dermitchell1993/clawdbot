/**
 * Tests for Weaviate Embedded Client Wrapper
 * 
 * These tests verify the IVectorStorage interface implementation
 * using the legacy weaviate-ts-embedded package.
 * 
 * Note: Tests are marked as skip by default since they require:
 * 1. Download of Weaviate binary (~100MB)
 * 2. Running embedded Weaviate instance
 * 3. Network access for binary download
 * 
 * Run with: WEAVIATE_TEST=1 pnpm test weaviate-client.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WeaviateEmbeddedStorage } from "./weaviate-client.js";
import type { VectorStorageConfig, VectorEmbedding } from "./types.js";

const SKIP_TESTS = !process.env.WEAVIATE_TEST;

describe.skipIf(SKIP_TESTS)("WeaviateEmbeddedStorage", () => {
  let storage: WeaviateEmbeddedStorage;
  
  const testConfig: VectorStorageConfig = {
    embeddingDimension: 384, // Small dimension for testing
    dataPath: "/tmp/clawdbot-test-weaviate",
  };

  beforeAll(async () => {
    storage = new WeaviateEmbeddedStorage();
    await storage.initialize(testConfig);
  });

  afterAll(async () => {
    if (storage) {
      await storage.close();
    }
  });

  it("should initialize successfully", () => {
    expect(storage).toBeDefined();
  });

  it("should insert a single embedding", async () => {
    const embedding: VectorEmbedding = {
      id: "test-1",
      vector: Array(384).fill(0.1),
      metadata: {
        path: "/test/file.ts",
        source: "test",
        startLine: 1,
        endLine: 10,
        hash: "hash-1",
        model: "test-model",
        text: "Test content",
      },
      updatedAt: Date.now(),
    };

    await expect(storage.insert(embedding)).resolves.not.toThrow();
  });

  it("should insert batch embeddings", async () => {
    const embeddings: VectorEmbedding[] = [
      {
        id: "test-2",
        vector: Array(384).fill(0.2),
        metadata: {
          path: "/test/file2.ts",
          source: "test",
          startLine: 1,
          endLine: 10,
          hash: "hash-2",
          model: "test-model",
          text: "Test content 2",
        },
        updatedAt: Date.now(),
      },
      {
        id: "test-3",
        vector: Array(384).fill(0.3),
        metadata: {
          path: "/test/file3.ts",
          source: "test",
          startLine: 1,
          endLine: 10,
          hash: "hash-3",
          model: "test-model",
          text: "Test content 3",
        },
        updatedAt: Date.now(),
      },
    ];

    await expect(storage.insertBatch(embeddings)).resolves.not.toThrow();
  });

  it("should search for similar vectors", async () => {
    const queryVector = Array(384).fill(0.2);
    
    const results = await storage.search({
      queryVector,
      limit: 10,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it("should get embedding by ID", async () => {
    const embedding = await storage.getById("test-1");
    
    expect(embedding).toBeDefined();
    expect(embedding?.id).toBe("test-1");
    expect(embedding?.metadata.path).toBe("/test/file.ts");
  });

  it("should return null for non-existent ID", async () => {
    const embedding = await storage.getById("non-existent");
    expect(embedding).toBeNull();
  });

  it("should delete embeddings by IDs", async () => {
    await expect(storage.deleteByIds(["test-1"])).resolves.not.toThrow();
    
    const embedding = await storage.getById("test-1");
    expect(embedding).toBeNull();
  });

  it("should get storage statistics", async () => {
    const stats = await storage.getStats();
    
    expect(stats).toBeDefined();
    expect(typeof stats.totalEmbeddings).toBe("number");
    expect(typeof stats.uniqueSources).toBe("number");
    expect(stats.details).toBeDefined();
  });

  it("should filter by source", async () => {
    const queryVector = Array(384).fill(0.2);
    
    const results = await storage.search({
      queryVector,
      limit: 10,
      filters: {
        source: "test",
      },
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    // All results should have source "test"
    results.forEach((result) => {
      expect(result.embedding.metadata.source).toBe("test");
    });
  });
});

describe("WeaviateEmbeddedStorage - Unit Tests", () => {
  it("should throw error when not initialized", async () => {
    const storage = new WeaviateEmbeddedStorage();
    
    await expect(storage.insert({
      id: "test",
      vector: [],
      metadata: {
        path: "/test",
        source: "test",
        startLine: 1,
        endLine: 1,
        hash: "hash",
        model: "model",
        text: "text",
      },
      updatedAt: Date.now(),
    })).rejects.toThrow("Weaviate client not initialized");
  });

  it("should handle empty batch insert", async () => {
    const storage = new WeaviateEmbeddedStorage();
    await storage.initialize({
      embeddingDimension: 384,
      dataPath: "/tmp/test",
    });

    // Should not throw
    await expect(storage.insertBatch([])).resolves.not.toThrow();
    
    await storage.close();
  });
});

