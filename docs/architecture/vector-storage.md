# Vector Storage Architecture

## Overview

Clawdbot's memory system uses vector embeddings to enable semantic search over conversation history, workspace files, and other content. This document describes the architecture for pluggable vector storage backends.

## Design Goals

1. **Pluggable Implementation** - Support multiple vector storage backends (Weaviate, sqlite-vec, etc.)
2. **Zero File Conflicts** - Clean separation between storage layer and business logic
3. **Embedded-First** - Prefer embedded solutions over external servers
4. **Performance** - Fast similarity search (<100ms for typical queries)
5. **Reliability** - Data integrity and proper error handling

## Architecture

### Layered Design

```
┌─────────────────────────────────────┐
│    Memory Manager (manager.ts)      │
│  - Business logic                   │
│  - Chunking, caching                │
│  - Coordination                     │
└──────────────┬──────────────────────┘
               │
               │ Uses IVectorStorage interface
               ↓
┌─────────────────────────────────────┐
│   Vector Storage Implementation     │
│  - Weaviate Client (weaviate-client.ts)  │
│  - OR sqlite-vec wrapper            │
│  - OR other implementations         │
└─────────────────────────────────────┘
```

### Interface Definition

All vector storage implementations must conform to the `IVectorStorage` interface defined in `src/memory/types.ts`.

## Weaviate Embedded Implementation

### Why Weaviate Embedded?

- **No External Server** - Embedded instance runs in-process
- **Production-Ready** - Battle-tested vector database
- **Rich Features** - Advanced filtering, hybrid search
- **TypeScript Support** - Official TypeScript client
- **HNSW Indexing** - Fast approximate nearest neighbor search

## Related Issues

- [PRI-719](https://linear.app/prince-josh/issue/PRI-719) - Parent issue
- [PRI-720](https://linear.app/prince-josh/issue/PRI-720) - This architecture work
- [PRI-721](https://linear.app/prince-josh/issue/PRI-721) - Weaviate client implementation
