# Constraint Text Engine Design

**Context**

The current editor is block-based and relies on browser wrapping plus light heuristics (`widow protection`, `balance`, `pretty`). That is not enough for editorial quality because the app does not measure the real rendered width and height of the text inside the block area. The result is unstable line breaks, ugly last lines, and text that can fit differently between preview and editor state.

This design introduces a constraint-based text fitting engine without replacing the existing block architecture. Instead of moving immediately to a zone-driven template engine, the first phase adds real measurement and scoring to the existing `TITLE` and `PARAGRAPH` blocks, where line-break quality matters most.

## Goals

- Measure text with real pixel widths instead of character heuristics.
- Fit text to the actual block width/height available in the current slide layout.
- Keep the current block model and manual override mode.
- Improve title balancing and paragraph wrapping without forcing invasive template rewrites.
- Prepare the codebase for future template zones (`PNG_STAGE`, `FADE`, `SPLIT_EDITORIAL`, `PROFILE_FOCUS`) without requiring them now.

## Non-Goals

- Full migration of all templates to `textZones`.
- Rewriting the editor around a separate layout engine.
- Supporting every block type in phase one.
- Building a full debug UI for all fit metrics on day one.

## Approaches Considered

### 1. Full `textZones` system now

Introduce template-defined text zones, process all text through those zones, and move layout responsibility out of the current block renderers.

Pros:
- Clean long-term architecture.
- High control for template-specific editorial layouts.

Cons:
- Too invasive for the current codebase.
- High risk of breaking the editor and template behavior already in production.
- Duplicates existing block layout logic.

### 2. Constraint engine layered onto the current block system

Measure the real rendered block area and use a shared text-fitting engine for `TITLE` and `PARAGRAPH`, while preserving manual line breaks and current template layouts.

Pros:
- Solves the actual quality problem with minimal structural risk.
- Reuses the current renderer and editor model.
- Creates a path to future zone support.

Cons:
- Slightly less pure than a full template-zone system.
- Needs careful DOM measurement and caching.

### 3. Continue tuning heuristics only

Keep adjusting `balance`, `pretty`, and NBSP widow logic.

Pros:
- Fastest.

Cons:
- Not enough. Still not based on real width and height constraints.

**Recommendation:** Approach 2.

## Architecture

### 1. Measurement Layer

Add a dedicated `TextMeasurer` utility using `canvas.measureText()` for:
- line width
- estimated line count under a max width
- total text height based on line count and line height

This utility will:
- cache measurements by text/font tuple
- accept `fontSize`, `fontFamily`, `fontWeight`, `letterSpacing`
- be reusable by preview, editor sync, and future export checks

### 2. Constraint Fitting Layer

Add a `fitTextToConstraint(...)` function that receives:
- raw text
- available width
- available height
- typographic settings
- limits like `maxLines`, `minFontSize`, `overflow`
- mode: `auto` or `manual`

Strategies for auto mode:
- greedy measured wrap
- balanced wrap
- semantic post-processing

Output:
- formatted text with `\n`
- final lines
- effective font size
- `wasShrunk`
- `quality`

### 3. Renderer Integration

Phase one integrates the fitter into:
- `TITLE`
- `PARAGRAPH`

Renderer responsibilities:
- compute text styling
- measure the real available width from the wrapper
- optionally receive a block-specific height constraint
- render the returned formatted string with `whiteSpace: pre-line`

Manual mode:
- always wins over auto
- still goes through fit validation to detect whether it must shrink

### 4. Editor Synchronization

The editor already mirrors rendered line breaks back into JSON. That behavior should be preserved, but now driven by the constraint engine result instead of raw browser `innerText`.

Rules:
- `manual` mode never gets overwritten
- `auto` mode may update the block content in the JSON view to match the fitted text
- markdown/highlight blocks still need guarded handling

### 5. Future Zone Support

The constraint engine should be designed so that a later `TextZone` layer can call the same `fitTextToConstraint(...)`.

That means:
- the fitter should not depend on React or DOM nodes directly
- DOM measurement should be converted into a plain constraint object before calling the fitter

## Data Flow

1. Slide layout determines wrapper width and optional height.
2. Renderer builds a plain `TextConstraint`.
3. Fitter measures candidates and scores them.
4. Renderer receives formatted lines and optional shrink size.
5. Auto mode may sync the fitted text back to the editor state.

## Error Handling and Safety

- If measurement cannot run, fall back to normalized original text.
- If fitting fails, render the original text without crashing.
- If the font is not loaded yet, still measure using the currently available family and allow re-fit on font load.
- Cache should be clearable when font/theme changes materially.

## Testing Strategy

Unit tests:
- `TextMeasurer` width/line/height basics
- `fitTextToConstraint` for balance, shrink, and manual mode
- scoring behavior for obvious widow/orphan cases

Integration tests:
- title fallback and theme font logic stay intact
- editor auto-sync still respects manual mode

Verification:
- `npx tsx tests/text-layout.test.ts`
- new fitter tests
- `npx tsx tests/branding.test.ts`
- `npm run build`

## Rollout Plan

Phase 1:
- measurement and fitting engine
- integrate into `TITLE` and `PARAGRAPH`
- keep current block architecture

Phase 2:
- extend to `CARD`, `BADGE`, `BOX`
- add debug metrics for fit quality

Phase 3:
- introduce explicit `textZones` for selected high-control templates

