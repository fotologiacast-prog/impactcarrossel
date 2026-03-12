# Editor UX Keyboard And Paste Design

**Date:** 2026-03-11

## Goal

Melhorar o fluxo de edição do editor com quatro mudanças principais:
- colagem de imagens via `CTRL+V` com escolha explícita de destino
- undo por `CTRL+Z` e ajuste fino por teclado
- simplificação das abas `Marca` e `Refino`
- retorno de `Templates` como aba própria

## Current Problems

- `CTRL+V` hoje depende de um destino pré-selecionado na sidebar, o que torna a ação ambígua e fácil de errar.
- Não existe histórico de desfazer, então qualquer ajuste arriscado depende de edição manual do JSON.
- A navegação por abas perdeu prioridade para `Templates`, apesar de ele ser um fluxo central do produto.
- A aba `Marca` mantém um bloco redundante de confirmação de cliente.
- A aba `Refino` ainda carrega controles que não são prioridade para o uso atual.

## Recommended Approach

Usar um fluxo orientado por intenção:

- `CTRL+V` com popup modal de destino
- histórico local em memória baseado no JSON do projeto
- seleção ativa no canvas respondendo a setas do teclado
- `Templates` como aba de primeira classe
- limpeza da aba `Marca` e da aba `Refino`

Essa abordagem reduz ambiguidade e evita criar modos paralelos de edição.

## UX Decisions

### Paste

Quando o clipboard contiver imagem:
- abrir um popup modal imediatamente
- oferecer exatamente 3 destinos:
  - `Imagem do template`
  - `Overlay PNG`
  - `Background`
- só aplicar a imagem após a escolha

O seletor fixo de destino deixa de ser o fluxo principal. Pode permanecer apenas como fallback técnico, ou ser removido se o código ficar mais simples.

### Undo

Adicionar histórico local baseado em snapshots do JSON:
- `CTRL+Z` desfaz a última alteração relevante
- histórico ignora mudanças redundantes iguais ao estado anterior
- ações contínuas de drag devem ser consolidadas por interação, não por pixel

### Keyboard Nudge

Quando houver objeto selecionado no canvas:
- setas movem o objeto 1px por passo
- `Shift + seta` pode ampliar para passos maiores depois, mas não é necessário no primeiro corte
- para `IMAGE_BOX`:
  - modo `box`: move `boxX` / `boxY`
  - modo `image`: move `imageX` / `imageY`

### Tabs

Nova ordem recomendada:
- `Templates`
- `Imagem`
- `Marca`
- `Conteúdo`
- `Refino`
- `Avançado`

`Conteúdo` fica focada em texto, estrutura, cores de texto e numeração.

### Brand

Remover o bloco `Usando agora`.
O cliente selecionado já fica evidente na própria lista via estado ativo.

### Refine

Remover a seção `Textura de Papel`.

## Architecture

### App State

Adicionar:
- `showPasteTargetModal`
- `pendingPastedImage`
- `historyStack`
- `historyIndex`
- `selectedCanvasObject` ou reutilizar o estado de seleção atual do canvas

### Event Handling

Centralizar atalhos de teclado no `App`:
- `paste`
- `keydown` para undo
- `keydown` para setas

### Canvas Integration

O `SlideCanvas` continua responsável pela seleção visual e pelos modos de edição do `IMAGE_BOX`.
O `App` coordena:
- histórico
- atalhos globais
- aplicação de mudanças no JSON

## Risks

- Histórico ingênuo pode crescer demais se registrar cada microalteração de drag.
- Setas não devem interferir quando o foco estiver em `input`, `textarea` ou `select`.
- O popup de paste não deve abrir para clipboard sem imagem válida.

## Validation

- colar imagem deve sempre abrir o modal de destino
- `CTRL+Z` deve desfazer a última ação editável
- setas devem mover o objeto selecionado no canvas
- aba `Templates` deve voltar a existir separadamente
- aba `Marca` sem bloco `Usando agora`
- aba `Refino` sem `Textura de Papel`
