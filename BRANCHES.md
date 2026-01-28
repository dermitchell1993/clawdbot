# 🌿 Branching Strategy - Feature Branch Workflow (UPDATED)

**Last Updated:** 2026-01-28 02:23:00 UTC
**Repository:** dermitchell1993/clawdbot
**Methodology:** Single Feature Branch + Sequential-Parallel Waves

---

## 🎯 Feature Branch Strategy

**ALL work happens on a single feature branch:** `codegen-bot/embedded-weaviate-719`

### Key Principles

✅ **No main merges until complete** - Feature stays isolated
✅ **Wave branches PR to feature branch** - Not to main
✅ **Merges happen within feature branch** - Between waves
✅ **One final PR** - Feature branch → main (after all waves)

---

## 🌿 Branch Structure

```
main (production)
  ↓
  (branch from main)
  ↓
codegen-bot/embedded-weaviate-719 (FEATURE BRANCH)
  ↓
  ├── Wave 0 work (directly on feature branch)
  ├── Wave 1 branches (PR to feature branch)
  ├── Wave 2 branches (PR to feature branch)  
  └── Wave 3 branches (PR to feature branch)
  ↓
  (final PR after all waves complete)
  ↓
main (with complete feature)
```

---

## 🏗️ Wave 0: Foundation

### PRI-720: Architecture & Interfaces

**Special:** This wave CREATES the feature branch

