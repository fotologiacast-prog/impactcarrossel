# Sidebar UX Simplification Design

**Date:** 2026-03-11

## Context

The editor sidebar grew feature-by-feature and now groups controls by technical category instead of by user intent. This creates three practical problems:

- image and effects controls are split across multiple sections, even though they are adjusted together
- branding controls are visually mixed with local slide settings, making global-vs-local behavior harder to understand
- the sidebar has too many equally weighted controls on screen at once, which makes the tool feel noisy and harder to learn

The user identified two primary flows that need to become faster and more obvious:

1. image and effect editing
2. branding and identity management

## Goals

- Reorganize the sidebar around real workflows instead of technical buckets.
- Make image/effect editing the fastest path in the tool.
- Make global branding visibly distinct from local slide customization.
- Reduce cognitive load by progressively disclosing secondary controls.
- Preserve existing power-user functionality while making the default path much simpler.

## Recommended Approach

Replace the current tab model:

- `TEMPLATES`
- `BLOCKS`
- `DESIGN`
- `FX`
- `ASSETS`
- `JSON`

with a workflow-first sidebar:

- `Conteudo`
- `Imagem`
- `Marca`
- `Refino`
- `Avancado`

This keeps the editor fast for frequent actions while still exposing advanced controls when needed.

## Information Architecture

### Conteudo

Focuses on what the slide says and how content is structured.

Includes:

- template selection
- text block editing
- text area width
- per-block width
- slide numbering
- block order and deletion

### Imagem

Focuses on the main visual composition.

Includes:

- upload/replace main template image
- image position
- zoom
- rotation
- image transform controls
- overlay PNG objects
- template-specific image behavior for `FADE`, `CINEMATIC_BG`, `PREMIUM_GLASS`

### Marca

Focuses on project identity and global defaults.

Includes:

- brand preset selection
- brand colors
- global fonts
- white/black base tokens
- global theme inheritance cues

### Refino

Focuses on finishing and atmosphere.

Includes:

- global FX
- slide FX override
- noise
- vignette
- clarity
- lighting
- paper texture

### Avancado

Focuses on technical or rare actions.

Includes:

- JSON editor
- import/export technical actions
- future debug utilities

## Interaction Principles

### Global vs Local Clarity

Every section that mixes project and slide state should visually distinguish:

- `Global`
- `Somente este slide`

Global controls should appear first when they affect the whole project.

### Progressive Disclosure

The sidebar should show only the essential controls by default. Secondary controls stay inside compact grouped cards or collapsible sections.

Examples:

- `FADE` settings should appear only when the selected slide uses `FADE`
- `PREMIUM_GLASS` settings should appear only on that template
- local FX override should sit below the global FX controls

### Stronger Prioritization

Primary actions should receive more visual weight than minor utilities:

- main template/image actions
- brand preset switching
- reset actions for slide numbering

Small toggles and destructive actions should stay visually subordinate.

## Layout Changes

### Top Navigation

The tab bar becomes workflow-based labels/icons instead of technical categories. The order should prioritize the user’s most common decisions:

1. `Imagem`
2. `Marca`
3. `Conteudo`
4. `Refino`
5. `Avancado`

This order reflects the user’s stated priorities.

### Section Design

Each sidebar tab uses:

- one clear heading
- a short helper sentence
- grouped cards with fewer competing controls

Long uninterrupted control walls should be broken into smaller clusters:

- `Imagem Principal`
- `Composicao`
- `Leitura`
- `Overlays`

## Migration Strategy

This is a UI reorganization, not a schema redesign. Existing editor state and JSON should remain valid. The change is primarily:

- tab renaming
- control relocation
- visual reprioritization
- progressive disclosure

No user projects should require migration.

## Testing Strategy

- Ensure all existing controls remain reachable after relocation.
- Verify `FADE`, `CINEMATIC_BG`, and `PREMIUM_GLASS` controls still appear contextually.
- Verify branding changes still apply globally and local overrides still work.
- Run TypeScript build after moving controls.
- Manually validate the two target workflows:
  - image/effects
  - branding

## Risks

- Moving too many controls at once can temporarily disorient existing users.
- UI-only refactors can accidentally break event handlers when controls are relocated.
- If grouping is too aggressive, advanced users may feel features disappeared even when they still exist.

## Outcome

This design simplifies the editor by mapping the sidebar to user intent. It makes image/effect work and branding adjustments faster, reduces visual noise, and keeps advanced functionality available without forcing it into the primary flow.
