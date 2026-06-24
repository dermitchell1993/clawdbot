# Branching Strategy - PRI-719: Embedded Weaviate Migration

**Repository:** dermitchell1993/clawdbot  
**Parent Issue:** [PRI-719](https://linear.app/prince-josh/issue/PRI-719)  
**Methodology:** Agent Orchestration Playbook  
**Base Branch:** `main`

---

## 📋 Overview

This document defines the branching and integration strategy for parallel agent orchestration. Each sub-issue creates its own feature branch and PR, enabling true parallel development with zero merge conflicts.

---

## 🌿 Branch Structure

### Parent Branch (Integration Target)
```
main (base)
  └── codegen-bot/embedded-weaviate-719
      └── Final integration PR → main
```

### Wave Branches (All branch from `main`)
Each wave's branches are independent and can be developed in parallel within their wave.

---

## 🏗️ Wave 0: Foundation (Sequential)

### PRI-720: Architecture & Interfaces
- **Branch:** `codegen-bot/weaviate-architecture-720`
- **Created from:** `main`
- **PR target:** `main`
- **Status:** Must complete before Wave 1
- **Files:**
  - `src/memory/types.ts` (new)
  - Architecture docs

**Why separate PR:** Establishes contracts for all Wave 1 agents. Must merge first to avoid blockers.

---

## ⚡ Wave 1: Core Foundation (2 Parallel Agents)

**Execution Order:** Both agents can work simultaneously after PRI-720 merges.

### PRI-721: Weaviate Client Wrapper
- **Branch:** `codegen-bot/weaviate-client-721`
- **Created from:** `main` (after PRI-720 merged)
- **PR target:** `main`
- **Dependencies:** PRI-720 (merged)
- **Files:**
  - `src/memory/weaviate-client.ts` (new)
  - `package.json` (add weaviate-ts-embedded)

**Conflict Check:** ✅ NONE - Creates new file

---

### PRI-722: Memory Schema Update
- **Branch:** `codegen-bot/weaviate-schema-722`
- **Created from:** `main` (after PRI-720 merged)
- **PR target:** `main`
- **Dependencies:** PRI-720 (merged)
- **Files:**
  - `src/memory/memory-schema.ts`

**Conflict Check:** ✅ NONE - Isolated to memory-schema.ts

---

## 🔌 Wave 2: Integration Layer (2 Parallel Agents)

**Execution Gate:** PRI-721 MUST merge before Wave 2 starts (agents need actual client to test)

### PRI-723: Manager Integration
- **Branch:** `codegen-bot/weaviate-manager-723`
- **Created from:** `main` (after PRI-721 merged)
- **PR target:** `main`
- **Dependencies:** PRI-720 (merged), PRI-721 (merged - needs client)
- **Files:**
  - `src/memory/manager.ts`

**Conflict Check:** ✅ NONE - Isolated to manager.ts

**Note:** Must wait for PRI-721 to merge so the Weaviate client exists for testing.

---

### PRI-724: Vector Search Implementation
- **Branch:** `codegen-bot/weaviate-search-724`
- **Created from:** `main` (after PRI-721 merged)
- **PR target:** `main`
- **Dependencies:** PRI-720 (merged), PRI-721 (merged - needs client)
- **Files:**
  - `src/memory/manager-search.ts`

**Conflict Check:** ✅ NONE - Isolated to manager-search.ts

**Note:** Must wait for PRI-721 to merge so the Weaviate client exists for testing.

---

## 🎨 Wave 3: Quality & Polish (3 Parallel Agents)

**Execution Order:** All 3 branches can be worked on simultaneously after Wave 2 PRs merge.

### PRI-725: Config & Dependency Cleanup
- **Branch:** `codegen-bot/weaviate-config-725`
- **Created from:** `main` (after Wave 2 merged)
- **PR target:** `main`
- **Dependencies:** All Wave 2 (PRI-723, 724 merged)
- **Files:**
  - `package.json` (remove sqlite-vec)
  - `src/config/schema.ts`
  - `src/config/types.tools.ts`
  - Delete `src/memory/sqlite-vec.ts`

**Conflict Check:** ⚠️ LOW - May touch package.json

---

### PRI-726: Test Migration
- **Branch:** `codegen-bot/weaviate-tests-726`
- **Created from:** `main` (after Wave 2 merged)
- **PR target:** `main`
- **Dependencies:** All Wave 2 (PRI-723, 724 merged)
- **Files:**
  - `src/agents/memory-search.test.ts`
  - `src/cli/memory-cli.test.ts`
  - Other test files

**Conflict Check:** ✅ NONE - Test files independent

---

### PRI-727: Documentation & Migration Guide
- **Branch:** `codegen-bot/weaviate-docs-727`
- **Created from:** `main` (after Wave 2 merged)
- **PR target:** `main`
- **Dependencies:** All Wave 2 (PRI-723, 724 merged)
- **Files:**
  - `docs/weaviate-migration.md` (new)
  - `docs/architecture/vector-storage.md` (update)
  - `README.md` (if applicable)

**Conflict Check:** ✅ NONE - Documentation independent

---

## 🔄 Edge Case (Optional - Not Blocking)

### PRI-730: Data Migration Script
- **Branch:** `codegen-bot/weaviate-migration-730`
- **Created from:** `main` (any time)
- **PR target:** `main`
- **Priority:** LOW
- **Status:** NOT NEEDED (no live data exists)
- **Files:**
  - `scripts/migrate-sqlite-to-weaviate.ts` (new)

**Only execute if sqlite-vec deployments with live data emerge.**

---

## 🔄 Integration Workflow

### Phase 1: Foundation
```
main
  └── PR #1: codegen-bot/weaviate-architecture-720 (PRI-720)
      └── Merge → main
```

**Gate:** Architecture review, interfaces approved

---

### Phase 2: Core Foundation (Parallel)
```
main (with PRI-720 merged)
  ├── PR #2: codegen-bot/weaviate-client-721 (PRI-721)
  └── PR #3: codegen-bot/weaviate-schema-722 (PRI-722)
```

**Merge Order:**
1. PRI-721 (client) - FIRST (unblocks Wave 2)
2. PRI-722 (schema) - Can merge in parallel

**Gate:** All tests pass, functionality verified

---

### Phase 3: Integration Layer (Sequential-Parallel)
```
main (with PRI-721 merged)
  ├── PR #4: codegen-bot/weaviate-manager-723 (PRI-723)
  └── PR #5: codegen-bot/weaviate-search-724 (PRI-724)
```

**Merge Order:** Both can merge in any order after PRI-721

**Gate:** Integration tests pass

---

### Phase 4: Quality & Polish (Parallel)
```
main (with Wave 2 merged)
  ├── PR #6: codegen-bot/weaviate-config-725 (PRI-725)
  ├── PR #7: codegen-bot/weaviate-tests-726 (PRI-726)
  └── PR #8: codegen-bot/weaviate-docs-727 (PRI-727)
```

**Merge Order:** Any order (all independent)

**Gate:** All tests pass, docs reviewed, ready for production

---

## 📊 Dependency Graph

```
        main
          ↓
      [PRI-720] ← Wave 0 (Foundation)
          ↓
    ┌─────┴─────┐
    ↓           ↓
[PRI-721]   [PRI-722]     ← Wave 1 (parallel)
  Client     Schema
    ↓           ↓
    └─────┬─────┘
          ↓
    ┌─────┴─────┐
    ↓           ↓
[PRI-723]   [PRI-724]     ← Wave 2 (parallel)
 Manager     Search
    ↓           ↓
    └─────┬─────┘
          ↓
    ┌─────┼─────┬─────┐
    ↓     ↓     ↓     ↓
[PRI-725][PRI-726][PRI-727]  ← Wave 3 (parallel)
 Config  Tests    Docs
    ↓     ↓     ↓
    └─────┴─────┘
          ↓
        main
```

---

## 🚦 PR Review & Merge Protocol

### Wave 0 (Sequential)
1. **PRI-720** opens PR → Review → Merge to `main`
2. Wave 1 agents can now start

### Wave 1 (Parallel with Priority)
1. **PRI-721** & **PRI-722** open PRs simultaneously
2. **PRI-721** merges first (high priority - unblocks Wave 2)
3. **PRI-722** merges after review
4. Wave 2 agents can now start

### Wave 2 (Parallel After Gate)
1. **PRI-723** & **PRI-724** open PRs after PRI-721 merged
2. Both can merge in any order
3. Wave 3 agents can now start

### Wave 3 (Full Parallel)
1. All 3 PRs open simultaneously after Wave 2 complete
2. Merge in any order (no dependencies)

---

## ✅ Quality Gates

### Every PR Must:
- ✅ Pass all CI checks
- ✅ Pass linting (`pnpm lint`)
- ✅ Pass tests (`pnpm test`)
- ✅ Build successfully (`pnpm build`)
- ✅ Have clear commit messages
- ✅ Update relevant documentation
- ✅ Include Linear issue reference in PR description

### Wave-Specific Gates:
- **Wave 0:** Architecture reviewed and approved
- **Wave 1:** Client wrapper functional, schema valid
- **Wave 2:** Integration tests pass with new components
- **Wave 3:** Full test suite passes, documentation complete

---

## 🎯 Success Criteria

### Individual PRs:
- Each PR is independently reviewable
- Each PR adds incremental value
- Each PR passes all quality gates

### Overall Migration:
- All 8 PRs merged to `main`
- sqlite-vec fully replaced with embedded Weaviate
- All tests passing
- Documentation complete
- Zero data loss (migration guide provided)

---

## 📝 Branch Naming Convention

**Format:** `codegen-bot/{feature-slug}-{issue-number}`

**Examples:**
- `codegen-bot/weaviate-architecture-720`
- `codegen-bot/weaviate-client-721`
- `codegen-bot/weaviate-schema-722`

**Why this format:**
- `codegen-bot/` prefix: Identifies AI-generated work
- `{feature-slug}`: Human-readable feature description
- `{issue-number}`: Direct link to Linear issue

---

## 🤖 Agent Instructions

### For Wave 0 Agent:
1. Create branch: `codegen-bot/weaviate-architecture-720`
2. Complete PRI-720 work
3. Open PR to `main`
4. Wait for review & merge
5. Signal Wave 1 agents to begin

### For Wave 1 Agents:
1. Wait for PRI-720 to merge
2. Pull latest `main`
3. Create your wave branch (721 or 722)
4. Complete your work
5. Open PR to `main`

### For Wave 2 Agents:
1. Wait for PRI-721 to merge (CRITICAL)
2. Pull latest `main`
3. Create your wave branch (723 or 724)
4. Complete your work
5. Open PR to `main`

### For Wave 3 Agents:
1. Wait for ALL Wave 2 PRs to merge
2. Pull latest `main`
3. Create your wave branch (725, 726, or 727)
4. Complete your work
5. Open PR to `main`

---

**Last Updated:** 2026-01-28 (v1.1)  
**Status:** Ready for execution  
**Total Branches:** 8 feature branches → main
**Wave Structure:** 0→1→2→3 (Sequential-Parallel)

---

## 📚 Version History

### v1.1 (2026-01-28)
- Refactored from 3 waves to 4 waves (0→1→2→3)
- Wave 1 reduced to 2 agents (721, 722)
- Wave 2 created with 2 agents (723, 724) - wait for 721 to merge
- Wave 3 remains 3 agents (725, 726, 727)
- Added execution gate: Wave 2 must wait for PRI-721
- Rationale: Agents need actual Weaviate client to test their code
- Result: More honest dependencies, testable increments

### v1.0 (2026-01-27)
- Initial branching strategy
- 8 modular sub-issues across 3 waves
- Pure parallel execution

---

📌 **Note:** This document serves as the single source of truth for branching strategy. All agents should reference this before starting their wave.

