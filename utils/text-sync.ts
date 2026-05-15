import emojiRegex from 'emoji-regex/RGI_Emoji';
import { Block } from '../types';

const emojiPattern = emojiRegex();

const hasProtectedMarkup = (value: string) =>
  value.includes('[[') || value.includes('**');

const isLongTextPillBadge = (block: Block) =>
  block.type === 'BADGE'
  && block.options?.variant === 'pill'
  && typeof block.content === 'string'
  && block.content.trim().length >= 44;

export const normalizeRenderedTextPreview = (value: string) =>
  value
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const normalizeAutoBreakSourceText = (value: string) =>
  value
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

export const containsEmoji = (value: string) => {
  emojiPattern.lastIndex = 0;
  return emojiPattern.test(value);
};

export const supportsRenderedTextSync = (block: Block) =>
  block.type === 'TITLE'
  || block.type === 'PARAGRAPH'
  || block.type === 'CARD'
  || block.type === 'BADGE'
  || block.type === 'BOX';

export const supportsAutoBreakPreviewSync = (block: Block) =>
  block.options?.semanticRole !== 'cta'
  && !isLongTextPillBadge(block)
  && supportsRenderedTextSync(block)
  && block.options?.lineBreakMode !== 'manual'
  && typeof block.content === 'string'
  && !hasProtectedMarkup(block.content)
  && !containsEmoji(block.content);

export const getBlockEditorTextValue = (block: Block): string => {
  if (Array.isArray(block.content)) {
    return block.content.join('\n');
  }

  if (typeof block.content !== 'string') {
    return '';
  }

  if (block.options?.lineBreakMode === 'manual') {
    return block.options.manualBreaks || block.content;
  }

  if (supportsAutoBreakPreviewSync(block)) {
    return block.options?.autoBreakPreview || block.content;
  }

  return block.content;
};

const withUpdatedPreview = (block: Block, preview: string, content: string) => {
  const nextOptions = { ...(block.options || {}) };

  if (!preview || (preview === content && !preview.includes('\n'))) {
    delete nextOptions.autoBreakPreview;
  } else {
    nextOptions.autoBreakPreview = preview;
  }

  return {
    ...block,
    options: nextOptions,
  };
};

export const updateTextBlockFromEditorValue = (
  block: Block,
  value: string,
  options?: { manualBreakIntent?: boolean },
): Block => {
  if (typeof block.content !== 'string') {
    return block;
  }

  const manualBreakIntent = options?.manualBreakIntent === true;

  if (block.options?.lineBreakMode === 'manual' || manualBreakIntent) {
    const nextOptions = {
      ...(block.options || {}),
      lineBreakMode: 'manual' as const,
      manualBreaks: normalizeRenderedTextPreview(value),
    };

    delete nextOptions.autoBreakPreview;

    return {
      ...block,
      content: normalizeAutoBreakSourceText(value),
      options: nextOptions,
    };
  }

  if (!supportsAutoBreakPreviewSync(block)) {
    return {
      ...block,
      content: value,
    };
  }

  const normalizedContent = normalizeAutoBreakSourceText(value);
  const normalizedPreview = normalizeRenderedTextPreview(value);
  const nextBlock = withUpdatedPreview(block, normalizedPreview, normalizedContent);

  return {
    ...nextBlock,
    content: normalizedContent,
  };
};

export const syncAutoBreakPreviewForBlock = (block: Block, renderedText: string): Block => {
  if (block.options?.lineBreakMode === 'manual') {
    return block;
  }

  if (!supportsAutoBreakPreviewSync(block) || typeof block.content !== 'string') {
    return block;
  }

  const normalizedPreview = normalizeRenderedTextPreview(renderedText);
  const normalizedContent = normalizeAutoBreakSourceText(block.content);
  const nextBlock = withUpdatedPreview(block, normalizedPreview, normalizedContent);

  if (
    nextBlock.options?.autoBreakPreview === block.options?.autoBreakPreview
    && normalizedContent === block.content
  ) {
    return block;
  }

  return {
    ...nextBlock,
    content: normalizedContent,
  };
};
