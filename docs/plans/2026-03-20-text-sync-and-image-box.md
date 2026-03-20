# Text Sync And Image Box Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sincronizar o texto editavel com as linhas reais renderizadas e recalibrar o layout `IMAGE_BOX` para evitar sobreposicao.

**Architecture:** O editor continua usando o fitter por canvas, mas a string final renderizada passa a ser a fonte de verdade para os textareas. O layout de `IMAGE_BOX` ganha defaults menores e passa a calcular a coluna de texto com uma reserva mais conservadora para a caixa da imagem.

**Tech Stack:** React, TypeScript, Vite, renderizacao via DOM com medicao por canvas.

---

### Task 1: Remover a UX de quebra auto/manual

**Files:**
- Modify: `App.tsx`
- Modify: `types.ts`
- Modify: `template-dsl/schema.ts`

**Step 1:** Remover o seletor `Auto/Manual` da aba de conteudo.

**Step 2:** Parar de depender de `lineBreakMode` para sincronizacao do editor.

**Step 3:** Manter compatibilidade de leitura, mas sem expor esse estado na UI.

### Task 2: Sincronizar editor com o texto renderizado

**Files:**
- Modify: `App.tsx`

**Step 1:** Expandir a sincronizacao do `block.content` para os blocos suportados pelo fitter.

**Step 2:** Normalizar o texto renderizado preservando `\\n`.

**Step 3:** Garantir que o textarea sempre mostre a mesma quebra visual do slide.

### Task 3: Recalibrar IMAGE_BOX

**Files:**
- Modify: `renderers/SlideCanvas.tsx`

**Step 1:** Reduzir os defaults de largura/altura da box.

**Step 2:** Reservar mais area visual para a imagem no layout horizontal.

**Step 3:** Diminuir a largura maxima efetiva do texto antes de ele colidir com a imagem.

### Task 4: Verificar

**Files:**
- Test: `npm run build`

**Step 1:** Rodar o build.

**Step 2:** Validar se o editor espelha as quebras e se o texto nao invade mais a area da imagem.
