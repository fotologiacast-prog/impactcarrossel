# Editor UX Keyboard And Paste Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar popup de destino para `CTRL+V`, undo por `CTRL+Z`, nudge por setas, restaurar a aba `Templates` e simplificar `Marca` e `Refino`.

**Architecture:** O `App` passa a centralizar atalhos globais, histórico de snapshots do JSON e o modal de paste. O `SlideCanvas` continua responsável pela seleção ativa do canvas, enquanto `App.tsx` aplica movimentos por teclado e reorganiza a navegação das abas.

**Tech Stack:** React 19, TypeScript, Vite, estado local via hooks, schema Zod existente.

---

### Task 1: Reorganize Tabs

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Não há suíte de UI hoje. Validar por build e smoke manual.

**Step 2: Implement minimal tab split**

- adicionar aba `TEMPLATES`
- remover a seleção de template da aba `CONTENT`
- manter `CONTENT` focada em texto, cores de texto, estrutura e numeração

**Step 3: Simplify brand/refine panels**

- remover `Usando agora` da aba `BRAND`
- remover `Textura de Papel` da aba `REFINE`

**Step 4: Run verification**

Run: `npm run build`
Expected: PASS

### Task 2: Add Paste Destination Modal

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Não há teste de modal hoje. Validar pelo fluxo manual.

**Step 2: Add paste modal state**

- criar `showPasteTargetModal`
- criar `pendingPastedImage`
- interceptar `paste` quando o clipboard tiver imagem

**Step 3: Apply destination handlers**

- `Imagem do template`
- `Overlay PNG`
- `Background`

**Step 4: Run verification**

Run: `npm run build`
Expected: PASS

### Task 3: Add Undo History

**Files:**
- Modify: `App.tsx`

**Step 1: Write the failing test**

Criar teste unitário simples se extrair helper de histórico; caso contrário validar com smoke manual e regressão existente.

**Step 2: Implement history stack**

- guardar snapshots do `dslInput`
- evitar duplicatas consecutivas
- expor função `undoLastAction`

**Step 3: Bind keyboard shortcut**

- `CTRL+Z` aciona undo
- ignorar quando o foco estiver em campo textual, se necessário

**Step 4: Run verification**

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS

### Task 4: Add Arrow-Key Nudge For Selected Canvas Object

**Files:**
- Modify: `App.tsx`
- Modify: `renderers/SlideCanvas.tsx`

**Step 1: Write the failing test**

Se possível, extrair helper de nudge para teste simples. Caso contrário, validar com smoke manual.

**Step 2: Expose selected canvas mode**

- garantir que o `App` saiba quando a box está selecionada e em que modo (`box` ou `image`)

**Step 3: Bind arrow keys**

- `box` move `boxX` / `boxY`
- `image` move `imageX` / `imageY`
- ignorar quando foco estiver em input/textarea/select

**Step 4: Run verification**

Run: `npm run build`
Expected: PASS

### Task 5: Regression Verification

**Files:**
- Test: `tests/branding.test.ts`
- Test: `tests/image-box-interaction.test.ts`

**Step 1: Run tests**

Run: `npx tsx tests/image-box-interaction.test.ts`
Expected: PASS

Run: `npx tsx tests/branding.test.ts`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Manual smoke check**

- colar imagem e escolher destino no popup
- desfazer uma ação com `CTRL+Z`
- mover objeto com setas
- confirmar abas `Templates`, `Marca`, `Conteúdo`, `Refino`
