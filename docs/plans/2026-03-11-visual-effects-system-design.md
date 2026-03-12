# Visual Effects System Design

**Date:** 2026-03-11

## Context

The editor already supports per-slide image treatments and post effects, but the current model is fragmented:

- `USER` blocks do not expose enough styling for profile-heavy templates.
- `PREMIUM_GLASS` looks closer to a flat glass card than a liquid-glass surface.
- `CINEMATIC_BG` only supports a hard dark overlay, which can crush the image.
- FX controls such as noise and vignette are local to each slide instead of global by default.
- Brand white and black are currently too extreme for most luxury/editorial compositions.
- There is no generic fade layout that lets the user place readable text over a full image with directional falloff.

## Goals

- Make visual FX global by default, with per-slide overrides when needed.
- Improve readability controls for image-driven templates without flattening the image.
- Expand `USER` styling so profile templates are art-directable.
- Introduce softer base white/black identity tokens.
- Add a reusable `FADE` mode that works from any direction.

## Recommended Approach

Add a project-level `projectFX` object, then resolve slide appearance using:

1. system defaults
2. project `brandTheme`
3. project `projectFX`
4. slide `options`

Image readability controls remain slide-aware because they depend on composition and template, but they are normalized into a shared structure so multiple templates can reuse them.

## Data Model

### Project-level additions

Add `projectFX` to the carousel root:

- `noiseAmount`
- `noiseMode`
- `lightingIntensity`
- `clarity`
- `vignette`

These values act as defaults for all slides.

### Slide-level additions

Extend `slide.options` with a normalized readability/treatment group:

- `backgroundOverlayStrength`
- `backgroundOverlayColor`
- `backgroundBlur`
- `fadeSide`
- `fadeStrength`
- `fadeBlur`
- `preserveHighlights`
- `liftShadows`

These are local overrides and template-specific knobs.

### Block-level additions

Extend `USER` block options with:

- `nameColor`

This allows profile templates to style the person name independently from the handle.

## Default Identity Tokens

Replace harsh base extremes with softer defaults:

- default white: near-warm white, such as `#F5F3EE`
- default black: softened charcoal, such as `#141414`

These values still behave as the global light/dark anchors for contrast decisions, but avoid sterile pure white and crushed pure black.

## Template Behavior

### Profile templates

`SOCIAL_CHECKLIST` and `PROFILE_FOCUS` should support:

- editable name color on the `USER` block
- stronger box shadow on the profile container
- continued automatic sync of name, avatar, and Instagram from client data

### PREMIUM_GLASS

Turn the glass panel into a more liquid-glass treatment:

- stronger backdrop blur
- subtle internal highlight/specular edge
- translucent layered fill instead of a flat white/black wash
- explicit light/dark box tone control for readability

The box tone control should not repaint the whole slide, only the content container.

### CINEMATIC_BG

Keep the image full-bleed, but replace the current hard blackout with a dynamic readability treatment:

- adjustable darkening only for this template
- mild blur for the covered text zone only
- preserve highlights so the image does not look dead

### FADE

Add a new full-image layout where the background image stays visible and text sits over a directional fade zone. The user can choose:

- `left`
- `right`
- `top`
- `bottom`

The fade should combine:

- darkened gradient
- light background blur
- enough transparency to keep the image visible

## Editor Behavior

### FX tab

The FX controls become project-level by default:

- changing noise, vignette, clarity, and lighting updates `projectFX`
- each slide can still override those values manually if needed

This should mirror the current `brandTheme` inheritance model.

### Design controls

Template-specific readability controls live in the design/image panel:

- premium glass tone
- cinematic overlay strength
- fade side and intensity
- fade blur
- profile name color

## Rendering Model

Create a single appearance resolver that merges:

- soft token defaults
- `brandTheme`
- `projectFX`
- slide options

The renderer then uses the resolved appearance to:

- apply global overlays and textures consistently
- render template-specific readability treatments
- expose shared values to child renderers such as `UserRenderer`

## Testing Strategy

- Add resolver tests for `projectFX` inheritance and slide overrides.
- Add behavior tests for `USER` name color resolution.
- Add snapshot-style assertions or focused unit tests for fade/readability config resolution.
- Run TypeScript build after schema and renderer changes.
- Manually validate `SOCIAL_CHECKLIST`, `PROFILE_FOCUS`, `PREMIUM_GLASS`, `CINEMATIC_BG`, and the new `FADE` template in the preview.

## Risks

- Global FX can accidentally double-apply if renderers still read only slide-local values.
- New fade/readability controls can bloat `slide.options` if not grouped carefully.
- Softer white/black tokens may slightly change legacy slides, so overrides must continue to win.

## Outcome

This design creates a proper appearance system instead of isolated template hacks. It keeps the global workflow consistent, improves readability for image-heavy layouts, and adds the new fade-based composition without sacrificing manual control.
