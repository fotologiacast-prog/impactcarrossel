import type { Block } from '../types';

export const shouldUseChecklistShell = (blocks: Block[]) => {
  const listBlocks = blocks.filter((block) => block.type === 'LIST');
  if (listBlocks.length === 0) return false;

  return listBlocks.some((block) => {
    const variant = block.options?.variant || 'default';
    return variant === 'default' || variant === 'numbered';
  });
};
