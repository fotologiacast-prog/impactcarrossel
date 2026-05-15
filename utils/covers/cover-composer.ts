import type { CoverProfileBadge, ParsedRawSlide, SlideDefinition } from '../../types.ts';

const isRenderableImageSource = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed)
    || /^data:image\//i.test(trimmed)
    || /^blob:/i.test(trimmed);
};

export function composeCoverSlide(
  slide: Pick<ParsedRawSlide, 'index' | 'title' | 'subtitle' | 'text' | 'imagePrompt'>,
  profile: CoverProfileBadge = {},
): SlideDefinition {
  const isStructuredCover = 'cover' in slide && Boolean((slide as ParsedRawSlide).cover);
  const coverFields = isStructuredCover ? (slide as ParsedRawSlide).cover : undefined;
  const eyebrow = coverFields?.supportTop || slide.subtitle || undefined;
  const titleMain = coverFields?.highlight || slide.title || `Slide ${slide.index}`;
  const supportingLine = coverFields?.supportBottom || slide.text || undefined;
  const backgroundImageValue = coverFields?.backgroundImage || slide.imagePrompt || undefined;
  const foregroundImageValue = coverFields?.foregroundImage || undefined;
  const backgroundImage = isRenderableImageSource(backgroundImageValue) ? backgroundImageValue : undefined;
  const foregroundImage = isRenderableImageSource(foregroundImageValue) ? foregroundImageValue : undefined;
  const backgroundPrompt = backgroundImageValue && !backgroundImage ? backgroundImageValue : undefined;
  const foregroundPrompt = foregroundImageValue && !foregroundImage ? foregroundImageValue : undefined;

  return {
    template: 'HERO',
    contentTemplate: 'HERO',
    imageLayout: 'IMAGE_NONE',
    image: {
      type: 'NONE',
    },
    blocks: [
      {
        type: 'TITLE',
        content: titleMain,
        options: {
          fontSize: 84,
          align: 'center',
          fontVariant: 'destaque',
        },
      },
      ...(eyebrow
        ? [{
            type: 'PARAGRAPH' as const,
            content: eyebrow,
            options: {
              fontSize: 28,
              align: 'center' as const,
              fontWeight: 700,
            },
          }]
        : []),
      ...(supportingLine
        ? [{
            type: 'PARAGRAPH' as const,
            content: supportingLine,
            options: {
              fontSize: 24,
              align: 'center' as const,
            },
          }]
        : []),
    ],
    cover: {
      variant: 'COVER_HIERARCHY_HERO',
      profile,
      text: {
        eyebrow,
        titleTop: undefined,
        titleMain,
        supportingLine,
      },
      images: {
        backgroundImage,
        backgroundPrompt,
        foregroundImage,
        foregroundPrompt,
        foregroundMode: foregroundImage ? 'cutout' : 'none',
      },
      effects: {
        darkOverlay: true,
        topShade: true,
        bottomGlow: true,
        textShadow: true,
        contrastMode: 'balanced',
      },
    },
  };
}
