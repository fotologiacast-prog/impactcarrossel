# Sidebar UX Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the editor sidebar around workflow-based tabs so image/effects and branding become faster to use without removing advanced functionality.

**Architecture:** Keep the current editor state and JSON model intact, but refactor the sidebar information architecture from technical tabs into workflow tabs. Reuse existing controls, move them into clearer sections, and add progressive disclosure where a control only appears when it is relevant to the selected slide or template.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind-style utility classes

---

### Task 1: Rename and reorder sidebar tabs

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Add a minimal assertion to the existing test file or a new focused UI-logic test that verifies the sidebar tab identifiers now use:

- `CONTENT`
- `IMAGE`
- `BRAND`
- `REFINE`
- `ADVANCED`

Expected result: the old identifiers no longer drive the visible sidebar layout.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL or type errors because the new tab identifiers are not implemented yet.

**Step 3: Write minimal implementation**

Update the tab enum/state and top navigation in `App.tsx` to use workflow-first tabs ordered by:

1. `IMAGE`
2. `BRAND`
3. `CONTENT`
4. `REFINE`
5. `ADVANCED`

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 2: Move image and composition controls into a single Image tab

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Define a structural expectation that image controls and image-specific readability controls are reachable under the same workflow section.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because image controls are still split across old tabs.

**Step 3: Write minimal implementation**

Move into `IMAGE`:

- main image upload
- image mode
- image position
- box/image transforms
- fade/cinematic/glass readability controls
- overlay PNG controls

Group them into compact cards:

- `Imagem Principal`
- `Composicao`
- `Leitura`
- `Overlays`

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 3: Separate global branding into a dedicated Brand tab

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Define a structural expectation that brand preset selection and global theme controls are no longer mixed with local slide design controls.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because branding still lives inside the old mixed design tab.

**Step 3: Write minimal implementation**

Move into `BRAND`:

- brand preset selection
- global colors
- global fonts
- loaded brand fonts list

Add helper labels clarifying these controls affect the whole project.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 4: Move text and block editing into Content

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Define a structural expectation that template choice, text block editing, width controls, and slide numbering are grouped under content.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because these controls still span old tabs.

**Step 3: Write minimal implementation**

Move into `CONTENT`:

- template selection
- block editing
- global content width
- per-block width
- slide numbering controls

Keep block editing scrollable and compact.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 5: Create a dedicated Refine tab for finishing controls

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Define a structural expectation that global FX and slide-level override FX are grouped under one finishing/refinement section.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because FX and texture still use the old technical split.

**Step 3: Write minimal implementation**

Move into `REFINE`:

- global FX
- local FX override
- paper texture

Visually separate:

- `Global`
- `Somente este slide`

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 6: Create an Advanced tab for technical controls

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Define a structural expectation that JSON editing is isolated from normal editing flow.

**Step 2: Run test to verify it fails**

Run: `npx tsx tests/branding.test.ts`
Expected: FAIL because JSON still occupies a peer tab in the main workflow.

**Step 3: Write minimal implementation**

Move technical controls into `ADVANCED`:

- JSON editor
- technical utilities currently mixed into normal editing

Keep the export CTA reachable, but avoid letting raw JSON compete with primary editing workflows.

**Step 4: Run test to verify it passes**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

### Task 7: Final verification

**Files:**
- Modify: `App.tsx`

**Step 1: Run tests**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Manual validation checklist**

- Confirm image upload, transform, readability, and overlay controls are all inside `IMAGE`.
- Confirm branding controls are all inside `BRAND`.
- Confirm text/block editing, text widths, and numbering are inside `CONTENT`.
- Confirm global/local FX separation is inside `REFINE`.
- Confirm JSON is isolated inside `ADVANCED`.
- Confirm no existing control became unreachable.

**Step 4: Commit**

This workspace currently has no Git repository, so no commit step is available here.
