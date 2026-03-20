# Text Sync And Image Box Design

**Goal:** Fazer o editor mostrar exatamente as quebras visuais renderizadas e impedir que o texto invada a area da imagem nos layouts com `IMAGE_BOX`.

**Design**
- Remover da interface o seletor de quebra `auto/manual`.
- Manter a medicao real por canvas como base unica para `TITLE`, `PARAGRAPH`, `CARD`, `BADGE` e `BOX`.
- Sincronizar o `block.content` com as quebras reais renderizadas desses blocos, para o textarea refletir o slide.
- Ignorar `lineBreakMode` no app por compatibilidade retroativa, sem depender mais dele para UX.
- Reduzir a largura/altura padrao do `IMAGE_BOX` e recalibrar a composicao horizontal para reservar mais espaco visual para a imagem.
- Limitar o espaco de texto com base no espaco restante real, usando o width medido do layout e shrink pelo fitter antes de cruzar a caixa da imagem.

**Files**
- `App.tsx`
- `renderers/SlideCanvas.tsx`
- `renderers/blocks/TitleRenderer.tsx`
- `renderers/blocks/ParagraphRenderer.tsx`
- `renderers/blocks/CardRenderer.tsx`
- `renderers/blocks/BadgeRenderer.tsx`
- `renderers/blocks/BoxRenderer.tsx`
- `types.ts`
- `template-dsl/schema.ts`
