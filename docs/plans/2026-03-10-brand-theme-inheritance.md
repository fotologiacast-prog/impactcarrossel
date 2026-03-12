# Brand Theme Inheritance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add project-level brand theme inheritance so fonts and brand colors update globally by default while preserving per-slide manual overrides and automatic black/white contrast fallbacks.

**Architecture:** Introduce a root `brandTheme` object in the carousel schema, resolve an effective theme for each slide by merging defaults plus `brandTheme` plus slide overrides, and update the editor so palette changes write globally while slide controls remain local overrides. Font loading and contrast logic will be centralized so Supabase presets and manual selections follow the same path.

**Tech Stack:** React 19, TypeScript, Zod, Express, Supabase, Vite

---

### Task 1: Add Root Branding Types

**Files:**
- Modify: `types.ts`
- Modify: `template-dsl/schema.ts`

**Step 1: Write the failing test**

Define a minimal legacy carousel object without `brandTheme` and a new carousel object with `brandTheme`. The test expectation is that both parse successfully.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: type or schema mismatches while code is partially updated

**Step 3: Write minimal implementation**

Add `brandTheme` to the carousel types and Zod schema with optional fields and safe defaults for backward compatibility.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: build succeeds

### Task 2: Create Effective Theme Resolution

**Files:**
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `types.ts`
- Modify: `design-tokens/tokens.ts`

**Step 1: Write the failing test**

Define a slide scenario where the root theme provides fonts/colors and the slide overrides only one field. Expected behavior: the resolved theme uses the override for that field and inherits the rest.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: references to missing resolver or props until implementation is added

**Step 3: Write minimal implementation**

Add a theme resolver inside the slide render path that merges defaults, root `brandTheme`, and slide `options`, then computes fallback text colors using contrast helpers.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: build succeeds with resolved theme usage

### Task 3: Refactor Editor Branding Actions

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Set up a JSON example where two slides share project branding but one slide overrides its accent. Expected behavior: changing the project preset updates only the non-overridden accent.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: temporary inconsistencies or missing helpers during refactor

**Step 3: Write minimal implementation**

Change palette application to update `carousel.brandTheme` instead of rewriting every slide. Keep slide controls writing to slide `options` only.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: build succeeds with palette application using global branding

### Task 4: Fix Font Resolution and Source Loading

**Files:**
- Modify: `server.ts`
- Modify: `App.tsx`
- Modify: `renderers/SlideCanvas.tsx`
- Modify: `renderers/blocks/TitleRenderer.tsx`
- Modify: `renderers/blocks/ParagraphRenderer.tsx`
- Modify: `renderers/blocks/ListRenderer.tsx`
- Modify: `renderers/blocks/CardRenderer.tsx`
- Modify: `renderers/blocks/BoxRenderer.tsx`
- Modify: `renderers/blocks/UserRenderer.tsx`

**Step 1: Write the failing test**

Model a preset where Supabase returns one font label and the loaded asset family differs slightly in punctuation or spacing. Expected behavior: the resolver still maps to the actual family and the slide renderers use that family.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: incomplete resolver references until implementation is complete

**Step 3: Write minimal implementation**

Improve font normalization in the server response, unify editor font options, and make every renderer consume the same effective theme fonts.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: build succeeds and font application path is consistent

### Task 5: Add Automatic Black/White Contrast Fallbacks

**Files:**
- Modify: `App.tsx`
- Modify: `server.ts`
- Modify: `renderers/SlideCanvas.tsx`

**Step 1: Write the failing test**

Define a dark background and a light background with no explicit text override. Expected behavior: text resolves to white on dark and black on light. Do the same for cards and highlights.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: contrast helpers missing until added

**Step 3: Write minimal implementation**

Add luminance/contrast helpers, guarantee `white` and `black` tokens in every preset, and auto-resolve text/card/highlight text when not manually specified.

**Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: build succeeds with derived contrast-safe colors

### Task 6: Final Verification

**Files:**
- Modify: `App.tsx`
- Modify: `server.ts`
- Modify: `types.ts`
- Modify: `template-dsl/schema.ts`
- Modify: `renderers/SlideCanvas.tsx`

**Step 1: Run verification**

Run: `npm run build`
Expected: production build succeeds

**Step 2: Manual validation checklist**

- Select a Supabase brand preset and confirm all slides update.
- Override one slide accent or font and confirm later preset changes do not overwrite that field.
- Confirm white/black fallbacks exist even when a preset has limited colors.
- Confirm titles, paragraphs, lists, cards, boxes, and user blocks reflect the resolved fonts.

**Step 3: Commit**

This workspace currently has no Git repository, so no commit step is available here.
