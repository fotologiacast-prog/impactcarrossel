
export type BlockType = 'TITLE' | 'LIST' | 'IMAGE' | 'SPACER' | 'PARAGRAPH' | 'CARD' | 'BADGE' | 'BOX' | 'USER';

export interface Block {
  type: BlockType;
  content?: string | string[];
  options?: {
    lineBreakMode?: 'auto' | 'manual';
    highlight?: string;
    variant?: 'default' | 'accent' | 'muted' | 'box' | 'ghost' | 'outlined' | 'pill' | 'oval' | 'check-list' | 'twitter-post';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    customIcon?: string; // URL da imagem ou string SVG
    align?: 'left' | 'center' | 'right';
    // Text styling overrides
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    fontFamily?: 'sans' | 'serif' | string;
    fontVariant?: 'padrão' | 'destaque'; // New property
    widthPercent?: number;
    handle?: string; // For USER block
    avatar?: string; // For USER block
    nameColor?: string; // For USER block
    handleColor?: string; // Color for the @handle
    hideName?: boolean; // For USER block
    // Added padding for BOX block
    padding?: number;
  };
}

export interface Project {
  id: string;
  name: string;
  client_name: string; // Adicionado para suporte ao Supabase
  updatedAt: number;
  data: string; // JSON string do carrossel
  slideCount: number;
}

export type LayoutType = 'CENTERED' | 'STACKED' | 'SPLIT_IMAGE_TOP' | 'SPLIT_IMAGE_SIDE' | 'EDITORIAL' | 'GRID';

export interface TemplateDefinition {
  name: string;
  description: string;
  layoutType: LayoutType;
  allowedBlocks: BlockType[];
  maxBlocks?: number;
  previewUrl?: string;
  exampleSlide?: SlideDefinition;
}

export interface OverlayImageConfig {
  id?: string;
  url?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  isFlipped?: boolean;
}

export interface SlideImageConfig {
  type: 'IMAGE_SELECT' | 'IMAGE_BACKGROUND' | 'IMAGE_BOX' | 'IMAGE_GLASS_CARD' | 'IMAGE_SPLIT_HALF' | 'NONE';
  url?: string;
  overlay?: 'dark' | 'blur-card' | 'none';
  boxOverlay?: 'dark' | 'light';
  position?: 'right' | 'left' | 'top' | 'bottom';
  format?: 'png' | 'jpg';
  
  // BOX CONTROLS (The "Paper" Container)
  boxRotation?: number;
  boxScale?: number;
  boxX?: number;
  boxY?: number;
  width?: number; // box width
  height?: number; // box height
  
  // IMAGE CONTROLS (The Content Inside)
  imageRotation?: number;
  imageScale?: number;
  imageX?: number;
  imageY?: number;

  backgroundOpacity?: number; 
  borderWidth?: number;
  borderColor?: string;
  hasShadow?: boolean;
  hasTornEdges?: boolean; 
}

export interface SlideDefinition {
  template: string;
  slideNumber?: number;
  image?: SlideImageConfig;
  overlayImages?: OverlayImageConfig[]; // Suporte a múltiplos overlays
  options?: {
    theme?: 'dark' | 'light';
    background?: string;
    accent?: string;
    text?: string;
    cardBg?: string; 
    cardTextColor?: string; 
    cardOpacity?: number; 
    hlBgColor?: string; 
    hlTextColor?: string; 
    blockGap?: number; 
    sectionGap?: number; 
    padding?: number; 
    backgroundImage?: string;
    fontPadrão?: string; // New global font setting
    fontDestaque?: string; // New global font setting
    contentWidthPercent?: number;
    contentHorizontalAlign?: 'left' | 'center' | 'right';
    contentVerticalAlign?: 'top' | 'center' | 'bottom';
    backgroundOverlayStrength?: number;
    backgroundOverlayColor?: string;
    backgroundBlur?: number;
    boxGroupAlign?: 'left' | 'center' | 'right';
    boxGroupLayout?: 'auto' | 'row' | 'grid' | 'stack';
    fadeSide?: 'left' | 'right' | 'top' | 'bottom';
    fadeStrength?: number;
    fadeBlur?: number;
    preserveHighlights?: number;
    liftShadows?: number;
    texture?: {
      type: 'grain' | 'paper' | 'dust' | 'none';
      amount: number;
      blendMode?: string;
    };
    postFX?: {
      noiseAmount?: number;
      noiseMode?: string;
      lightingIntensity?: number;
      clarity?: number;
      vignette?: number;
    };
  };
  blocks: Block[];
}

export interface ProjectFX {
  noiseAmount?: number;
  noiseMode?: string;
  lightingIntensity?: number;
  clarity?: number;
  vignette?: number;
}

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  url: string;
  clientId?: string;
  weightRange?: string;
}

export interface BrandTheme {
  paletteId?: string;
  colors?: string[];
  background?: string;
  text?: string;
  accent?: string;
  cardBg?: string;
  cardTextColor?: string;
  hlBgColor?: string;
  hlTextColor?: string;
  fontPadrão?: string;
  fontDestaque?: string;
  white?: string;
  black?: string;
}

export interface ProjectClientProfile {
  id: string;
  name: string;
  instagram?: string | null;
  profilePicture?: string | null;
}

export interface CarouselDefinition {
  slides: SlideDefinition[];
  customFonts?: CustomFont[];
  brandTheme?: BrandTheme;
  projectFX?: ProjectFX;
}

export interface Theme {
  name: string;
  typography: {
    fontFamily: string;
    fontFamilySecondary?: string; // New
    hero: string;
    title: string;
    paragraph: string;
    body: string;
    small: string;
    titleWeight: string | number;
    letterSpacingTitle: string;
  };
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    muted: string;
    highlight: string;
    cardBg?: string; 
    cardTextColor?: string;
    cardOpacity?: number;
    hlBgColor?: string;
    hlTextColor?: string;
    white?: string;
    black?: string;
  };
  spacing: {
    canvasPadding: string;
    blockGap: string;
    sectionGap: string;
  };
  backgrounds: Record<string, any>;
}
