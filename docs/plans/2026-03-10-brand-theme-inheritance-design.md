# Brand Theme Inheritance Design

**Date:** 2026-03-10

## Context

The carousel editor currently applies branding by copying palette values directly into each slide's `options`. This causes three user-facing problems:

1. Font changes are inconsistent between manual selection and Supabase-driven presets.
2. Global brand color changes cannot reliably update all slides without overwriting manual edits.
3. Brand identity data does not guarantee white/black contrast fallbacks when Supabase does not provide them.

## Goals

- Introduce a project-level branding source of truth.
- Allow every slide to inherit brand values by default.
- Preserve per-slide manual overrides when the user customizes a field.
- Ensure black/white contrast tokens always exist and are used automatically when explicit text colors are absent.
- Make font presets from Supabase and manual font selection resolve through the same path.

## Recommended Approach

Add a `brandTheme` object at the carousel root. Keep slide `options` as optional overrides only. Rendering resolves an effective theme by merging:

1. system defaults
2. project `brandTheme`
3. slide `options`

This makes project-level changes global by default while preserving manual slide edits.

## Data Model

Add `brandTheme` to the carousel schema and types with these fields:

- `paletteId`
- `background`
- `text`
- `accent`
- `cardBg`
- `cardTextColor`
- `hlBgColor`
- `hlTextColor`
- `fontPadrão`
- `fontDestaque`
- `white`
- `black`

Notes:

- `white` and `black` are always present, even if Supabase does not provide them.
- Existing imported JSON without `brandTheme` must continue working through fallback defaults.

## Rendering Model

Create a single resolver that computes the effective slide theme:

- Start with design token defaults.
- Merge root `brandTheme`.
- Merge slide-level `options`.
- If text-related values are still missing, derive them from the background using contrast rules.

Contrast rules:

- Backgrounds with low luminance use white text by default.
- Backgrounds with high luminance use black text by default.
- Card and highlight text colors also auto-resolve against their background colors when not manually set.

## Font Model

Font application must flow through one consistent path:

- Supabase fonts are loaded into the runtime font library.
- Uploaded custom fonts are added to the same library.
- Manual selections in the editor and preset-driven selections both store the same family string.
- Renderers always use the resolved effective theme fonts, not duplicated ad-hoc logic.

## Editor Behavior

Project branding actions:

- Selecting a brand preset updates only `carousel.brandTheme`.
- The design tab still shows per-slide controls, but those controls write only slide-level overrides.
- The palette picker remains available for global branding selection.

Per-slide manual overrides:

- If the user edits slide background, text, accent, card, or font fields, only that slide changes.
- Future global brand changes continue to affect non-overridden fields on that slide.

## Supabase Integration

Server-side branding mapping should:

- normalize client palettes into a predictable structure
- preserve preset font names
- ensure `white` and `black` are added locally even when absent from Supabase data
- improve font matching so preference names resolve against loaded asset families more reliably

## Testing Strategy

Primary verification in this project:

- TypeScript build must pass.
- JSON parsing must still accept existing carousel files.
- Brand preset changes must update the rendered slide theme.
- Manual slide overrides must still take precedence.
- Font family changes must propagate to title, paragraph, list, card, box, and user renderers.

## Risks

- Existing UI code currently assumes the active palette directly represents the current slide state.
- Some slides may contain explicit text colors that intentionally bypass contrast automation.
- Root-level branding needs safe defaults so legacy projects remain visually stable.

## Outcome

This design fixes the current bugs by separating global branding inheritance from manual overrides, while making font resolution and contrast behavior deterministic across the editor and runtime.
