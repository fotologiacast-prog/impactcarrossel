
export type BlockType = 'TITLE' | 'LIST' | 'IMAGE' | 'SPACER' | 'PARAGRAPH' | 'CARD' | 'BADGE' | 'BOX' | 'USER';

export interface Block {
  type: BlockType;
  content?: string | string[];
  options?: {
    lineBreakMode?: 'auto' | 'manual';
    manualBreaks?: string;
    autoBreakPreview?: string;
    highlight?: string;
    semanticRole?: 'intro' | 'headline' | 'support' | 'body' | 'highlight' | 'cta';
    variant?: 'default' | 'accent' | 'muted' | 'box' | 'ghost' | 'outlined' | 'pill' | 'oval' | 'check-list' | 'numbered' | 'twitter-post';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    itemIcons?: string[];
    itemCustomIcons?: string[];
    customIcon?: string; // URL da imagem ou string SVG
    align?: 'left' | 'center' | 'right';
    // Text styling overrides
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    backgroundColor?: string;
    highlightBackgroundColor?: string;
    disableAutoFit?: boolean;
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

export interface ContentTemplateDefinition {
  id: string;
  name: string;
  description: string;
  allowedBlocks: BlockType[];
  visualSignature?: string;
  sourceTemplate?: string;
}

export interface ImageLayoutDefinition {
  id: string;
  name: string;
  description: string;
  kind: 'none' | 'background' | 'fade' | 'split' | 'glass' | 'stage' | 'wave';
  position?: 'right' | 'left' | 'top' | 'bottom' | 'center';
  imageRatio?: number;
  reservedContentRatio?: number;
  sourceTemplate?: string;
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
  type: 'IMAGE_SELECT' | 'IMAGE_BACKGROUND' | 'IMAGE_BOX' | 'IMAGE_GLASS_CARD' | 'IMAGE_SPLIT_HALF' | 'IMAGE_WAVE' | 'NONE';
  url?: string;
  overlay?: 'dark' | 'blur-card' | 'none';
  boxOverlay?: 'dark' | 'light';
  position?: 'right' | 'left' | 'top' | 'bottom';
  format?: 'png' | 'jpg';
  isCutout?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  
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

export type CoverVariant = 'COVER_HIERARCHY_HERO' | 'COVER_HIERARCHY_CUTOUT' | 'COVER_HIERARCHY_MINIMAL';

export type CoverForegroundMode = 'none' | 'cutout' | 'soft-overlay';

export type CoverContrastMode = 'soft' | 'balanced' | 'high';

export interface CoverProfileBadge {
  avatar?: string;
  handle?: string;
  displayName?: string;
  meta?: string;
}

export interface CoverTextHierarchy {
  eyebrow?: string;
  titleTop?: string;
  titleMain?: string;
  supportingLine?: string;
}

export interface CoverTextLayerOptions {
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontVariant?: 'padrão' | 'destaque';
  widthPercent?: number;
}

export interface CoverTextHierarchyOptions {
  eyebrow?: CoverTextLayerOptions;
  titleTop?: CoverTextLayerOptions;
  titleMain?: CoverTextLayerOptions;
  supportingLine?: CoverTextLayerOptions;
}

export interface CoverImageLayers {
  backgroundImage?: string;
  backgroundPrompt?: string;
  backgroundX?: number;
  backgroundY?: number;
  backgroundScale?: number;
  backgroundBlur?: number;
  foregroundImage?: string;
  foregroundPrompt?: string;
  foregroundMode?: CoverForegroundMode;
}

export interface CoverEffects {
  darkOverlay?: boolean;
  topShade?: boolean;
  bottomGlow?: boolean;
  textShadow?: boolean;
  contrastMode?: CoverContrastMode;
}

export interface CoverDefinition {
  variant: CoverVariant;
  profile: CoverProfileBadge;
  text: CoverTextHierarchy;
  textOptions?: CoverTextHierarchyOptions;
  images: CoverImageLayers;
  effects: CoverEffects;
}

export interface SlideDefinition {
  template: string;
  contentTemplate?: string;
  imageLayout?: string;
  cover?: CoverDefinition;
  slideNumber?: number;
  imagePrompt?: string;
  image?: SlideImageConfig;
  overlayImages?: OverlayImageConfig[]; // Suporte a múltiplos overlays
  options?: {
    heroVariant?: 'default' | 'social';
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
    contentOffsetX?: number;
    contentOffsetY?: number;
    contentScale?: number;
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
  crm?: string | null;
  rqe?: string | null;
}

export interface CarouselDefinition {
  slides: SlideDefinition[];
  customFonts?: CustomFont[];
  brandTheme?: BrandTheme;
  projectFX?: ProjectFX;
}

export type HeuristicSlideType = 'intro' | 'single_point' | 'list' | 'stat' | 'comparison' | 'cta';

export interface HeuristicSlideSignalMap {
  intro: number;
  single_point: number;
  list: number;
  stat: number;
  comparison: number;
  cta: number;
  quote: number;
}

export interface ParsedRawSlideSignals {
  hasExplicitList: boolean;
  hasImplicitList: boolean;
  hasNumberStat: boolean;
  hasComparison: boolean;
  hasQuestion: boolean;
  hasCTA: boolean;
}

export interface ParsedSemanticField {
  raw: string;
  text: string;
  emojiHint?: string;
  iconHints: string[];
}

export interface ParsedRawCoverFields {
  supportTop?: string;
  supportTopMeta?: ParsedSemanticField;
  highlight?: string;
  highlightMeta?: ParsedSemanticField;
  supportBottom?: string;
  supportBottomMeta?: ParsedSemanticField;
  backgroundImage?: string;
  backgroundImageMeta?: ParsedSemanticField;
  foregroundImage?: string;
  foregroundImageMeta?: ParsedSemanticField;
}

export interface ParsedEditorialFields {
  intro?: string;
  introMeta?: ParsedSemanticField;
  headline?: string;
  headlineMeta?: ParsedSemanticField;
  support?: string;
  supportMeta?: ParsedSemanticField;
  body?: string;
  bodyMeta?: ParsedSemanticField;
  highlight?: string;
  highlightMeta?: ParsedSemanticField;
}

export interface ParsedRawSlide {
  index: number;
  kind?: 'cover' | 'slide';
  raw: string;
  lines: string[];
  cover?: ParsedRawCoverFields;
  editorial?: ParsedEditorialFields;
  titleCandidate?: string;
  titleCandidateMeta?: ParsedSemanticField;
  title?: string;
  titleMeta?: ParsedSemanticField;
  subtitle?: string;
  subtitleMeta?: ParsedSemanticField;
  text?: string;
  textMeta?: ParsedSemanticField;
  cta?: string;
  ctaMeta?: ParsedSemanticField;
  imagePrompt?: string;
  imagePromptMeta?: ParsedSemanticField;
  bodyLines: string[];
  bodyLineMeta?: ParsedSemanticField[];
  listItems: string[];
  listItemMeta?: ParsedSemanticField[];
  signals: ParsedRawSlideSignals;
}

export interface HeuristicSlideAnalysis {
  primaryType: HeuristicSlideType;
  type: HeuristicSlideType;
  signals: HeuristicSlideSignalMap;
  textLength: number;
  titleLength: number;
  bodyLength: number;
  itemCount: number;
  itemAverageLength: number;
  visualWeightHint: 'light' | 'medium' | 'heavy';
  hasImagePrompt: boolean;
  hasEditorialStructure?: boolean;
  shouldUseImage: boolean;
  imagePriority: number;
  prefersBigNumber: boolean;
}

export interface HeuristicTemplateProfile {
  templateId: string;
  compatibleTypes: HeuristicSlideType[];
  visualWeight: 'light' | 'medium' | 'heavy';
  imageMode: 'none' | 'background' | 'split' | 'box' | 'glass';
  contentMode: 'single' | 'stacked' | 'list' | 'stat' | 'comparison';
  preferredTextDensity: 'short' | 'medium' | 'long';
  preferredItemRange?: { min: number; max: number };
  antiRepeatGroup?: string;
}

export type PrototypeTemplateFamily = 'LIST' | 'BOX' | 'IMAGE' | 'TEXT';

export type PrototypeAreaType = 'content' | 'image' | 'accent' | 'icon_grid' | 'title' | 'body';

export interface PrototypeAreaPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PrototypeArea {
  id: string;
  type: PrototypeAreaType;
  position: PrototypeAreaPosition;
  label: string;
  allowedBlocks: BlockType[];
}

export interface PrototypeTemplatePreview {
  title: string;
  subtitle?: string;
  items?: string[];
  accent?: string;
}

export interface PrototypeTemplateCard {
  id: string;
  family: PrototypeTemplateFamily;
  name: string;
  description: string;
  visualWeight: 'light' | 'medium' | 'heavy';
  compatibleBlocks: BlockType[];
  areas: PrototypeArea[];
  preview: PrototypeTemplatePreview;
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
