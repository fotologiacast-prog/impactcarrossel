# Visual Effects System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a project-level FX inheritance system, improve profile/glass/cinematic readability controls, soften base white/black tokens, and introduce a directional fade template.

**Architecture:** Extend the carousel model with root-level `projectFX` defaults, then resolve final slide appearance from token defaults plus `brandTheme` plus `projectFX` plus slide overrides. Reuse that resolved appearance across `SlideCanvas`, template-specific treatments, and `USER` rendering so global controls behave consistently while manual slide edits still win.

**Tech Stack:** React 19, TypeScript, Zod, Express, Supabase, Vite

---

### Task 1: Add appearance types and schema

**Files:**
- Modify: `types.ts`
- Modify: `template-dsl/schema.ts`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test that parses a carousel with:

- root `projectFX`
- slide-level `postFX` override
- `USER` block `nameColor`
- a `FADE` template slide with fade-specific options

Expected result: the structure parses successfully and legacy carousels without these fields still pass.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because the new fields are missing from types/schema.

**Step 3: Write minimal implementation**

Add:

- `projectFX` to the carousel root
- `nameColor` to `Block.options`
- fade/readability fields to `SlideDefinition.options`
- `FADE` to the supported template names and image behavior

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 2: Build appearance resolver for global FX inheritance

**Files:**
- Modify: `utils/branding.ts`
- Modify: `types.ts`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test where:

- root `projectFX.vignette = 0.4`
- slide `postFX.vignette = 0.1`
- root `noiseAmount = 0.2`

Expected result: the resolved appearance keeps slide vignette override and inherits root noise.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because there is no resolver for `projectFX`.

**Step 3: Write minimal implementation**

Create a resolver in `utils/branding.ts` that merges:

- default soft white/black tokens
- `brandTheme`
- `projectFX`
- slide `options`

Return one normalized appearance object for renderers.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 3: Soften base white/black defaults and contrast behavior

**Files:**
- Modify: `utils/branding.ts`
- Modify: `renderers/SlideCanvas.tsx`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test that creates a theme without explicit `white`/`black`.

Expected result:

- light token resolves to the new softened white
- dark token resolves to the new softened black
- contrast helpers use those values as fallbacks

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because defaults still use pure white/black.

**Step 3: Write minimal implementation**

Update the branding defaults and ensure all contrast fallbacks use the softened values.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 4: Add profile name color and stronger profile box presence

**Files:**
- Modify: `renderers/blocks/UserRenderer.tsx`
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `App.tsx`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test for a `USER` block with `nameColor`.

Expected result: renderer-facing data uses `nameColor` for the name while the handle keeps its own color logic.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because `nameColor` is ignored.

**Step 3: Write minimal implementation**

Implement:

- `nameColor` support in `UserRenderer`
- stronger `SOCIAL_CHECKLIST` profile container shadow
- a color control in the editor for the user name

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 5: Rebuild PREMIUM_GLASS as liquid glass

**Files:**
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `App.tsx`
- Modify: `domain/templates/TemplateRegistry.ts`

**Step 1: Write the failing test**

Add a resolver test for `PREMIUM_GLASS` readability settings:

- `boxOverlay = dark`
- `backgroundBlur = 18`
- `backgroundOverlayStrength = 0.45`

Expected result: the computed treatment exposes these values distinctly from the base background.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because the treatment is not represented in the resolved appearance.

**Step 3: Write minimal implementation**

Update the glass renderer to use:

- higher blur
- translucent layered fill
- subtle highlight border
- light/dark tone control inside the box

Expose controls in the editor for the box tone/intensity.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 6: Improve CINEMATIC_BG readability treatment

**Files:**
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `App.tsx`

**Step 1: Write the failing test**

Add a resolver test for `CINEMATIC_BG` with dynamic background treatment values.

Expected result: the resolved appearance preserves image visibility while adding a controlled overlay and blur amount.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because only the old hard dark overlay exists.

**Step 3: Write minimal implementation**

Replace the hard overlay path with a dynamic gradient/blur treatment used only by `CINEMATIC_BG`.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 7: Add FADE template with directional support

**Files:**
- Modify: `domain/templates/TemplateRegistry.ts`
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `App.tsx`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test for a `FADE` slide with:

- `fadeSide = right`
- `fadeStrength = 0.55`
- `fadeBlur = 14`

Expected result: the appearance resolver returns the directional fade settings unchanged for the renderer.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because `FADE` does not exist yet.

**Step 3: Write minimal implementation**

Add the new `FADE` template and render it as:

- full background image
- directional darkened gradient
- light blur in the text zone
- content alignment following the selected side

Expose fade-side and intensity controls in the editor.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 8: Move FX tab controls to project scope with slide overrides

**Files:**
- Modify: `App.tsx`
- Modify: `utils/branding.ts`
- Modify: `renderers/SlideCanvas.tsx`
- Test: `tests/branding.test.ts`

**Step 1: Write the failing test**

Add a test where:

- root `projectFX.noiseAmount = 0.3`
- one slide has no override
- another slide has `postFX.noiseAmount = 0`

Expected result: first slide inherits 0.3, second resolves to 0.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because the FX tab still writes only to the current slide.

**Step 3: Write minimal implementation**

Change the FX tab to edit root `projectFX` by default while preserving manual slide-level overrides in `slide.options.postFX`.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 9: Final verification

**Files:**
- Modify: `App.tsx`
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `utils/branding.ts`
- Modify: `types.ts`
- Modify: `template-dsl/schema.ts`

**Step 1: Run test suite**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Manual preview checklist**

- In `SOCIAL_CHECKLIST`, change only the user name color and confirm the handle color remains independent.
- In `SOCIAL_CHECKLIST`, confirm the profile container shadow is stronger.
- In `PREMIUM_GLASS`, switch between lighter and darker box treatment and confirm readability changes without flattening the image.
- In `CINEMATIC_BG`, increase the readability treatment and confirm the image remains visible.
- In `FADE`, test `left`, `right`, `top`, and `bottom`.
- In FX, confirm root noise/vignette/clarity propagate to all slides and slide overrides still win.

**Step 4: Commit**

This workspace currently has no Git repository, so no commit step is available here.
