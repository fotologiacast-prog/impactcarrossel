import type { Block, ProjectClientProfile, SlideDefinition } from '../types';

export const HERO_SOCIAL_VARIANT = 'social' as const;
export const HERO_SOCIAL_USER_BLOCK_VARIANT = 'twitter-post' as const;

const formatInstagramHandle = (value?: string | null) => {
  const normalized = value?.trim().replace(/^@+/, '');
  return normalized ? `@${normalized}` : '@instagram';
};

const createHeroSocialUserBlock = (client?: ProjectClientProfile | null): Block => ({
  type: 'USER',
  content: client?.name || 'Nome do profissional',
  options: {
    variant: HERO_SOCIAL_USER_BLOCK_VARIANT,
    align: 'left',
    textAlign: 'left',
    widthPercent: 100,
    size: 'lg',
    fontSize: 30,
    handle: formatInstagramHandle(client?.instagram),
    avatar: client?.profilePicture || undefined,
  },
});

const isGeneratedHeroSocialUserBlock = (block: Block) =>
  block.type === 'USER' && block.options?.variant === HERO_SOCIAL_USER_BLOCK_VARIANT;

export const applyHeroVariantToSlide = (
  slide: SlideDefinition,
  variant: 'default' | 'social',
  client?: ProjectClientProfile | null,
): SlideDefinition => {
  const nextOptions = {
    ...(slide.options || {}),
    heroVariant: variant === 'social' ? HERO_SOCIAL_VARIANT : undefined,
  };

  if (variant !== 'social') {
    const nextBlocks = slide.blocks.filter((block) => !isGeneratedHeroSocialUserBlock(block));
    return {
      ...slide,
      options: nextOptions,
      blocks: nextBlocks,
    };
  }

  const existingGeneratedIndex = slide.blocks.findIndex(isGeneratedHeroSocialUserBlock);
  const nextBlock = createHeroSocialUserBlock(client);

  if (existingGeneratedIndex >= 0) {
    const nextBlocks = slide.blocks.slice();
    nextBlocks[existingGeneratedIndex] = nextBlock;
    return {
      ...slide,
      options: nextOptions,
      blocks: nextBlocks,
    };
  }

  return {
    ...slide,
    options: nextOptions,
    blocks: [nextBlock, ...slide.blocks],
  };
};
