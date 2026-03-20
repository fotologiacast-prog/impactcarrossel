# Constraint Text Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real measurement-based text fitting engine for `TITLE` and `PARAGRAPH` that improves line breaks using actual width and height constraints while preserving manual override mode.

**Architecture:** Build a shared canvas-based text measurer and a constraint fitting helper, then integrate that helper into the current block renderers instead of replacing the block architecture. Keep the editor sync path, but base it on fitted text output rather than raw browser wrapping.

**Tech Stack:** React, TypeScript, Vite, canvas text measurement, existing block renderers, existing zod schema/tests.

---

### Task 1: Add the measurement utility

**Files:**
- Create: `/Users/fotologiavanassi/Documents/Impact Carrossel /utils/text-measurer.ts`
- Test: `/Users/fotologiavanassi/Documents/Impact Carrossel /tests/text-measurer.test.ts`

**Step 1: Write the failing test**

Cover:
- width measurement returns a positive number
- line measurement wraps when width is constrained
- height measurement scales with line count

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/text-measurer.test.ts`
Expected: FAIL because the utility does not exist yet.

**Step 3: Write minimal implementation**

Implement:
- `measureWidth`
- `measureLines`
- `measureHeight`
- cache keyed by text and typography tuple

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/text-measurer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /utils/text-measurer.ts /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /tests/text-measurer.test.ts
git commit -m "feat: add canvas text measurement utility"
```

### Task 2: Add the constraint fitter

**Files:**
- Create: `/Users/fotologiavanassi/Documents/Impact Carrossel /utils/text-fit.ts`
- Test: `/Users/fotologiavanassi/Documents/Impact Carrossel /tests/text-fit.test.ts`
- Reference: `/Users/fotologiavanassi/Documents/Impact Carrossel /utils/text-layout.ts`

**Step 1: Write the failing test**

Cover:
- auto mode produces balanced title line breaks
- manual mode preserves explicit `\n`
- shrink mode reduces font size when height overflows
- result includes `formatted`, `lines`, `effectiveFontSize`, `wasShrunk`, `quality`

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/text-fit.test.ts`
Expected: FAIL because the fitter does not exist yet.

**Step 3: Write minimal implementation**

Implement:
- constraint type
- greedy wrap
- balanced wrap
- simple semantic scoring
- shrink handling
- manual passthrough

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/text-fit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /utils/text-fit.ts /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /tests/text-fit.test.ts
git commit -m "feat: add constraint-based text fitting"
```

### Task 3: Integrate fitter into `TITLE`

**Files:**
- Modify: `/Users/fotologiavanassi/Documents/Impact Carrossel /renderers/blocks/TitleRenderer.tsx`
- Modify: `/Users/fotologiavanassi/Documents/Impact Carrossel /renderers/renderBlock.tsx`
- Test: `/Users/fotologiavanassi/Documents/Impact Carrossel /tests/text-layout.test.ts`

**Step 1: Write the failing test**

Add a test that proves title auto mode now returns the fitter output instead of pure browser heuristic behavior.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/text-layout.test.ts`
Expected: FAIL on the new title-fit expectation.

**Step 3: Write minimal implementation**

Implement:
- real width constraint propagation
- title fitting through the new helper
- fallback if measurement is unavailable

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/text-layout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /renderers/blocks/TitleRenderer.tsx /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /renderers/renderBlock.tsx /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /tests/text-layout.test.ts
git commit -m "feat: fit title text to measured constraints"
```

### Task 4: Integrate fitter into `PARAGRAPH`

**Files:**
- Modify: `/Users/fotologiavanassi/Documents/Impact Carrossel /renderers/blocks/ParagraphRenderer.tsx`
- Modify: `/Users/fotologiavanassi/Documents/Impact Carrossel /renderers/renderBlock.tsx`
- Test: `/Users/fotologiavanassi/Documents/Impact Carrossel /tests/text-layout.test.ts`

**Step 1: Write the failing test**

Add a paragraph case that proves auto mode is less aggressive and uses measured fitting.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/text-layout.test.ts`
Expected: FAIL on the new paragraph-fit expectation.

**Step 3: Write minimal implementation**

Implement:
- paragraph fitting with different default scoring priorities from title
- preserve manual line breaks

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/text-layout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /renderers/blocks/ParagraphRenderer.tsx /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /renderers/renderBlock.tsx /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /tests/text-layout.test.ts
git commit -m "feat: fit paragraph text to measured constraints"
```

### Task 5: Update editor auto-sync

**Files:**
- Modify: `/Users/fotologiavanassi/Documents/Impact Carrossel /App.tsx`
- Test: `/Users/fotologiavanassi/Documents/Impact Carrossel /tests/text-layout.test.ts`

**Step 1: Write the failing test**

Add a test or assertion target for the rule:
- `manual` never gets overwritten
- `auto` can sync fitted line breaks back into the JSON content

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/text-layout.test.ts`
Expected: FAIL or missing behavior.

**Step 3: Write minimal implementation**

Replace the current `innerText`-driven sync with fitter-driven sync for `TITLE` and `PARAGRAPH`.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/text-layout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /App.tsx /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /tests/text-layout.test.ts
git commit -m "feat: sync fitted text breaks back to editor state"
```

### Task 6: Final verification and cleanup

**Files:**
- Modify only if needed from prior tasks

**Step 1: Run focused tests**

Run:
- `npx tsx tests/text-measurer.test.ts`
- `npx tsx tests/text-fit.test.ts`
- `npx tsx tests/text-layout.test.ts`
- `npx tsx tests/branding.test.ts`

Expected: PASS

**Step 2: Run production build**

Run: `npm run build`
Expected: PASS

**Step 3: Smoke check impacted templates**

Check:
- title-heavy slides
- paragraph-heavy slides
- `PNG_STAGE`
- `FADE`
- `SPLIT_EDITORIAL`

Expected:
- cleaner breaks
- manual mode preserved
- no layout regressions

**Step 4: Commit**

```bash
git add /Users/fotologiavanassi/Documents/Impact\ Carrossel\ /
git commit -m "feat: add constraint-based text fitting for title and paragraph"
```
