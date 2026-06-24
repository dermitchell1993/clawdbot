# Weaviate Migration Guide

## Overview

This guide explains the migration from sqlite-vec to Weaviate embedded for vector storage in Clawdbot's memory system.

## For Users

### Fresh Installations

If you're installing Clawdbot after this migration is complete, **no action is required**. Weaviate embedded will be configured automatically.

### Existing Installations

**Current Status:** No live sqlite-vec deployments exist yet, so no data migration is needed.

If you have an existing Clawdbot installation with sqlite-vec data, see [PRI-730](https://linear.app/prince-josh/issue/PRI-730) for data migration tools.

## What Changed

### Before (sqlite-vec)
- Vector storage via SQLite extension
- Requires native binary compilation
- Limited to SQLite's capabilities

### After (Weaviate Embedded)
- Vector storage via embedded Weaviate instance
- Production-ready vector database
- Advanced features (hybrid search, rich filtering)
- Better performance for large datasets

## Technical Details

### Dependencies

**Removed:**
- `sqlite-vec` npm package

**Added:**
- `weaviate-ts-embedded` npm package

### File Changes

**New Files:**
- `src/memory/types.ts` - Vector storage interfaces
- `src/memory/weaviate-client.ts` - Weaviate implementation
- `docs/architecture/vector-storage.md` - Architecture docs

**Modified Files:**
- `src/memory/manager.ts` - Uses new interface
- `src/memory/manager-search.ts` - Weaviate search
- `package.json` - Updated dependencies

**Removed Files:**
- `src/memory/sqlite-vec.ts` - No longer needed

## Related Documentation

- [Vector Storage Architecture](/docs/architecture/vector-storage)
- [Memory System Overview](/docs/memory)