1. `git checkout -b codegen-bot/embedded-weaviate-719` (from main)
2. Add architecture files (`src/memory/types.ts`, docs, [BRANCHES.md](<http://BRANCHES.md>))
3. `git push origin codegen-bot/embedded-weaviate-719`
4. **NO PR** - Feature branch is now established
5. All subsequent waves branch FROM this

---

## ⚡ Wave 1: Core Foundation (2 Parallel)

### PRI-721: Weaviate Client ⭐ CRITICAL PATH

* **Branch FROM:** `codegen-bot/embedded-weaviate-719`
* **Branch name:** `codegen-bot/weaviate-client-721`
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Files:** `src/memory/weaviate-client.ts` (new)
* **Blocks:** Wave 2 (PRI-723, PRI-724)

### PRI-722: Memory Schema

* **Branch FROM:** `codegen-bot/embedded-weaviate-719`
* **Branch name:** `codegen-bot/weaviate-schema-722`
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Files:** `src/memory/memory-schema.ts`
* **Parallel with:** PRI-721

**Merge Order:** PRI-721 first (unblocks Wave 2), then PRI-722

---

## 🔌 Wave 2: Integration Layer (2 Parallel)

⚠️ **GATE:** Wait for PRI-721 merged **to feature branch**

### PRI-723: Manager Integration

* **Branch FROM:** `codegen-bot/embedded-weaviate-719` (with PRI-721 merged)
* **Branch name:** `codegen-bot/weaviate-manager-723`
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Files:** `src/memory/manager.ts`

### PRI-724: Vector Search

* **Branch FROM:** `codegen-bot/embedded-weaviate-719` (with PRI-721 merged)
* **Branch name:** `codegen-bot/weaviate-search-724`
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Files:** `src/memory/manager-search.ts`

**Merge Order:** Any order (both parallel after gate)

---

## 🎨 Wave 3: Quality & Polish (3 Parallel)

⚠️ **GATE:** Wait for all Wave 2 merged **to feature branch**

### PRI-725, PRI-726, PRI-727

* **Branch FROM:** `codegen-bot/embedded-weaviate-719` (with all Wave 2 merged)
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Merge Order:** Any order (all parallel)

---

## 🔄 Edge Case (Optional)

### PRI-730: Data Migration

* **Branch FROM:** `codegen-bot/embedded-weaviate-719` (anytime)
* **PR Target:** `codegen-bot/embedded-weaviate-719`
* **Independent:** Does NOT block any wave

---

## 📊 Dependency Graph

```
main
  ↓
[Feature Branch Created] ← Wave 0
  ↓
┌─────┴─────┐
↓           ↓
[PRI-721] [PRI-722] ← Wave 1 (2 parallel)
  ↓           ↓
  └─────┬─────┘
        ↓ (merge to feature branch)
  ┌─────┴─────┐
  ↓           ↓
[PRI-723] [PRI-724] ← Wave 2 (2 parallel)
  ↓           ↓
  └─────┬─────┘
        ↓ (merge to feature branch)
  ┌─────┼─────┬─────┐
  ↓     ↓     ↓     ↓
[PRI-725][PRI-726][PRI-727] ← Wave 3 (3 parallel)
  ↓     ↓       ↓
  └─────┴───────┘
        ↓ (merge to feature branch)
[Complete Feature Branch]
        ↓
  (FINAL PR)
        ↓
      main

[PRI-730] ← Edge case (optional, independent)
```

---

## 🚦 Integration Workflow

### Phase 1: Foundation (Wave 0)

```bash
# Create feature branch from main
git checkout main
git pull
git checkout -b codegen-bot/embedded-weaviate-719
# Add architecture work
git add src/memory/types.ts docs/...
git commit -m "Wave 0: Define architecture & interfaces"
git push origin codegen-bot/embedded-weaviate-719
```

**Result:** Feature branch established ✅

---

### Phase 2: Wave 1 (2 Parallel PRs)

```bash
# Agent working on PRI-721
git checkout codegen-bot/embedded-weaviate-719
git pull
git checkout -b codegen-bot/weaviate-client-721
# Implement client
git add src/memory/weaviate-client.ts
git commit -m "Implement Weaviate client wrapper"
git push origin codegen-bot/weaviate-client-721
# Create PR: codegen-bot/weaviate-client-721 → codegen-bot/embedded-weaviate-719
```

**PR Target:** Feature branch (NOT main)
**Merge:** Merge PRI-721 first, then PRI-722

---

### Phase 3: Wave 2 (2 Parallel PRs, After Gate)

⚠️ **Wait for PRI-721 merged to feature branch**

```bash
# Agent working on PRI-723
git checkout codegen-bot/embedded-weaviate-719
git pull  # Now has PRI-721 merged
git checkout -b codegen-bot/weaviate-manager-723
# Implement manager (can now import & test Weaviate client!)
```

**PR Target:** Feature branch (NOT main)

---

### Phase 4: Wave 3 (3 Parallel PRs, After Gate)

⚠️ **Wait for all Wave 2 merged to feature branch**

Same pattern - branch from feature branch, PR back to feature branch.

---

### Phase 5: Final Integration

**After ALL waves complete:**

```bash
git checkout codegen-bot/embedded-weaviate-719
git pull
# Run comprehensive tests
pnpm lint && pnpm test && pnpm build
# Everything passes? Create final PR
# PR: codegen-bot/embedded-weaviate-719 → main
```

This is the **ONLY** PR to main for the entire project.

---

## 🤖 Agent Instructions

### Wave 0 Agent (PRI-720)

1. Create feature branch from main
2. Add architecture work directly to feature branch
3. Push feature branch (no PR needed)
4. Signal Wave 1 can begin

### Wave 1-3 Agents

1. **Checkout feature branch:** `git checkout codegen-bot/embedded-weaviate-719`
2. **Pull latest:** `git pull`
3. **Create your branch:** `git checkout -b codegen-bot/weaviate-{component}-{number}`
4. **Do your work**
5. **PR Target:** `codegen-bot/embedded-weaviate-719` (NOT main!)

### Wave 2/3 Agents (Important!)

* **Pull from feature branch** to get merged Wave 1/2 work
* You can now test against real implementations
* No "coding blind" scenarios ✅

---

## ✅ Quality Gates

**Every PR must:**

* Target the **feature branch** (not main)
* Pass all CI checks
* Pass linting & tests
* Be reviewed before merge

**Final PR to main:**

* ALL waves complete
* Full test suite passes
* Comprehensive review
* Ready for production

---

## 🎯 Success Criteria

### Feature Branch Complete When:

* ✅ All 8 wave tasks merged to feature branch
* ✅ sqlite-vec fully replaced
* ✅ All tests passing
* ✅ Documentation complete
* ✅ Feature branch ready for final PR

### Final PR Success:

* ✅ Single comprehensive PR to main
* ✅ Clean feature branch history
* ✅ Production-ready code
* ✅ No "big bang" surprises (tested throughout on feature branch)

---

## 📊 Orchestration Metrics

* **Total Waves:** 3 (plus Wave 0 foundation)
* **Total Branches:** 8 feature branches → feature branch (+ 1 optional)
* **PRs to Feature Branch:** 7-8 PRs
* **PRs to Main:** 1 final PR ⭐
* **Integration Model:** Feature branch isolation
* **Timeline:** 3-4 days, then final PR

---

## 🔄 Why This Works

### ✅ Benefits:

1. **Clean Isolation** - Feature never touches main until ready
2. **Testability** - Agents test against feature branch state
3. **Flexibility** - Can iterate on feature branch without affecting main
4. **Single Integration Point** - One final PR review, not 8+
5. **Rollback Friendly** - Just don't merge the final PR
6. **Clear Progress** - Feature branch shows complete state

### ❌ Avoided Problems:

1. No intermediate broken states in main
2. No "merge train" coordination issues
3. No partial features in production
4. No rollback complexity across multiple PRs

---

**📌 Note:** This document is the single source of truth. All agents reference the feature branch for their work, NOT main.
