import { Block } from '../types';

export type IconEditTarget = {
  block: Block;
  blockIndex: number;
  itemIndex?: number;
};

export type SlideUpdate = {
  path: (string | number)[];
  value: any;
};

const normalizeIconArray = (values: string[]) => {
  const next = [...values];
  while (next.length > 0 && !next[next.length - 1]) {
    next.pop();
  }
  return next;
};

const setIconAtIndex = (values: string[] | undefined, index: number, value?: string) => {
  const next = [...(values || [])];
  while (next.length <= index) {
    next.push('');
  }
  next[index] = value || '';
  return normalizeIconArray(next);
};

export const resolveIconEditSelection = (target: IconEditTarget) => {
  if (target.itemIndex === undefined) {
    return {
      icon: target.block.options?.icon || '',
      customIcon: target.block.options?.customIcon || '',
    };
  }

  return {
    icon: target.block.options?.itemIcons?.[target.itemIndex] || '',
    customIcon: target.block.options?.itemCustomIcons?.[target.itemIndex] || '',
  };
};

export const buildIconEditUpdates = (
  target: IconEditTarget,
  nextSelection: { icon?: string; customIcon?: string },
): SlideUpdate[] => {
  if (target.itemIndex === undefined) {
    return [
      { path: ['blocks', target.blockIndex, 'options', 'icon'], value: nextSelection.icon || undefined },
      { path: ['blocks', target.blockIndex, 'options', 'customIcon'], value: nextSelection.customIcon || undefined },
    ];
  }

  const nextItemIcons = setIconAtIndex(target.block.options?.itemIcons, target.itemIndex, nextSelection.icon);
  const nextCustomIcons = setIconAtIndex(target.block.options?.itemCustomIcons, target.itemIndex, nextSelection.customIcon);

  return [
    { path: ['blocks', target.blockIndex, 'options', 'itemIcons'], value: nextItemIcons.length > 0 ? nextItemIcons : undefined },
    { path: ['blocks', target.blockIndex, 'options', 'itemCustomIcons'], value: nextCustomIcons.length > 0 ? nextCustomIcons : undefined },
  ];
};
