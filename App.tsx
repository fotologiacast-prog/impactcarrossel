
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { carouselSchema, ValidatedCarousel } from './template-dsl/schema';
import { SlideCanvas } from './renderers/SlideCanvas';
import { captureJpeg, downloadZip } from './utils/export';
import { contentTemplateRegistry } from './domain/templates/ContentTemplateRegistry';
import {
  createImageConfigFromLayout,
  createOptionOverridesFromImageLayout,
  resolveSlideComposition,
} from './domain/templates/templateComposition';
import {
  getDefaultImageLayoutIdForFamily,
  getImageLayoutDirection,
  getImageLayoutFamilies,
  getImageLayoutFamily,
  getImageLayoutIdForFamilyDirection,
} from './domain/templates/ImageLayoutRegistry';
import { TOKENS } from './design-tokens/tokens';
import { Block, Project, CustomFont, OverlayImageConfig, SlideDefinition } from './types';
import {
  applyBrandThemeToSlides,
  applyProjectClientToSlide,
  createBrandThemeFromPreset,
  getFontFaceDefinition,
  getBrandPaletteSwatches,
  getPreferredFontsForInjection,
  mergeSlideOptionsWithBrandTheme,
  normalizeFontFamilyName,
  syncBrandThemeFontFamilies,
} from './utils/branding';
import * as Icons from 'lucide-react';
import { 
  AlertCircle, LayoutTemplate, 
  ChevronLeft, ChevronRight, X, Image as ImageIcon,
  Loader2, Palette, Check, Library, Trash2, Layers,
  Save, RotateCcw, Sun, Moon, ZoomIn, ZoomOut, Maximize,
  Circle, Square, CheckCircle2, XCircle, Star, Heart,
  ArrowRight, Zap, Shield, AlertTriangle, User, Info,
  ClipboardPaste, AlignLeft, AlignRight, AlignCenter,
  Download, FileArchive, FileJson, Type, FolderHeart,
  Calendar, Plus, ExternalLink,
  Home, Search, Clock, ChevronRight as ChevronRightSmall,
  CheckSquare, Square as SquareIcon, Grid,
  Edit3, Pipette, PlusCircle, ToggleLeft, ToggleRight, BoxSelect,
  Filter, UserCircle, Wind, Droplet, CheckCircle, Database, DatabaseZap,
  MoveHorizontal, MoveVertical, LayoutPanelTop, Frame,
  Trello, Maximize2, Upload, Sparkles, Contrast, Focus, Bold, Highlighter,
  Baseline, Type as TypeIcon, Scissors, Move, Box as BoxIcon,
  ChevronUp, ChevronDown, AlignJustify, Pencil, CloudUpload, HardDrive,
  Eye, EyeOff, ImagePlus, Image as ImageIconLucide,
  RectangleHorizontal, Move3d, AlignStartVertical, AlignEndVertical,
  AlignCenterVertical, Layout, Monitor, Ghost, MousePointer, Focus as FocusIcon, Hash,
  SlidersHorizontal
} from 'lucide-react';

const LOGO_URL = "https://ik.imagekit.io/zslvvoal4/Logo%20Impact.webp?updatedAt=1761153002773";

// Configurações do Supabase
import { supabase } from './services/supabase';
import { parseRawScript } from './utils/heuristics/raw-slide-parser';
import { classifyParsedRawSlide } from './utils/heuristics/slide-classifier';
import { selectContentTemplate } from './utils/heuristics/template-selector';
import { buildCarouselFromScript } from './utils/heuristics/script-to-carousel';
import { generateSlideFromScript, type SingleSlideScriptMode } from './utils/heuristics/script-to-slide';
import { getCoverMainTitleSize } from './utils/covers/cover-sizing';
import { evaluateSlideLayoutFit } from './utils/slide-layout-fit';
import { buildIconEditUpdates, resolveIconEditSelection, type IconEditTarget } from './utils/icon-edit';
import { searchLucideIcons } from './utils/lucide-library';
import { pushRecentIconId } from './utils/recent-icons';
import { applyHeroVariantToSlide } from './utils/hero-social';
import { buildVisibleContentTemplateOptions, type VisibleContentTemplateOption } from './utils/content-template-options';
import { resolveImageLayoutIdForFamilySelection } from './utils/image-layout-selection';
import {
  getBlockEditorTextValue,
  supportsAutoBreakPreviewSync,
  syncAutoBreakPreviewForBlock,
  updateTextBlockFromEditorValue,
} from './utils/text-sync';
import {
  detectImageFormatFromDataUrl,
  detectImageHasTransparency,
  estimateDataUrlBytes,
  formatImageBytes,
  loadImageDimensions,
  optimizeImageDataUrl,
  type PendingImageDraft,
  type PendingImageTarget,
} from './utils/image-optimization';
import { shouldTreatImageAsCutout } from './utils/image-cutout';
import { resolveCoverTransformMetrics } from './utils/cover-transform';
import { resolveImagePreviewFrame } from './utils/image-preview-frame';
import {
  buildNewBlockOptions,
  createDefaultBlockForType,
  type NewBlockOption,
  type NewBlockType,
} from './utils/block-preset-options';
import {
  alignBlocksForSlideLayout,
  buildSlideAlignmentUpdates,
} from './utils/slide-alignment';
import {
  FINISH_PRESETS,
  GUIDED_STEPS,
  VISUAL_PRESETS,
  getGuidedReviewIssues,
  getGuidedScriptSummary,
  getSlideImageGuidance,
  type GuidedContrast,
  type GuidedDensity,
  type GuidedStepId,
  type StudioMode,
} from './utils/guided-studio';

const GOOGLE_FONTS = [
  { id: 'Inter', label: 'Inter (Sans)' },
  { id: 'Instrument Serif', label: 'Instrument Serif' },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Playfair Display', label: 'Playfair Display' },
  { id: 'Bebas Neue', label: 'Bebas Neue' },
  { id: 'Roboto Mono', label: 'Roboto Mono (Tech)' },
  { id: 'Unbounded', label: 'Unbounded (Bold)' },
  { id: 'Syne', label: 'Syne (Art)' }
];

const INITIAL_DSL = `{
  "slides": [],
  "customFonts": []
}`;

const IMAGE_TYPE_PRESETS = [
  { id: 'IMAGE_BACKGROUND', label: 'Background', icon: Maximize },
  { id: 'IMAGE_BOX', label: 'Box UI', icon: Square },
  { id: 'IMAGE_GLASS_CARD', label: 'Glass', icon: Droplet },
  { id: 'IMAGE_SPLIT_HALF', label: 'Split', icon: Layers },
  { id: 'IMAGE_WAVE', label: 'Onda', icon: Wind },
];

const DEFAULT_BRAND_PRESETS = [
  { 
    id: '1', 
    name: 'Impact Blue', 
    colors: ['#050507', '#FFFFFF', '#1fb2f7', '#1fb2f7', '#1fb2f7'],
    font_padrao: 'Inter',
    font_destaque: 'Instrument Serif',
    defaults: { bg: '#050507', accent: '#1fb2f7', text: '#FFFFFF', cardBg: '#1fb2f7', hlBgColor: '#1fb2f7' }
  },
  { 
    id: '2', 
    name: 'Instagram Gold', 
    colors: ['#0D0D0D', '#FFFFFF', '#EAB308', '#EAB308', '#EAB308'],
    font_padrao: 'Inter',
    font_destaque: 'Instrument Serif',
    defaults: { bg: '#0D0D0D', accent: '#EAB308', text: '#FFFFFF', cardBg: '#EAB308', hlBgColor: '#EAB308' }
  }
];

const ICON_LIBRARY_PRESETS = [
  { id: 'Circle', icon: Circle, label: 'Círculo' },
  { id: 'Square', icon: Square, label: 'Quadrado' },
  { id: 'CheckCircle2', icon: CheckCircle2, label: 'Check' },
  { id: 'XCircle', icon: XCircle, label: 'Fechar' },
  { id: 'Star', icon: Star, label: 'Estrela' },
  { id: 'Heart', icon: Heart, label: 'Coração' },
  { id: 'ArrowRight', icon: ArrowRight, label: 'Seta' },
  { id: 'Zap', icon: Zap, label: 'Raio' },
  { id: 'Shield', icon: Shield, label: 'Escudo' },
  { id: 'AlertTriangle', icon: AlertTriangle, label: 'Alerta' },
  { id: 'User', icon: User, label: 'Usuário' },
  { id: 'Info', icon: Info, label: 'Info' },
];

const safeFontFaceCheck = (family?: string | null): boolean => {
  if (!family || typeof document === 'undefined' || !('fonts' in document) || typeof document.fonts?.check !== 'function') {
    return false;
  }

  try {
    const escapedFamily = family.replace(/["\\]/g, '\\$&');
    return document.fonts.check(`16px "${escapedFamily}"`);
  } catch {
    return false;
  }
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
  reader.readAsDataURL(file);
});

const getPendingImageTargetLabel = (target: PendingImageTarget) => {
  switch (target) {
    case 'template':
      return 'imagem do template';
    case 'background':
      return 'background';
    case 'overlay':
      return 'overlay PNG';
    case 'cover-background':
      return 'fundo da capa';
    case 'cover-foreground':
      return 'imagem destaque da capa';
    default:
      return 'imagem';
  }
};

const getImageOptimizationReduction = (originalBytes: number, optimizedBytes: number) => (
  Math.max(0, Math.round((1 - (optimizedBytes / Math.max(1, originalBytes))) * 100))
);

type ImageOptimizationSummary = {
  slideIndex: number;
  target: PendingImageTarget;
  originalBytes: number;
  optimizedBytes: number;
};

const SafeTextArea = ({
  value,
  onChange,
  className,
  placeholder,
  style,
}: {
  value: string,
  onChange: (val: string, meta?: { manualBreakIntent?: boolean }) => void,
  className?: string,
  placeholder?: string,
  style?: React.CSSProperties,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const manualBreakIntentRef = useRef(false);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val, { manualBreakIntent: manualBreakIntentRef.current });
    manualBreakIntentRef.current = false;
  };

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onBlur={() => {
        isFocusedRef.current = false;
        if (value !== localValue) {
          setLocalValue(value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
          manualBreakIntentRef.current = true;
        }
      }}
      className={className}
      placeholder={placeholder}
      style={style}
    />
  );
};

const supportsFontWeightControl = (block: Block) =>
  block.type === 'TITLE'
  || block.type === 'PARAGRAPH'
  || block.type === 'LIST'
  || block.type === 'CARD'
  || block.type === 'BADGE'
  || block.type === 'BOX'
  || block.type === 'USER';

const getEffectiveBlockFontSize = (block: Block, allBlocks?: Block[]) => {
  if (typeof block.options?.fontSize === 'number' && !Number.isNaN(block.options.fontSize)) {
    return block.options.fontSize;
  }

  switch (block.type) {
    case 'TITLE': {
      const size = block.options?.size || 'md';
      if (size === 'sm') return 56;
      if (size === 'lg') return 180;
      return 80;
    }
    case 'PARAGRAPH':
      return 32;
    case 'LIST':
      return block.options?.variant === 'box' ? 34 : 34;
    case 'CARD':
      return 30;
    case 'BADGE':
      return 26;
    case 'BOX': {
      const totalBoxes = allBlocks?.filter((candidate) => candidate.type === 'BOX').length ?? 1;
      if (totalBoxes === 1) return 48;
      if (totalBoxes === 2) return 38;
      return 30;
    }
    case 'USER':
      return block.options?.size === 'lg' ? 32 : 20;
    default:
      return 32;
  }
};

const getDefaultCoverLayerFontSize = (
  layer: 'eyebrow' | 'titleTop' | 'titleMain' | 'supportingLine',
  cover?: SlideDefinition['cover'],
) => {
  switch (layer) {
    case 'eyebrow':
      return 28;
    case 'titleTop':
      return 52;
    case 'titleMain':
      return getCoverMainTitleSize(cover?.text?.titleMain || cover?.text?.titleTop || '');
    case 'supportingLine':
      return 24;
    default:
      return 32;
  }
};

const getDefaultCoverLayerWeight = (layer: 'eyebrow' | 'titleTop' | 'titleMain' | 'supportingLine') => {
  switch (layer) {
    case 'eyebrow':
      return 300;
    case 'titleTop':
      return 400;
    case 'titleMain':
      return 700;
    case 'supportingLine':
      return 350;
    default:
      return 400;
  }
};

const TransformControl = ({ label, value, min, max, step, onChange, highlight = false }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, highlight?: boolean }) => (
  <div className={`flex flex-col gap-1.5 flex-1 p-2 rounded-xl transition-colors ${highlight ? 'bg-brand/5 border border-brand/10' : ''}`}>
    <div className="flex justify-between px-1">
      <span className={`text-[9px] font-bold uppercase tracking-tighter ${highlight ? 'text-brand' : 'text-zinc-500'}`}>{label}</span>
      <span className={`text-[9px] font-mono ${highlight ? 'text-brand' : 'text-zinc-400'}`}>{value.toFixed(step === 1 ? 0 : 2)}</span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-brand`}
    />
  </div>
);

const StepperNumberControl = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) => {
  const clamp = (nextValue: number) => Math.min(max, Math.max(min, nextValue));

  return (
    <div className="space-y-2 flex-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-zinc-400">{value}</span>
      </div>
      <div className="flex items-center gap-2 bg-black/60 border border-white/5 rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          className="w-10 h-10 rounded-lg bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-lg font-black"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const rawValue = e.target.value;
            if (rawValue === '') return;
            const parsedValue = Number(rawValue);
            if (Number.isNaN(parsedValue)) return;
            onChange(clamp(parsedValue));
          }}
          className="flex-1 bg-transparent border-0 text-center text-[12px] font-black text-white outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          className="w-10 h-10 rounded-lg bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-lg font-black"
        >
          +
        </button>
      </div>
    </div>
  );
};



const ColorPropertyControl = ({ 
  label, 
  value, 
  paletteColors, 
  onChange 
}: { 
  label: string, 
  value: string, 
  paletteColors: string[], 
  onChange: (val: string) => void 
}) => (
  <div className="space-y-2.5 group w-full">
    <div className="flex items-center justify-between px-1">
      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.15em]">{label}</span>
      <span className="text-[10px] font-mono text-zinc-600 tabular-nums uppercase font-bold tracking-tighter">{value}</span>
    </div>
    <div className="flex items-center gap-2 p-2.5 bg-zinc-950/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner">
       <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg group/picker cursor-pointer p-[2.5px] bg-gradient-to-tr from-[#FF0080] via-[#7928CA] to-[#0070F3]">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-zinc-900 flex items-center justify-center relative">
             <input 
               type="color" 
               value={value || '#ffffff'} 
               onChange={(e) => onChange(e.target.value)} 
               className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10" 
             />
             <div 
               className="w-7 h-7 rounded-xl border border-white/10 shadow-inner flex items-center justify-center overflow-hidden"
               style={{ backgroundColor: value }}
             >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover/picker:opacity-100 transition-opacity">
                   <Pipette size={14} className={parseInt(value.replace('#', ''), 16) > 0x888888 ? 'text-black' : 'text-white'} />
                </div>
             </div>
          </div>
       </div>
       <div className="flex flex-1 gap-2 overflow-x-auto py-1 custom-scrollbar scroll-smooth no-scrollbar">
          {paletteColors.map((color, i) => (
            <button 
              key={i} 
              onClick={() => onChange(color)} 
              className={`w-10 h-10 rounded-xl border-2 shrink-0 transition-all flex items-center justify-center ${value.toLowerCase() === color.toLowerCase() ? 'border-brand scale-110 shadow-[0_5px_15_rgba(31,178,247,0.3)] z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 bg-white/5'}`}
              style={{ backgroundColor: color }}
            >
               {value.toLowerCase() === color.toLowerCase() && <Check size={14} className={parseInt(color.replace('#', ''), 16) > 0x888888 ? 'text-black' : 'text-white'} strokeWidth={3} />}
            </button>
          ))}
       </div>
    </div>
  </div>
);

const NEW_BLOCK_OPTION_ICONS: Record<NewBlockOption['icon'], React.ComponentType<{ size?: number; className?: string }>> = {
  title: TypeIcon,
  paragraph: AlignJustify,
  list: CheckSquare,
  box: BoxIcon,
  card: RectangleHorizontal,
  badge: Hash,
  user: UserCircle,
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'IMAGE' | 'BRAND' | 'CONTENT' | 'REFINE' | 'ADVANCED'>('IMAGE');
  const [studioMode, setStudioMode] = useState<StudioMode>('guided');
  const [hasEnteredGuidedFlow, setHasEnteredGuidedFlow] = useState(false);
  const [guidedStep, setGuidedStep] = useState<GuidedStepId>('client');
  const [guidedDensity, setGuidedDensity] = useState<GuidedDensity>('balanced');
  const [guidedContrast, setGuidedContrast] = useState<GuidedContrast>('medium');
  const [guidedFinishScope, setGuidedFinishScope] = useState<'all' | 'current'>('all');
  const [guidedImageInspector, setGuidedImageInspector] = useState<'image' | 'alignment' | 'colors' | 'finish' | 'text' | null>('image');
  const [guidedSelectedBlockIndex, setGuidedSelectedBlockIndex] = useState<number | null>(null);
  const [dslInput, setDslInput] = useState(INITIAL_DSL);
  const [carousel, setCarousel] = useState<ValidatedCarousel | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.40);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [activePaletteId, setActivePaletteId] = useState('1');
  const [brandPresets, setBrandPresets] = useState<any[]>(
    DEFAULT_BRAND_PRESETS.map((preset) => ({
      ...preset,
      colors: getBrandPaletteSwatches(preset),
    })),
  );
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showBrandAdvanced, setShowBrandAdvanced] = useState(false);
  const [showBrandFonts, setShowBrandFonts] = useState(false);
  const [uploadedBackgrounds, setUploadedBackgrounds] = useState<string[]>([]);
  const [isCreatingPalette, setIsCreatingPalette] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [newPaletteData, setNewPaletteData] = useState({
    name: '',
    colors: ['#0D0D0D', '#FFFFFF', '#1fb2f7', '#1fb2f7', '#1fb2f7'],
    font_padrao: 'Inter',
    font_destaque: 'Instrument Serif'
  });
  const [clientFonts, setClientFonts] = useState<CustomFont[]>([]);
  const [selectedClientProfile, setSelectedClientProfile] = useState<{
    id: string;
    name: string;
    instagram?: string | null;
    profilePicture?: string | null;
    crm?: string | null;
    rqe?: string | null;
  } | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSlidesToExport, setSelectedSlidesToExport] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [contentTemplates] = useState(() => contentTemplateRegistry.getAll());
  const [imageLayoutFamilies] = useState(() => getImageLayoutFamilies());
  const [showPasteTargetModal, setShowPasteTargetModal] = useState(false);
  const [pendingPastedImage, setPendingPastedImage] = useState<string | null>(null);
  const [pendingImageDraft, setPendingImageDraft] = useState<PendingImageDraft | null>(null);
  const [isOptimizingPendingImage, setIsOptimizingPendingImage] = useState(false);
  const [lastImageOptimizationSummary, setLastImageOptimizationSummary] = useState<ImageOptimizationSummary | null>(null);
  const [showScriptComposerModal, setShowScriptComposerModal] = useState(false);
  const [showSingleSlideScriptModal, setShowSingleSlideScriptModal] = useState(false);
  const [rawScriptInput, setRawScriptInput] = useState('');
  const [singleSlideScriptInput, setSingleSlideScriptInput] = useState('');
  const [singleSlideScriptMode, setSingleSlideScriptMode] = useState<SingleSlideScriptMode>('patch');
  const [selectedCanvasObject, setSelectedCanvasObject] = useState<{ type: 'IMAGE_BOX'; mode: 'box' | 'image' } | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showAddBlockPicker, setShowAddBlockPicker] = useState(false);
  const [templatePreviewNaturalSize, setTemplatePreviewNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const historyStackRef = useRef<string[]>([INITIAL_DSL]);
  const historyIndexRef = useRef(0);
  const isApplyingHistoryRef = useRef(false);
  const pendingHistoryMergeKeyRef = useRef<string | null>(null);
  const activeHistoryMergeKeyRef = useRef<string | null>(null);
  const currentSlide = useMemo(() => carousel?.slides[currentIndex], [carousel, currentIndex]);
  const isCoverSlide = Boolean(currentSlide?.cover);
  const hasPendingImageDraft = Boolean(pendingImageDraft);
  const isPendingImageOnCurrentSlide = pendingImageDraft?.slideIndex === currentIndex;
  const currentImageOptimizationSummary = useMemo(
    () => (
      lastImageOptimizationSummary && lastImageOptimizationSummary.slideIndex === currentIndex
        ? lastImageOptimizationSummary
        : null
    ),
    [currentIndex, lastImageOptimizationSummary],
  );
  const currentSlideComposition = useMemo(
    () => (currentSlide ? resolveSlideComposition(currentSlide as any) : null),
    [currentSlide],
  );
  const currentSlideFit = useMemo(
    () => (currentSlide && !currentSlide.cover ? evaluateSlideLayoutFit(currentSlide as any) : null),
    [currentSlide],
  );
  const visibleContentTemplateOptions = useMemo(
    () => buildVisibleContentTemplateOptions(contentTemplates),
    [contentTemplates],
  );
  const visibleContentTemplateOptionsForCurrentSlide = useMemo(
    () => (
      isCoverSlide
        ? visibleContentTemplateOptions.filter((option) => option.heroVariant !== 'social')
        : visibleContentTemplateOptions
    ),
    [isCoverSlide, visibleContentTemplateOptions],
  );
  const hasActiveImageTemplate = useMemo(
    () => Boolean(currentSlideComposition?.imageLayoutId && currentSlideComposition.imageLayoutId !== 'IMAGE_NONE'),
    [currentSlideComposition?.imageLayoutId],
  );
  const currentVisibleContentTemplateId = useMemo(() => {
    if (
      !hasActiveImageTemplate
      && currentSlideComposition?.contentTemplateId === 'HERO'
      && currentSlide?.options?.heroVariant === 'social'
    ) {
      return 'HERO_SOCIAL';
    }
    return currentSlideComposition?.contentTemplateId;
  }, [currentSlide?.options?.heroVariant, currentSlideComposition?.contentTemplateId, hasActiveImageTemplate]);
  const currentImageLayoutFamily = useMemo(
    () => (
      hasActiveImageTemplate && currentSlideComposition?.imageLayoutId
        ? getImageLayoutFamily(currentSlideComposition.imageLayoutId)
        : undefined
    ),
    [currentSlideComposition?.imageLayoutId, hasActiveImageTemplate],
  );
  const currentImageLayoutDirection = useMemo(
    () => (
      hasActiveImageTemplate && currentSlideComposition?.imageLayoutId
        ? getImageLayoutDirection(currentSlideComposition.imageLayoutId)
        : undefined
    ),
    [currentSlideComposition?.imageLayoutId, hasActiveImageTemplate],
  );
  const currentTemplateImageNaturalSize = useMemo(
    () => (
      currentSlide?.image?.naturalWidth && currentSlide?.image?.naturalHeight
        ? {
            width: currentSlide.image.naturalWidth,
            height: currentSlide.image.naturalHeight,
          }
        : templatePreviewNaturalSize
    ),
    [currentSlide?.image?.naturalHeight, currentSlide?.image?.naturalWidth, templatePreviewNaturalSize],
  );
  const currentTemplatePreviewFrame = useMemo(
    () => resolveImagePreviewFrame({
      imageLayoutId: currentSlideComposition?.imageLayoutId,
      imageWidth: currentSlide?.image?.width,
      imageHeight: currentSlide?.image?.height,
    }),
    [
      currentSlide?.image?.height,
      currentSlide?.image?.width,
      currentSlideComposition?.imageLayoutId,
    ],
  );
  const currentTemplatePreviewCoverFrame = currentTemplatePreviewFrame.coverRect || {
    left: 0,
    top: 0,
    width: currentTemplatePreviewFrame.width,
    height: currentTemplatePreviewFrame.height,
  };
  const currentTemplatePreviewMetrics = useMemo(
    () => (
      currentTemplateImageNaturalSize
        ? resolveCoverTransformMetrics({
            viewportWidth: currentTemplatePreviewCoverFrame.width,
            viewportHeight: currentTemplatePreviewCoverFrame.height,
            imageWidth: currentTemplateImageNaturalSize.width,
            imageHeight: currentTemplateImageNaturalSize.height,
            scale: currentSlide?.image?.imageScale || 1,
          })
        : null
    ),
    [
      currentSlide?.image?.imageScale,
      currentTemplateImageNaturalSize,
      currentTemplatePreviewCoverFrame.height,
      currentTemplatePreviewCoverFrame.width,
    ],
  );
  const isTemplatePreviewCutout = useMemo(
    () => shouldTreatImageAsCutout(currentSlide?.image),
    [currentSlide?.image],
  );
  const currentTemplateFadeSide = useMemo(
    () => (
      currentSlideComposition?.imageLayoutId === 'IMAGE_FADE_RIGHT'
        ? 'right'
        : currentSlideComposition?.imageLayoutId === 'IMAGE_FADE_TOP'
          ? 'top'
          : currentSlideComposition?.imageLayoutId === 'IMAGE_FADE_BOTTOM'
            ? 'bottom'
            : currentSlideComposition?.imageLayoutId === 'IMAGE_FADE_LEFT'
              ? 'left'
              : null
    ),
    [currentSlideComposition?.imageLayoutId],
  );
  useEffect(() => {
    const imageUrl = currentSlide?.image?.url;
    const hasStoredNaturalSize = Boolean(currentSlide?.image?.naturalWidth && currentSlide?.image?.naturalHeight);

    if (!imageUrl || hasStoredNaturalSize) {
      setTemplatePreviewNaturalSize(null);
      return;
    }

    let isActive = true;
    loadImageDimensions(imageUrl)
      .then((dimensions) => {
        if (!isActive) return;
        setTemplatePreviewNaturalSize(dimensions);
      })
      .catch(() => {
        if (!isActive) return;
        setTemplatePreviewNaturalSize(null);
      });

    return () => {
      isActive = false;
    };
  }, [currentSlide?.image?.naturalHeight, currentSlide?.image?.naturalWidth, currentSlide?.image?.url]);
  const groupedImageLayouts = useMemo(
    () => imageLayoutFamilies.filter((family) => family.id !== 'none'),
    [imageLayoutFamilies],
  );
  const currentSlideHasBoxes = useMemo(
    () => !!currentSlide?.blocks?.some((block) => block.type === 'BOX'),
    [currentSlide],
  );
  const newBlockOptions = useMemo(
    () => buildNewBlockOptions(),
    [],
  );
  const imageDirectionLabel = useCallback((direction: 'left' | 'right' | 'top' | 'bottom' | 'center') => {
    switch (direction) {
      case 'left':
        return 'Esquerda';
      case 'right':
        return 'Direita';
      case 'top':
        return 'Topo';
      case 'bottom':
        return 'Base';
      default:
        return 'Centro';
    }
  }, []);
  const pendingImageTargetOptions = useMemo(() => {
    if (isCoverSlide) {
      return [
        { id: 'cover-background' as const, label: 'Fundo da capa', icon: LayoutTemplate },
        { id: 'cover-foreground' as const, label: 'Imagem destaque da capa', icon: Scissors },
      ];
    }

    return [
      { id: 'template' as const, label: 'Imagem do template', icon: ImageIconLucide },
      { id: 'overlay' as const, label: 'Overlay PNG', icon: Ghost },
      { id: 'background' as const, label: 'Background', icon: LayoutTemplate },
    ];
  }, [isCoverSlide]);

  useEffect(() => {
    setShowAddBlockPicker(false);
  }, [activeTab, currentIndex]);
  const activeTabMeta = useMemo(() => {
    const meta = {
      TEMPLATES: {
        eyebrow: 'Estruturas base',
        title: 'Escolha o template antes de refinar o slide.',
        scope: 'Slide atual',
      },
      IMAGE: {
        eyebrow: 'Imagem e leitura',
        title: 'Ajuste a imagem principal, o fundo e o fade.',
        scope: 'Slide atual',
      },
      BRAND: {
        eyebrow: 'Identidade visual',
        title: 'Defina cores e fontes que puxam o projeto inteiro.',
        scope: 'Global',
      },
      CONTENT: {
        eyebrow: 'Conteudo e texto',
        title: 'Edite texto, estrutura, cores de texto e numeracao.',
        scope: 'Slide atual',
      },
      REFINE: {
        eyebrow: 'Acabamento visual',
        title: 'Controle ruido, vinheta e clareza.',
        scope: 'Global + override',
      },
      ADVANCED: {
        eyebrow: 'Modo tecnico',
        title: 'Edicao direta do JSON para ajustes finos.',
        scope: 'Avancado',
      },
    } as const;

    return meta[activeTab];
  }, [activeTab]);
  const rawScriptPreview = useMemo(() => {
    const normalized = rawScriptInput.trim();
    if (!normalized) return [];

    const parsedSlides = parseRawScript(normalized);
    let previousTemplateId: string | null = null;
    let previousTemplateWeight: 'light' | 'medium' | 'heavy' | null = null;

    return parsedSlides.map((parsedSlide, index) => {
      const analysis = classifyParsedRawSlide(parsedSlide, index, parsedSlides.length);
      const selection = selectContentTemplate(analysis, {
        previousTemplateId,
        previousTemplateWeight,
        slideIndex: index,
        totalSlides: parsedSlides.length,
      });

      previousTemplateId = selection.templateId;
      previousTemplateWeight = selection.profile.visualWeight;

      return {
        index: parsedSlide.index,
        kind: parsedSlide.kind || 'slide',
        title: parsedSlide.kind === 'cover'
          ? parsedSlide.cover?.highlight
            || parsedSlide.cover?.supportTop
            || parsedSlide.cover?.supportBottom
            || 'Capa'
          : parsedSlide.titleCandidate || parsedSlide.bodyLines[0] || `Slide ${parsedSlide.index}`,
        analysis,
        selection,
      };
    });
  }, [rawScriptInput]);
  const singleSlideScriptPreview = useMemo(() => {
    const normalized = singleSlideScriptInput.trim();
    if (!normalized || !currentSlide) {
      return {
        result: null as ReturnType<typeof generateSlideFromScript> | null,
        error: null as string | null,
      };
    }

    try {
      return {
        result: generateSlideFromScript(normalized, {
          currentSlide: currentSlide as SlideDefinition,
          slideIndex: currentIndex,
          totalSlides: carousel?.slides.length,
          slides: (carousel?.slides as SlideDefinition[]) || [],
          mode: singleSlideScriptMode,
          profile: selectedClientProfile
            ? {
                avatar: selectedClientProfile.profilePicture || undefined,
                handle: selectedClientProfile.instagram || undefined,
                displayName: selectedClientProfile.name || undefined,
                meta: [selectedClientProfile.crm, selectedClientProfile.rqe].filter(Boolean).join(' • ') || undefined,
              }
            : {},
        }),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Falha ao interpretar o roteiro do slide.',
      };
    }
  }, [carousel?.slides, currentIndex, currentSlide, selectedClientProfile, singleSlideScriptInput, singleSlideScriptMode]);
  const imageConfig = useMemo(() => currentSlide?.image, [currentSlide]);
  const [activeOverlayIndex, setActiveOverlayIndex] = useState(0);
  const overlayConfigs = useMemo(() => currentSlide?.overlayImages || [], [currentSlide]);
  const activeOverlay = useMemo(() => overlayConfigs[activeOverlayIndex], [overlayConfigs, activeOverlayIndex]);
  const [editingIconBlock, setEditingIconBlock] = useState<IconEditTarget | null>(null);
  const [iconInput, setIconInput] = useState('');
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [recentIconIds, setRecentIconIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('impact-carousel-recent-icons');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const overlayImageInputRef = useRef<HTMLInputElement>(null);
  const activePalette = useMemo(() => {
    const paletteId = carousel?.brandTheme?.paletteId || activePaletteId;
    return brandPresets.find(p => p.id === paletteId);
  }, [brandPresets, activePaletteId, carousel?.brandTheme?.paletteId]);
  const currentBrandTheme = useMemo(
    () => mergeSlideOptionsWithBrandTheme(carousel?.brandTheme, undefined),
    [carousel?.brandTheme],
  );
  const currentProjectClient = useMemo(() => {
    const clientId = carousel?.brandTheme?.paletteId;
    if (!clientId) return null;

    const preset = brandPresets.find((item) => item.id === clientId);
    const fetchedProfile =
      selectedClientProfile && selectedClientProfile.id === clientId
        ? selectedClientProfile
        : null;

    if (!preset && !fetchedProfile) return null;

    return {
      id: clientId,
      name: fetchedProfile?.name || preset?.name || '',
      instagram: fetchedProfile?.instagram ?? preset?.instagram ?? null,
      profilePicture: fetchedProfile?.profilePicture ?? preset?.profile_picture ?? null,
      crm: fetchedProfile?.crm ?? preset?.crm ?? null,
      rqe: fetchedProfile?.rqe ?? preset?.rqe ?? null,
    };
  }, [brandPresets, carousel?.brandTheme?.paletteId, selectedClientProfile]);
  const currentSlideTheme = useMemo(
    () => mergeSlideOptionsWithBrandTheme(carousel?.brandTheme, currentSlide?.options, carousel?.projectFX),
    [carousel?.brandTheme, carousel?.projectFX, currentSlide?.options],
  );
  const coverLayerConfigs = useMemo(() => ([
    {
      key: 'eyebrow' as const,
      label: 'Apoio Superior',
      placeholder: 'Linha mais leve acima do destaque',
      minHeight: '96px',
    },
    {
      key: 'titleMain' as const,
      label: 'Destaque',
      placeholder: 'Massa principal da capa. Pode usar [[...]] para puxar cor da marca.',
      minHeight: '110px',
    },
    {
      key: 'supportingLine' as const,
      label: 'Apoio Inferior',
      placeholder: 'Linha de apoio abaixo do destaque',
      minHeight: '96px',
    },
  ]), []);
  const activePaletteColors = useMemo(() => {
    if (activePalette) return getBrandPaletteSwatches(activePalette);
    return getBrandPaletteSwatches(currentBrandTheme);
  }, [activePalette, currentBrandTheme]);
  const fontDebugInfo = useMemo(() => {
    const slideOptions = currentSlide?.options || {};
    const availableFamilies = [...(carousel?.customFonts || []), ...clientFonts].map((font) => font.family);
    const injectedFonts = getPreferredFontsForInjection([...(carousel?.customFonts || []), ...clientFonts], carousel?.brandTheme?.paletteId)
      .map((font) => ({
        family: font.family,
        clientId: font.clientId || null,
        url: font.url,
      }));
    const fontChecks =
      typeof document !== 'undefined' && 'fonts' in document
        ? [activePalette?.font_padrao, activePalette?.font_destaque, currentBrandTheme.fontPadrão, currentBrandTheme.fontDestaque, currentSlideTheme.fontPadrão, currentSlideTheme.fontDestaque]
            .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
            .map((family) => ({
              family,
              loaded: safeFontFaceCheck(family),
            }))
        : [];

    return {
      activePaletteId: activePalette?.id || null,
      activePaletteName: activePalette?.name || null,
      presetPrimary: activePalette?.font_padrao || null,
      presetSecondary: activePalette?.font_destaque || null,
      brandPrimary: currentBrandTheme.fontPadrão || null,
      brandSecondary: currentBrandTheme.fontDestaque || null,
      slidePrimaryOverride: slideOptions.fontPadrão ?? null,
      slideSecondaryOverride: slideOptions.fontDestaque ?? null,
      effectivePrimary: currentSlideTheme.fontPadrão || null,
      effectiveSecondary: currentSlideTheme.fontDestaque || null,
      availableFamilies,
      injectedFonts,
      fontChecks,
    };
  }, [activePalette, carousel?.brandTheme?.paletteId, carousel?.customFonts, clientFonts, currentBrandTheme.fontDestaque, currentBrandTheme.fontPadrão, currentSlide?.options, currentSlideTheme.fontDestaque, currentSlideTheme.fontPadrão]);
  const globalSpacing = useMemo(() => {
    const slides = carousel?.slides || [];
    const firstPadding = slides[0]?.options?.padding ?? 80;
    const firstBlockGap = slides[0]?.options?.blockGap ?? 24;
    const paddingIsUniform = slides.every((slide) => (slide.options?.padding ?? 80) === firstPadding);
    const blockGapIsUniform = slides.every((slide) => (slide.options?.blockGap ?? 24) === firstBlockGap);

    return {
      padding: paddingIsUniform ? firstPadding : currentSlide?.options?.padding ?? firstPadding,
      blockGap: blockGapIsUniform ? firstBlockGap : currentSlide?.options?.blockGap ?? firstBlockGap,
      paddingIsUniform,
      blockGapIsUniform,
    };
  }, [carousel?.slides, currentSlide?.options?.blockGap, currentSlide?.options?.padding]);
  const filteredBrandPresets = useMemo(() => {
    const query = brandSearchQuery.trim().toLowerCase();
    if (!query) return brandPresets;
    return brandPresets.filter((preset) => {
      const name = String(preset.name || '').toLowerCase();
      const instagram = String(preset.instagram || '').toLowerCase();
      return name.includes(query) || instagram.includes(query);
    });
  }, [brandPresets, brandSearchQuery]);
  useEffect(() => {
    setSelectedCanvasObject(null);
    setGuidedSelectedBlockIndex(null);
  }, [currentIndex]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const renderOptimizationSummary = useCallback((targets: PendingImageTarget | PendingImageTarget[]) => {
    const targetList = Array.isArray(targets) ? targets : [targets];
    if (!currentImageOptimizationSummary || !targetList.includes(currentImageOptimizationSummary.target)) {
      return null;
    }

    return (
      <section className="rounded-[28px] border border-white/8 bg-white/5 px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-brand">Última Otimização</p>
            <h3 className="text-[13px] font-black text-white">
              {getPendingImageTargetLabel(currentImageOptimizationSummary.target)} otimizada neste slide
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/6 bg-black/30 px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Antes</p>
              <p className="mt-1 text-[13px] font-black text-white">{formatImageBytes(currentImageOptimizationSummary.originalBytes)}</p>
            </div>
            <div className="rounded-2xl border border-white/6 bg-black/30 px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Depois</p>
              <p className="mt-1 text-[13px] font-black text-white">{formatImageBytes(currentImageOptimizationSummary.optimizedBytes)}</p>
            </div>
            <div className="rounded-2xl border border-white/6 bg-black/30 px-4 py-3">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Redução</p>
              <p className="mt-1 text-[13px] font-black text-brand">
                {getImageOptimizationReduction(
                  currentImageOptimizationSummary.originalBytes,
                  currentImageOptimizationSummary.optimizedBytes,
                )}
                %
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }, [currentImageOptimizationSummary]);

  const updateSlideProperties = useCallback((updates: { path: (string | number)[], value: any }[]) => {
    setDslInput(prev => {
      try {
        const parsed = JSON.parse(prev);
        if (!parsed.slides[currentIndex]) return prev;
        
        updates.forEach(({ path, value }) => {
          let target = parsed.slides[currentIndex];

          if (path[0] === 'image' && path[1] !== 'type') {
            if (!target.image) target.image = { type: 'IMAGE_BACKGROUND' };
            else if (!target.image.type) target.image.type = 'IMAGE_BACKGROUND';
          }

          for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!target[key] || typeof target[key] !== 'object') target[key] = {};
            target = target[key];
          }
          target[path[path.length - 1]] = value;
        });
        
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return prev;
      }
    });
  }, [currentIndex]);

  const updateGlobalProperty = useCallback((path: (string | number)[], value: any) => {
    setDslInput(prev => {
      try {
        const parsed = JSON.parse(prev);
        let target = parsed;
        for (let i = 0; i < path.length - 1; i++) {
          const key = path[i];
          if (!target[key] || typeof target[key] !== 'object') target[key] = {};
          target = target[key];
        }
        target[path[path.length - 1]] = value;
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return prev;
      }
    });
  }, []);

  const updateAllSlidesOption = useCallback((optionKey: 'padding' | 'blockGap', value: number) => {
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides)) return prev;

        parsed.slides = parsed.slides.map((slide: any) => ({
          ...slide,
          options: {
            ...(slide.options || {}),
            [optionKey]: value,
          },
        }));

        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
  }, []);

  const getSlideDisplayNumber = useCallback((slide: any, index: number) => {
    const explicitNumber = slide?.slideNumber;
    return typeof explicitNumber === 'number' && !Number.isNaN(explicitNumber)
      ? explicitNumber
      : index + 1;
  }, []);

  const getSlideDisplayLabel = useCallback((slide: any, index: number) => {
    if (slide?.cover) return 'Capa';
    return `Slide ${getSlideDisplayNumber(slide, index)}`;
  }, [getSlideDisplayNumber]);

  const resetSlideNumbers = useCallback(() => {
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides)) return prev;
        parsed.slides = parsed.slides.map((slide: any, index: number) => ({
          ...slide,
          slideNumber: index + 1,
        }));
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
    showToast('Numeração resetada!');
  }, [showToast]);

  const moveSlide = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides)) return prev;
        if (fromIndex < 0 || fromIndex >= parsed.slides.length) return prev;
        if (toIndex < 0 || toIndex >= parsed.slides.length) return prev;
        const [moved] = parsed.slides.splice(fromIndex, 1);
        parsed.slides.splice(toIndex, 0, moved);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
    setCurrentIndex(toIndex);
  }, []);

  const duplicateSlide = useCallback((index: number) => {
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides) || !parsed.slides[index]) return prev;
        const clone = JSON.parse(JSON.stringify(parsed.slides[index]));
        parsed.slides.splice(index + 1, 0, clone);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
    setCurrentIndex(index + 1);
    showToast('Slide duplicado!');
  }, [showToast]);

  const deleteSlide = useCallback((index: number) => {
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides) || parsed.slides.length <= 1) return prev;
        parsed.slides.splice(index, 1);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, (carousel?.slides.length ?? 1) - 2)));
  }, [carousel?.slides.length]);

  const updateSlideProperty = useCallback((path: (string | number)[], value: any) => {
    console.log('Updating slide property:', path, value);
    updateSlideProperties([{ path, value }]);
  }, [updateSlideProperties]);

  const clearPendingImageDraft = useCallback((target?: PendingImageTarget, overlayId?: string) => {
    setPendingImageDraft((draft) => {
      if (!draft) return null;
      if (target && draft.target !== target) return draft;
      if (overlayId && draft.overlayId !== overlayId) return draft;
      return null;
    });
    setIsOptimizingPendingImage(false);
  }, []);

  const guardPendingImageFlow = useCallback((message = 'Confirme a imagem pendente com "OK e otimizar" antes de sair.') => {
    if (!pendingImageDraft) return false;

    if (pendingImageDraft.slideIndex !== currentIndex) {
      setCurrentIndex(pendingImageDraft.slideIndex);
    }

    setActiveTab('IMAGE');
    showToast(message, 'error');
    return true;
  }, [currentIndex, pendingImageDraft, showToast]);

  const beginImageStaging = useCallback(async (target: PendingImageTarget, imageData: string) => {
    if (!currentSlide) return;
    const detectedFormat = detectImageFormatFromDataUrl(imageData);
    const imageDimensions = await loadImageDimensions(imageData).catch(() => null);
    const hasTransparentPixels = detectedFormat === 'png'
      ? await detectImageHasTransparency(imageData).catch(() => false)
      : false;
    const isTemplateCutout = target === 'template' && hasTransparentPixels;

    if (target === 'overlay') {
      const newOverlay: OverlayImageConfig = {
        id: crypto.randomUUID(),
        url: imageData,
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        isFlipped: false,
      };
      const nextOverlays = [...(currentSlide.overlayImages || []), newOverlay];
      updateSlideProperty(['overlayImages'], nextOverlays);
      setActiveOverlayIndex(nextOverlays.length - 1);
      setPendingImageDraft({
        dataUrl: imageData,
        target,
        slideIndex: currentIndex,
        overlayId: newOverlay.id,
      });
    } else if (target === 'background') {
      updateSlideProperty(['options', 'backgroundImage'], imageData);
      setPendingImageDraft({ dataUrl: imageData, target, slideIndex: currentIndex });
    } else if (target === 'cover-background') {
      updateSlideProperty(['cover', 'images', 'backgroundImage'], imageData);
      setPendingImageDraft({ dataUrl: imageData, target, slideIndex: currentIndex });
    } else if (target === 'cover-foreground') {
      updateSlideProperties([
        { path: ['cover', 'images', 'foregroundImage'], value: imageData },
        { path: ['cover', 'images', 'foregroundMode'], value: 'cutout' },
        { path: ['image', 'format'], value: detectedFormat },
        { path: ['image', 'isCutout'], value: true },
        { path: ['image', 'naturalWidth'], value: imageDimensions?.width },
        { path: ['image', 'naturalHeight'], value: imageDimensions?.height },
        { path: ['image', 'width'], value: currentSlide?.image?.width ?? 760 },
        { path: ['image', 'height'], value: currentSlide?.image?.height ?? 980 },
        { path: ['image', 'backgroundOpacity'], value: currentSlide?.image?.backgroundOpacity ?? 0.98 },
      ]);
      setPendingImageDraft({ dataUrl: imageData, target, slideIndex: currentIndex, isCutout: true });
    } else {
      updateSlideProperties([
        { path: ['image', 'url'], value: imageData },
        { path: ['image', 'format'], value: detectedFormat },
        { path: ['image', 'isCutout'], value: isTemplateCutout },
        { path: ['image', 'naturalWidth'], value: imageDimensions?.width },
        { path: ['image', 'naturalHeight'], value: imageDimensions?.height },
      ]);
      setPendingImageDraft({ dataUrl: imageData, target, slideIndex: currentIndex, isCutout: isTemplateCutout });
    }

    setActiveTab('IMAGE');
    showToast(`Ajuste ${getPendingImageTargetLabel(target)} e confirme em "OK e otimizar".`);
  }, [currentIndex, currentSlide, showToast, updateSlideProperties, updateSlideProperty]);

  const confirmPendingImageDraft = useCallback(async () => {
    if (!pendingImageDraft) return;

    if (pendingImageDraft.slideIndex !== currentIndex) {
      setCurrentIndex(pendingImageDraft.slideIndex);
      setActiveTab('IMAGE');
      showToast('Voltei para o slide da imagem pendente. Confirme por aqui.', 'error');
      return;
    }

    setIsOptimizingPendingImage(true);
    try {
      const originalBytes = estimateDataUrlBytes(pendingImageDraft.dataUrl);
      const optimizedImage = await optimizeImageDataUrl(pendingImageDraft.dataUrl, {
        target: pendingImageDraft.target,
      });
      const optimizedDimensions = await loadImageDimensions(optimizedImage).catch(() => null);
      const optimizedBytes = estimateDataUrlBytes(optimizedImage);

      if (pendingImageDraft.target === 'overlay') {
        const nextOverlays = (currentSlide?.overlayImages || []).map((overlay) => (
          overlay.id === pendingImageDraft.overlayId
            ? { ...overlay, url: optimizedImage }
            : overlay
        ));
        updateSlideProperty(['overlayImages'], nextOverlays);
      } else if (pendingImageDraft.target === 'background') {
        updateSlideProperty(['options', 'backgroundImage'], optimizedImage);
        setUploadedBackgrounds((prev) => [...new Set([...prev, optimizedImage])]);
      } else if (pendingImageDraft.target === 'cover-background') {
        updateSlideProperty(['cover', 'images', 'backgroundImage'], optimizedImage);
      } else if (pendingImageDraft.target === 'cover-foreground') {
        updateSlideProperties([
          { path: ['cover', 'images', 'foregroundImage'], value: optimizedImage },
          { path: ['image', 'format'], value: detectImageFormatFromDataUrl(pendingImageDraft.dataUrl) },
          { path: ['image', 'isCutout'], value: true },
          { path: ['image', 'naturalWidth'], value: optimizedDimensions?.width },
          { path: ['image', 'naturalHeight'], value: optimizedDimensions?.height },
        ]);
      } else {
        updateSlideProperties([
          { path: ['image', 'url'], value: optimizedImage },
          { path: ['image', 'format'], value: detectImageFormatFromDataUrl(pendingImageDraft.dataUrl) },
          { path: ['image', 'isCutout'], value: Boolean(pendingImageDraft.isCutout) },
          { path: ['image', 'naturalWidth'], value: optimizedDimensions?.width },
          { path: ['image', 'naturalHeight'], value: optimizedDimensions?.height },
        ]);
      }

      setLastImageOptimizationSummary({
        slideIndex: pendingImageDraft.slideIndex,
        target: pendingImageDraft.target,
        originalBytes,
        optimizedBytes,
      });
      setPendingImageDraft(null);
      showToast(`Imagem otimizada em WebP para ${getPendingImageTargetLabel(pendingImageDraft.target)}.`);
    } catch (error) {
      console.error('Erro ao otimizar imagem pendente', error);
      showToast('Falha ao otimizar a imagem. Tente novamente.', 'error');
    } finally {
      setIsOptimizingPendingImage(false);
    }
  }, [currentIndex, currentSlide?.overlayImages, pendingImageDraft, showToast, updateSlideProperties, updateSlideProperty]);

  const updateTextBlockFromEditor = useCallback((blockIndex: number, value: string, meta?: { manualBreakIntent?: boolean }) => {
    if (!currentSlide) return;

    const nextBlocks = [...currentSlide.blocks];
    const targetBlock = nextBlocks[blockIndex];
    if (!targetBlock) return;

    nextBlocks[blockIndex] = targetBlock.type === 'LIST'
      ? { ...targetBlock, content: value.split('\n') }
      : updateTextBlockFromEditorValue(targetBlock, value, meta);

    updateSlideProperty(['blocks'], nextBlocks);
  }, [currentSlide, updateSlideProperty]);

  const appendNewBlockOfType = useCallback((type: NewBlockType) => {
    if (!currentSlide || currentSlide.cover) return;

    const nextBlock = createDefaultBlockForType(type, type === 'USER'
      ? {
          displayName: selectedClientProfile?.name,
          handle: selectedClientProfile?.instagram,
          avatar: selectedClientProfile?.profilePicture,
        }
      : undefined);

    updateSlideProperty(['blocks'], [...(currentSlide.blocks || []), nextBlock]);
    setShowAddBlockPicker(false);

    const selectedOption = newBlockOptions.find((option) => option.type === type);
    showToast(`${selectedOption?.label || 'Bloco'} adicionado!`);
  }, [currentSlide, newBlockOptions, selectedClientProfile?.instagram, selectedClientProfile?.name, selectedClientProfile?.profilePicture, showToast, updateSlideProperty]);

  const openIconEditor = useCallback((block: Block, blockIndex: number, itemIndex?: number) => {
    const target: IconEditTarget = {
      block,
      blockIndex,
      itemIndex,
    };
    const currentSelection = resolveIconEditSelection(target);
    setIconInput(currentSelection.customIcon);
    setIconSearchQuery('');
    setEditingIconBlock(target);
  }, []);
  const currentEditingIconSelection = useMemo(
    () => editingIconBlock ? resolveIconEditSelection(editingIconBlock) : { icon: '', customIcon: '' },
    [editingIconBlock],
  );
  const filteredLucideIcons = useMemo(
    () => searchLucideIcons(iconSearchQuery),
    [iconSearchQuery],
  );
  const recentLucideIcons = useMemo(
    () => recentIconIds
      .map((iconId) => filteredLucideIcons.find((icon) => icon.id === iconId) || searchLucideIcons(iconId).find((icon) => icon.id === iconId))
      .filter((icon): icon is NonNullable<typeof icon> => Boolean(icon)),
    [filteredLucideIcons, recentIconIds],
  );
  const rememberRecentIcon = useCallback((iconId: string) => {
    setRecentIconIds((prev) => {
      const next = pushRecentIconId(prev, iconId);
      try {
        window.localStorage.setItem('impact-carousel-recent-icons', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const markHistoryMerge = useCallback((key: string) => {
    pendingHistoryMergeKeyRef.current = key;
  }, []);

  const endHistoryMerge = useCallback(() => {
    activeHistoryMergeKeyRef.current = null;
  }, []);

  const applySlideCompositionSelection = useCallback((
    nextContentTemplateId?: string,
    nextImageLayoutId?: string,
    nextHeroVariant?: 'default' | 'social',
  ) => {
    if (!currentSlide) return;

    const resolvedComposition = resolveSlideComposition(currentSlide as any);
    const contentTemplateId = nextContentTemplateId ?? resolvedComposition.contentTemplateId;
    const imageLayoutId = nextImageLayoutId ?? resolvedComposition.imageLayoutId;
    const resolvedHeroVariant = contentTemplateId === 'HERO' && imageLayoutId === 'IMAGE_NONE'
      ? (nextHeroVariant ?? currentSlide.options?.heroVariant ?? 'default')
      : 'default';
    const preparedSlide = applyHeroVariantToSlide(
      currentSlide as SlideDefinition,
      resolvedHeroVariant,
      currentProjectClient,
    );
    const nextImageConfig = createImageConfigFromLayout(imageLayoutId, currentSlide.image);
    const optionOverrides = createOptionOverridesFromImageLayout(imageLayoutId);
    const nextHorizontalAlign = optionOverrides.contentHorizontalAlign
      || preparedSlide.options?.contentHorizontalAlign
      || currentSlide.options?.contentHorizontalAlign
      || 'center';
    const nextVerticalAlign = optionOverrides.contentVerticalAlign
      || preparedSlide.options?.contentVerticalAlign
      || currentSlide.options?.contentVerticalAlign
      || 'center';
    const nextBlocks = resolvedHeroVariant === 'social'
      ? preparedSlide.blocks
      : alignBlocksForSlideLayout(preparedSlide.blocks, nextHorizontalAlign);

    updateSlideProperties([
      { path: ['contentTemplate'], value: contentTemplateId },
      { path: ['imageLayout'], value: imageLayoutId },
      { path: ['template'], value: contentTemplateId },
      { path: ['image'], value: nextImageConfig?.type === 'NONE' && currentSlide.image?.url ? { ...currentSlide.image, type: 'NONE' } : nextImageConfig },
      { path: ['blocks'], value: nextBlocks },
      { path: ['options', 'heroVariant'], value: preparedSlide.options?.heroVariant },
      { path: ['options', 'contentHorizontalAlign'], value: nextHorizontalAlign },
      { path: ['options', 'contentVerticalAlign'], value: nextVerticalAlign },
      { path: ['options', 'boxGroupAlign'], value: nextHorizontalAlign },
      ...Object.entries(optionOverrides).map(([key, value]) => ({ path: ['options', key], value })),
    ]);
  }, [currentProjectClient, currentSlide, updateSlideProperties]);

  const applyVisibleContentTemplateSelection = useCallback((option: VisibleContentTemplateOption) => {
    if (option.heroVariant === 'social') {
      applySlideCompositionSelection(option.contentTemplateId, 'IMAGE_NONE', 'social');
      return;
    }

    if (option.contentTemplateId === 'HERO') {
      applySlideCompositionSelection(option.contentTemplateId, undefined, 'default');
      return;
    }

    applySlideCompositionSelection(option.contentTemplateId, undefined);
  }, [applySlideCompositionSelection]);

  const applyImageLayoutFamilySelection = useCallback((familyId: string, nextDirection?: 'left' | 'right' | 'top' | 'bottom' | 'center') => {
    const family = imageLayoutFamilies.find((entry) => entry.id === familyId);
    if (!family) return;

    const nextLayoutId = resolveImageLayoutIdForFamilySelection(
      family,
      nextDirection,
      currentImageLayoutDirection,
    );

    applySlideCompositionSelection(undefined, nextLayoutId, familyId === 'none' || nextLayoutId === 'IMAGE_NONE' ? 'default' : undefined);
  }, [applySlideCompositionSelection, currentImageLayoutDirection, imageLayoutFamilies]);

  const undoLastAction = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    isApplyingHistoryRef.current = true;
    activeHistoryMergeKeyRef.current = null;
    setDslInput(historyStackRef.current[historyIndexRef.current]);
    showToast('Ação desfeita.');
  }, [showToast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageData = await readFileAsDataUrl(file);
      await beginImageStaging('template', imageData);
    } catch {
      showToast('Falha ao carregar a imagem do template.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleOverlayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageData = await readFileAsDataUrl(file);
      await beginImageStaging('overlay', imageData);
    } catch {
      showToast('Falha ao carregar o overlay.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageData = await readFileAsDataUrl(file);
      await beginImageStaging('background', imageData);
    } catch {
      showToast('Falha ao carregar o background.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageData = await readFileAsDataUrl(file);
      await beginImageStaging('cover-background', imageData);
    } catch {
      showToast('Falha ao carregar o fundo da capa.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverForegroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageData = await readFileAsDataUrl(file);
      await beginImageStaging('cover-foreground', imageData);
    } catch {
      showToast('Falha ao carregar a imagem destaque da capa.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!supabase) {
      showToast('Supabase não configurado localmente.', 'error');
      return;
    }
    const allowedExtensions = ['.ttf', '.otf', '.woff2'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      showToast("Formato não suportado. Use .ttf, .otf ou .woff2", "error");
      return;
    }
    setIsUploadingFont(true);
    try {
      const sanitizedName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const fileName = `${Date.now()}_${sanitizedName}`;
      const { data, error } = await supabase.storage.from('fonts').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('fonts').getPublicUrl(data.path);
      const fontFamily = file.name.split('.')[0].trim();
      const newFont: CustomFont = { id: crypto.randomUUID(), name: file.name.split('.')[0], family: fontFamily, url: publicUrl };
      const nextFonts = [...(carousel?.customFonts || []), newFont];
      updateGlobalProperty(['customFonts'], nextFonts);
      showToast("Fonte sincronizada com sucesso!");
    } catch (err: any) {
      console.error("Font upload error:", err);
      showToast("Erro ao subir para o bucket 'fonts'.", "error");
    } finally {
      setIsUploadingFont(false);
      if (fontInputRef.current) fontInputRef.current.value = '';
    }
  };

  const handleRemoveCustomFont = (fontId: string) => {
    const nextFonts = (carousel?.customFonts || []).filter(f => f.id !== fontId);
    updateGlobalProperty(['customFonts'], nextFonts);
    showToast("Fonte removida da biblioteca.");
  };

  const processProjectFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const result = carouselSchema.safeParse(parsed);
        if (result.success) {
          const normalizedContent = JSON.stringify(result.data, null, 2);
          setDslInput(normalizedContent);
          setCarousel(result.data);
          setCurrentIndex(0);
          setPendingImageDraft(null);
          setError(null);
          setSelectedCanvasObject(null);
          setGuidedSelectedBlockIndex(null);
          setHasEnteredGuidedFlow(true);
          setStudioMode('advanced');
          setActiveTab('IMAGE');
          showToast("Projeto importado com sucesso!");
        } else {
          showToast("Arquivo JSON inválido.", "error");
        }
      } catch (err) {
        showToast("Falha ao ler o arquivo.", "error");
      }
    };
    reader.readAsText(file);
  }, [setDslInput, setCurrentIndex, showToast]);

  const handleGenerateFromRawScript = useCallback(() => {
    if (!rawScriptInput.trim()) {
      showToast('Cole um roteiro com pelo menos um slide.', 'error');
      return false;
    }

    try {
      const generated = buildCarouselFromScript(rawScriptInput);
      const existing = JSON.parse(dslInput || '{}');
      const nextProject = {
        slides: generated.slides,
        customFonts: existing.customFonts,
        brandTheme: existing.brandTheme,
        projectFX: existing.projectFX,
      };
      const result = carouselSchema.safeParse(nextProject);

      if (!result.success) {
        showToast('Falha ao gerar um JSON válido para o carrossel.', 'error');
        return false;
      }

      setDslInput(JSON.stringify(result.data, null, 2));
      setCurrentIndex(0);
      setPendingImageDraft(null);
      setShowScriptComposerModal(false);
      setActiveTab('CONTENT');
      showToast(`Carrossel gerado com ${result.data.slides.length} slides!`);
      return true;
    } catch {
      showToast('Falha ao processar o roteiro bruto.', 'error');
      return false;
    }
  }, [dslInput, rawScriptInput, showToast]);

  const handleGenerateCurrentSlideFromScript = useCallback(() => {
    if (!currentSlide) {
      showToast('Nenhum slide selecionado.', 'error');
      return;
    }

    if (!singleSlideScriptInput.trim()) {
      showToast('Cole um roteiro para este slide.', 'error');
      return;
    }

    try {
      const generated = generateSlideFromScript(singleSlideScriptInput, {
        currentSlide: currentSlide as SlideDefinition,
        slideIndex: currentIndex,
        totalSlides: carousel?.slides.length,
        slides: (carousel?.slides as SlideDefinition[]) || [],
        mode: singleSlideScriptMode,
        profile: selectedClientProfile
          ? {
              avatar: selectedClientProfile.profilePicture || undefined,
              handle: selectedClientProfile.instagram || undefined,
              displayName: selectedClientProfile.name || undefined,
              meta: [selectedClientProfile.crm, selectedClientProfile.rqe].filter(Boolean).join(' • ') || undefined,
            }
          : {},
      });

      setDslInput((prev) => {
        try {
          const parsed = JSON.parse(prev || '{}');
          if (!Array.isArray(parsed.slides) || !parsed.slides[currentIndex]) return prev;
          parsed.slides[currentIndex] = generated.slide;
          return JSON.stringify(parsed, null, 2);
        } catch {
          return prev;
        }
      });

      setShowSingleSlideScriptModal(false);
      setSingleSlideScriptInput('');
      const warningSuffix = generated.warnings.length > 0 ? ` ${generated.warnings[0]}` : '';
      showToast(
        `${isCoverSlide ? 'Capa' : `Slide ${getSlideDisplayNumber(currentSlide, currentIndex)}`} ${singleSlideScriptMode === 'patch' ? 'ajustado' : 'substituído'} por roteiro.${warningSuffix}`.trim(),
      );
    } catch {
      showToast('Falha ao processar o roteiro deste slide.', 'error');
    }
  }, [
    carousel?.slides,
    currentIndex,
    currentSlide,
    getSlideDisplayNumber,
    isCoverSlide,
    selectedClientProfile,
    showToast,
    singleSlideScriptInput,
    singleSlideScriptMode,
  ]);

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processProjectFile(file);
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processProjectFile(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              if (editingIconBlock) {
                updateSlideProperties(buildIconEditUpdates(editingIconBlock, {
                  customIcon: result,
                  icon: undefined,
                }));
                showToast("Ícone personalizado colado!");
              } else {
                // Smart paste: if non-cover slide has no template image, skip the modal
                if (!isCoverSlide && !currentSlide?.image?.url) {
                  void beginImageStaging('template', result);
                } else {
                  setPendingPastedImage(result);
                  setShowPasteTargetModal(true);
                }
              }
            }
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [updateSlideProperties, editingIconBlock, showToast]);

  useEffect(() => {
    const isEditableElement = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tagName = element.tagName;
      return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
      if (isUndo) {
        event.preventDefault();
        undoLastAction();
        return;
      }

      if (isEditableElement(event.target) || !selectedCanvasObject || selectedCanvasObject.type !== 'IMAGE_BOX') {
        return;
      }

      const movementByKey: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };

      const movement = movementByKey[event.key];
      if (!movement) return;

      event.preventDefault();
      if (selectedCanvasObject.mode === 'image') {
        updateSlideProperties([
          { path: ['image', 'imageX'], value: (currentSlide?.image?.imageX || 0) + movement.dx },
          { path: ['image', 'imageY'], value: (currentSlide?.image?.imageY || 0) + movement.dy },
        ]);
        return;
      }

      updateSlideProperties([
        { path: ['image', 'boxX'], value: (currentSlide?.image?.boxX || 0) + movement.dx },
        { path: ['image', 'boxY'], value: (currentSlide?.image?.boxY || 0) + movement.dy },
      ]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide?.image?.boxX, currentSlide?.image?.boxY, currentSlide?.image?.imageX, currentSlide?.image?.imageY, selectedCanvasObject, undoLastAction, updateSlideProperties]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIsDebugMode(params.get('debug') === '1');
  }, []);

  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/branding');
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const { clients: clientPresets, fonts: fetchedFonts } = await response.json();

      console.log('Loaded Clients:', clientPresets.length);
      console.log('Loaded Fonts:', fetchedFonts.length);
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1') {
        console.table(clientPresets.map((preset: any) => ({
          id: preset.id,
          name: preset.name,
          font_padrao: preset.font_padrao,
          font_destaque: preset.font_destaque,
        })));
        console.table(fetchedFonts.map((font: any) => ({
          family: font.family,
          name: font.name,
        })));
      }

      setClientFonts(fetchedFonts);
      setBrandPresets(
        [...DEFAULT_BRAND_PRESETS, ...clientPresets].map((preset) => ({
          ...preset,
          colors: preset.colors || getBrandPaletteSwatches(preset),
        })),
      );
      showToast(`Carregados ${clientPresets.length} marcas e ${fetchedFonts.length} fontes!`);

    } catch (err: any) {
      console.error("Load failed", err);
      showToast(`Erro ao carregar dados: ${err.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (carousel?.brandTheme?.paletteId) {
      setActivePaletteId(carousel.brandTheme.paletteId);
    }
  }, [carousel?.brandTheme?.paletteId]);
  useEffect(() => {
    if (!carousel?.brandTheme || clientFonts.length === 0) return;

    const resolvedTheme = syncBrandThemeFontFamilies(
      carousel.brandTheme,
      [...(carousel.customFonts || []), ...clientFonts],
    );

    if (
      resolvedTheme.fontPadrão === carousel.brandTheme.fontPadrão &&
      resolvedTheme.fontDestaque === carousel.brandTheme.fontDestaque
    ) {
      return;
    }

    updateGlobalProperty(['brandTheme'], resolvedTheme);
  }, [carousel?.brandTheme, carousel?.customFonts, clientFonts, updateGlobalProperty]);
  useEffect(() => {
    const clientId = carousel?.brandTheme?.paletteId;
    const isDefaultPreset = DEFAULT_BRAND_PRESETS.some((preset) => preset.id === clientId);

    if (!clientId || isDefaultPreset) {
      setSelectedClientProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/client/${clientId}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const client = await response.json();
        if (cancelled) return;

        setSelectedClientProfile({
          id: client.id,
          name: client.name || '',
          instagram: client.instagram || null,
          profilePicture: client.profile_picture || null,
          crm: client.crm || null,
          rqe: client.rqe || null,
        });
      } catch (error) {
        if (!cancelled) {
          setSelectedClientProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carousel?.brandTheme?.paletteId]);
  useEffect(() => {
    if (!currentProjectClient) return;

    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        if (!Array.isArray(parsed.slides)) return prev;

        let changed = false;
        parsed.slides = parsed.slides.map((slide: any) => {
          const syncedSlide = applyProjectClientToSlide(slide, currentProjectClient);
          if (syncedSlide !== slide) changed = true;
          return syncedSlide;
        });

        return changed ? JSON.stringify(parsed, null, 2) : prev;
      } catch {
        return prev;
      }
    });
  }, [currentProjectClient]);

  // Inject custom fonts into document
  useEffect(() => {
    const styleId = 'dynamic-fonts';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const customFonts = carousel?.customFonts || [];
    const allFonts = [...customFonts, ...clientFonts];
    const preferredFonts = getPreferredFontsForInjection(allFonts, carousel?.brandTheme?.paletteId);
    
    console.log('Injecting fonts:', preferredFonts.map(f => `${f.family}${f.clientId ? ` (${f.clientId})` : ''}`));

    const css = preferredFonts.map(font => {
      const definition = getFontFaceDefinition(font);
      return `
        @font-face {
          font-family: '${definition.family}';
          src: url('${definition.url}') ${definition.format};
          font-weight: ${definition.weight};
          font-style: ${definition.style};
          font-display: swap;
        }
      `;
    }).join('\n');

    styleEl.textContent = css;
  }, [carousel?.brandTheme?.paletteId, carousel?.customFonts, clientFonts]);

  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }

    const currentSnapshot = historyStackRef.current[historyIndexRef.current];
    if (dslInput === currentSnapshot) return;

    const mergeKey = pendingHistoryMergeKeyRef.current;
    pendingHistoryMergeKeyRef.current = null;

    if (mergeKey && activeHistoryMergeKeyRef.current === mergeKey && historyIndexRef.current > 0) {
      historyStackRef.current[historyIndexRef.current] = dslInput;
      return;
    }

    historyStackRef.current = [
      ...historyStackRef.current.slice(0, historyIndexRef.current + 1),
      dslInput,
    ].slice(-120);
    historyIndexRef.current = historyStackRef.current.length - 1;
    activeHistoryMergeKeyRef.current = mergeKey || null;
  }, [dslInput]);

  const handleRender = useCallback(() => {
    try {
      const parsed = JSON.parse(dslInput);
      const result = carouselSchema.safeParse(parsed);
      if (result.success) {
        setCarousel(result.data);
        setError(null);
      } else {
        setError(result.error.issues.map(e => `[${e.path.join(' → ')}]: ${e.message}`).join('\n'));
      }
    } catch (e: any) {
      setError(`Sintaxe: ${e.message}`);
    }
  }, [dslInput]);

  useEffect(() => { handleRender(); }, [handleRender]);

  useEffect(() => {
    if (!carousel || !canvasRef.current || !currentSlide) return;
    if (selectedCanvasObject?.type === 'IMAGE_BOX') return;

    const frame = window.requestAnimationFrame(() => {
      setDslInput((prev) => {
        try {
          const parsed = JSON.parse(prev);
          const slide = parsed.slides?.[currentIndex];
          if (!slide || !Array.isArray(slide.blocks)) return prev;

          const wrappers = Array.from(
            canvasRef.current?.querySelectorAll<HTMLElement>('.render-block-wrapper[data-block-index]') || [],
          );

          let changed = false;

          wrappers.forEach((wrapper) => {
            const blockIndex = Number(wrapper.dataset.blockIndex);
            if (Number.isNaN(blockIndex)) return;

            const block = slide.blocks[blockIndex];
            if (!block) return;
            if (!supportsAutoBreakPreviewSync(block)) return;

            const renderedElement = wrapper.firstElementChild as HTMLElement | null;
            if (!renderedElement) return;

            const nextBlock = syncAutoBreakPreviewForBlock(block, renderedElement.innerText || '');
            if (nextBlock === block) return;

            slide.blocks[blockIndex] = nextBlock;
            changed = true;
          });

          return changed ? JSON.stringify(parsed, null, 2) : prev;
        } catch {
          return prev;
        }
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [carousel, currentIndex, currentSlide, currentSlideTheme.fontPadrão, currentSlideTheme.fontDestaque, currentSlideTheme.background, currentSlideTheme.text, currentSlideTheme.accent, selectedCanvasObject]);



  const startBatchExport = async () => {
    if (!carousel || !canvasRef.current || isExporting || selectedSlidesToExport.size === 0) return;
    if (guardPendingImageFlow('Confirme a imagem pendente antes de exportar.')) return;
    setShowExportModal(false);
    const originalIndex = currentIndex;
    const exportIndices = Array.from(selectedSlidesToExport).sort((a, b) => Number(a) - Number(b));
    const images: { name: string; dataUrl: string }[] = [];
    setIsExporting(true);
    try {
      const total = exportIndices.length;
      for (let i = 0; i < total; i++) {
        const slideIdx = exportIndices[i];
        setExportStatus(`Renderizando: ${i + 1}/${total}`);
        setExportProgress(Math.round(((i + 1) / total) * 100));
        setCurrentIndex(slideIdx);
        await new Promise(resolve => setTimeout(resolve, 850));
        const dataUrl = await captureJpeg(canvasRef.current);
        images.push({ name: `slide-${(i + 1).toString().padStart(2, '0')}.jpg`, dataUrl });
      }
      setExportStatus('Comprimindo ZIP...');
      await downloadZip(images, `impact-carousel-${Date.now()}.zip`, dslInput);
      setExportStatus('Sucesso!');
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setCurrentIndex(originalIndex);
      }, 1500);
    } catch (err) {
      setError('Erro crítico na exportação.');
      setIsExporting(false);
      setCurrentIndex(originalIndex);
    }
  };

  const handleApplyPalettePreset = (preset: any) => {
    setActivePaletteId(preset.id);
    setBrandSearchQuery('');
    try {
      window.localStorage.setItem('impact-carousel-last-client', preset.id);
    } catch {}
    setDslInput((prev) => {
      try {
        const parsed = JSON.parse(prev);
        const previousTheme = parsed.brandTheme || null;
        const nextTheme = createBrandThemeFromPreset(preset, [...(carousel?.customFonts || []), ...clientFonts]);
        if (isDebugMode) {
          console.log('Applying preset debug', {
            preset,
            previousTheme,
            nextTheme,
            availableFonts: [...(carousel?.customFonts || []), ...clientFonts].map((font) => font.family),
          });
        }

        parsed.brandTheme = nextTheme;
        if (Array.isArray(parsed.slides)) {
          parsed.slides = applyBrandThemeToSlides(parsed.slides, previousTheme);
        }

        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
  };

  const handleCreatePalette = async () => {
    if (!newPaletteData.name.trim()) return;
    if (!supabase) {
      showToast('Supabase não configurado localmente.', 'error');
      return;
    }
    setIsSyncing(true);
    const presetData = {
      name: newPaletteData.name,
      colors: newPaletteData.colors,
      font_padrao: newPaletteData.font_padrao,
      font_destaque: newPaletteData.font_destaque,
      defaults: {
        bg: newPaletteData.colors[0],
        text: newPaletteData.colors[1],
        accent: newPaletteData.colors[2],
        hlBgColor: newPaletteData.colors[3],
        cardBg: newPaletteData.colors[4],
      }
    };
    try {
      if (editingPaletteId) {
        const { error: updateError } = await supabase.from('brand_palettes').update(presetData).eq('id', editingPaletteId);
        if (updateError) throw updateError;
        showToast("Branding atualizado!");
      } else {
        const { error: insertError } = await supabase.from('brand_palettes').insert([{ ...presetData, id: crypto.randomUUID() }]);
        if (insertError) throw insertError;
        showToast("Marca criada!");
      }
    } catch (err: any) {
      console.error("Supabase error", err);
      showToast("Erro ao sincronizar marca.", "error");
    } finally {
      setIsCreatingPalette(false);
      setEditingPaletteId(null);
      setNewPaletteData({ name: '', colors: ['#0D0D0D', '#FFFFFF', '#1fb2f7', '#1fb2f7', '#1fb2f7'], font_padrao: 'Inter', font_destaque: 'Instrument Serif' });
      loadData();
      setIsSyncing(false);
    }
  };

  const handleEditPalette = (e: React.MouseEvent, preset: any) => {
    e.stopPropagation();
    setEditingPaletteId(preset.id);
    setNewPaletteData({ name: preset.name, colors: preset.colors, font_padrao: preset.font_padrao || 'Inter', font_destaque: preset.font_destaque || 'Instrument Serif' });
    setIsCreatingPalette(true);
  };

  const allFontOptions = useMemo(() => {
    const custom = (carousel?.customFonts || []).map(f => ({ id: f.family, label: `${f.name} (Custom)` }));
    const client = clientFonts.map(f => ({ id: f.family, label: `${f.name} (Client)` }));
    const all = [...GOOGLE_FONTS, ...custom, ...client];
    const unique = new Map();
    all.forEach((font) => {
      const key = normalizeFontFamilyName(font.id);
      if (!key || unique.has(key)) return;
      unique.set(key, font);
    });
    const result = Array.from(unique.values());
    console.log('All Font Options:', result);
    return result;
  }, [carousel?.customFonts, clientFonts]);

  const applyGuidedDensity = useCallback((density: GuidedDensity) => {
    setGuidedDensity(density);
    const densityMap = {
      compact: { padding: 68, blockGap: 18 },
      balanced: { padding: 84, blockGap: 24 },
      airy: { padding: 108, blockGap: 32 },
    };
    const next = densityMap[density];
    updateAllSlidesOption('padding', next.padding);
    updateAllSlidesOption('blockGap', next.blockGap);
  }, [updateAllSlidesOption]);

  const applyGuidedContrast = useCallback((contrast: GuidedContrast) => {
    setGuidedContrast(contrast);
    const fxMap = {
      soft: { noiseAmount: carousel?.projectFX?.noiseAmount ?? 0.02, vignette: 0.04 },
      medium: { noiseAmount: carousel?.projectFX?.noiseAmount ?? 0.04, vignette: 0.12 },
      strong: { noiseAmount: carousel?.projectFX?.noiseAmount ?? 0.06, vignette: 0.22 },
    };
    updateGlobalProperty(['projectFX'], fxMap[contrast]);
  }, [carousel?.projectFX?.noiseAmount, updateGlobalProperty]);

  const applyGuidedVisualPreset = useCallback((presetId: typeof VISUAL_PRESETS[number]['id']) => {
    const preset = VISUAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setGuidedDensity(preset.density);
    setGuidedContrast(preset.contrast);
    updateAllSlidesOption('padding', preset.options.padding);
    updateAllSlidesOption('blockGap', preset.options.blockGap);
    if (preset.options.background) updateGlobalProperty(['brandTheme', 'background'], preset.options.background);
    if (preset.options.text) updateGlobalProperty(['brandTheme', 'text'], preset.options.text);
    if (preset.options.accent) {
      updateGlobalProperty(['brandTheme', 'accent'], preset.options.accent);
      updateGlobalProperty(['brandTheme', 'hlBgColor'], preset.options.accent);
      updateGlobalProperty(['brandTheme', 'cardBg'], preset.options.accent);
    }
    if (preset.options.cardOpacity !== undefined) updateGlobalProperty(['brandTheme', 'cardOpacity'], preset.options.cardOpacity);
    showToast(`Visual ${preset.label} aplicado.`);
  }, [showToast, updateAllSlidesOption, updateGlobalProperty]);

  const applyGuidedFinishPreset = useCallback((presetId: typeof FINISH_PRESETS[number]['id']) => {
    const preset = FINISH_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    if (guidedFinishScope === 'current' && currentSlide) {
      updateSlideProperties([
        { path: ['options', 'postFX', 'noiseAmount'], value: preset.projectFX.noiseAmount },
        { path: ['options', 'postFX', 'vignette'], value: preset.projectFX.vignette },
      ]);
    } else {
      updateGlobalProperty(['projectFX'], preset.projectFX);
    }
    showToast(`Acabamento ${preset.label} aplicado.`);
  }, [currentSlide, guidedFinishScope, showToast, updateGlobalProperty, updateSlideProperties]);

  const guidedReviewIssues = useMemo(() => {
    const slidesWithFit = (carousel?.slides || []).map((slide) => {
      if (slide.cover) return slide;
      const fit = evaluateSlideLayoutFit(slide as SlideDefinition);
      return { ...slide, layoutStatus: fit.status };
    });
    return getGuidedReviewIssues(slidesWithFit as any);
  }, [carousel?.slides]);

  const guidedScriptSummary = useMemo(
    () => getGuidedScriptSummary((carousel?.slides as SlideDefinition[]) || []),
    [carousel?.slides],
  );

  const guidedStepIndex = GUIDED_STEPS.findIndex((step) => step.id === guidedStep);
  const goToGuidedStep = useCallback((stepId: GuidedStepId) => {
    setHasEnteredGuidedFlow(true);
    setGuidedStep(stepId);
  }, []);

  const goToNextGuidedStep = useCallback(() => {
    const next = GUIDED_STEPS[Math.min(GUIDED_STEPS.length - 1, guidedStepIndex + 1)];
    if (next) setGuidedStep(next.id);
  }, [guidedStepIndex]);

  const goToPreviousGuidedStep = useCallback(() => {
    const previous = GUIDED_STEPS[Math.max(0, guidedStepIndex - 1)];
    if (previous) setGuidedStep(previous.id);
  }, [guidedStepIndex]);

  const handleCreateGuidedCarousel = useCallback(() => {
    const wasGenerated = handleGenerateFromRawScript();
    if (!wasGenerated) return;

    setHasEnteredGuidedFlow(true);
    setGuidedStep('images');
  }, [handleGenerateFromRawScript]);

  const useLastClient = useCallback(() => {
    try {
      const lastClientId = window.localStorage.getItem('impact-carousel-last-client');
      const preset = brandPresets.find((item) => item.id === lastClientId);
      if (!preset) {
        showToast('Nenhum ultimo cliente encontrado.', 'error');
        return;
      }
      handleApplyPalettePreset(preset);
      showToast(`Cliente ${preset.name} aplicado.`);
    } catch {
      showToast('Nao foi possivel recuperar o ultimo cliente.', 'error');
    }
  }, [brandPresets, showToast]);

  const renderGuidedWordmark = (large = false) => (
    <div className="flex items-center gap-3">
      <img src={LOGO_URL} className={`${large ? 'h-11' : 'h-7'} w-auto object-contain`} />
      <div className={`${large ? 'text-[11px]' : 'text-[8px]'} font-black uppercase tracking-[0.24em] text-zinc-500`}>
        Studio
      </div>
    </div>
  );

  const renderClientAvatar = (
    source: {
      name?: string | null;
      profile_picture?: string | null;
      profilePicture?: string | null;
    },
    sizeClass: string,
    textClass: string,
    accent: string,
  ) => {
    const photo = source.profile_picture || source.profilePicture;
    const initials = String(source.name || 'ID')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLowerCase();

    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full border bg-black/40`} style={{ borderColor: accent }}>
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center font-black text-white ${textClass}`}>
            {initials}
          </div>
        )}
      </div>
    );
  };

  const guidedCardSurface = 'bg-[#101820]';
  const guidedPanelSurface = 'bg-[#0b1118]';
  const guidedCardHoverSurface = 'hover:bg-[#121d27]';
  const guidedCardGlow = 'shadow-[0_10px_34px_rgba(0,0,0,0.24)]';
  const guidedCardGlowHover = 'hover:shadow-[0_16px_48px_rgba(0,173,239,0.14)]';
  const guidedPanelGlow = 'shadow-[0_18px_52px_rgba(0,0,0,0.32)]';
  const guidedCardChrome = `border-[#182432] ${guidedCardSurface} ${guidedCardGlow}`;
  const guidedInteractiveCardChrome = `${guidedCardChrome} ${guidedCardHoverSurface} hover:border-[#00adef]/70 ${guidedCardGlowHover}`;
  const guidedPanelChrome = `border-[#172230] ${guidedPanelSurface} ${guidedPanelGlow}`;

  const renderGuidedClientColorSwatches = (
    value: string,
    onChange: (value: string) => void,
    historyKey: string,
  ) => {
    const colors = activePaletteColors.filter(Boolean);
    if (colors.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-600">Cores do cliente</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => {
            const isActive = value?.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={`${historyKey}-${color}-${index}`}
                type="button"
                onClick={() => {
                  endHistoryMerge();
                  onChange(color);
                }}
                className={`h-8 w-8 rounded-xl border transition-all ${isActive ? 'border-[#00adef] ring-2 ring-[#00adef]/25' : 'border-[#253243] hover:border-[#00adef]/70 hover:scale-105'}`}
                style={{ backgroundColor: color }}
                aria-label={`Usar cor ${color}`}
                title={color}
              >
                {isActive && (
                  <span className="flex h-full w-full items-center justify-center">
                    <Check size={13} className={parseInt(color.replace('#', ''), 16) > 0x888888 ? 'text-black' : 'text-white'} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGuidedColorField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    historyKey?: string,
    showClientPalette = false,
  ) => (
    <div className="space-y-2">
      <label className="relative block h-11 cursor-pointer overflow-hidden rounded-[9px] border border-[#172230] shadow-inner" style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(event) => {
            markHistoryMerge(historyKey || `guided-color:${label}`);
            onChange(event.target.value);
          }}
          onBlur={endHistoryMerge}
          className="absolute inset-[-8px] h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer opacity-0"
        />
      </label>
      <p className="text-center text-[9px] font-semibold text-zinc-300">{label}</p>
      {showClientPalette && renderGuidedClientColorSwatches(value || '#ffffff', onChange, historyKey || `guided-color:${label}`)}
    </div>
  );

  const renderGuidedFontField = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    historyKey: string,
  ) => (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</label>
      <select
        value={value || 'Inter'}
        onChange={(event) => {
          markHistoryMerge(historyKey);
          onChange(event.target.value);
        }}
        onBlur={endHistoryMerge}
        className="w-full rounded-[10px] border border-[#182432] bg-[#101820] px-3.5 py-3 text-[11px] font-black text-white outline-none transition-all focus:border-[#00adef]/80"
      >
        {allFontOptions.map((font) => (
          <option key={font.id} value={font.id}>{font.label}</option>
        ))}
      </select>
    </div>
  );

  const renderGuidedStart = () => (
    <main
      className="relative flex h-screen w-full flex-col overflow-hidden bg-[#070b10] p-4"
      style={{ background: 'linear-gradient(135deg, #070b10 0%, #091018 52%, #05080d 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-65">
        <div className="absolute left-[-10%] top-[-24%] h-[58%] w-[58%] rounded-full border border-[#182432]/70" />
        <div className="absolute bottom-[8%] right-[-8%] h-[42%] w-[45%] rounded-full bg-[#00adef]/4 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto mb-3 flex w-full max-w-[1460px] items-center justify-between">
        {renderGuidedWordmark(false)}
        <div className="flex items-center gap-3">
          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded-[10px] border border-[#182432] bg-[#101820] px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-[#00adef] hover:text-[#55d6ff]"
          >
            Importar JSON
          </button>
          <button
            onClick={() => setStudioMode('advanced')}
            className="rounded-[10px] border border-[#182432] bg-[#101820] px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-[#00adef] hover:text-[#55d6ff]"
          >
            Editor livre
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1520px] flex-1 flex-col justify-center">
      <div className="grid h-[min(600px,calc(100vh-104px))] min-h-[480px] grid-cols-[0.94fr_1.15fr_1.15fr] gap-4">
        <section className={`flex min-h-0 flex-col rounded-[16px] border p-5 ${guidedPanelChrome}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-black text-white">1. Cliente</h2>
            </div>
            <button onClick={useLastClient} className="rounded-lg bg-[#101820] px-3.5 py-2.5 text-[10px] font-black text-zinc-300 hover:text-[#55d6ff]">
              Usar ultimo
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={brandSearchQuery}
              onChange={(event) => setBrandSearchQuery(event.target.value)}
              placeholder="Buscar cliente ou instagram"
              className="w-full rounded-[10px] border border-[#182432] bg-[#101820] py-3.5 pl-10 pr-4 text-[13px] font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-[#00adef]/80"
            />
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {filteredBrandPresets.map((preset) => {
              const swatches = getBrandPaletteSwatches(preset).slice(0, 5);
              const isActive = activePaletteId === preset.id || carousel?.brandTheme?.paletteId === preset.id;
              const accent = swatches[2] || '#38bdf8';
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPalettePreset(preset)}
                  className={`w-full rounded-[10px] border px-3.5 py-3 text-left transition-all ${isActive ? 'border-[#00adef] bg-[#101d2e] shadow-[0_14px_42px_rgba(0,173,239,0.18)]' : guidedInteractiveCardChrome}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {renderClientAvatar(preset, 'h-10 w-10 border-[2px]', 'text-[14px]', accent)}
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-black text-white">{preset.name}</h3>
                        <p className="truncate text-[10px] font-semibold text-zinc-400">{preset.instagram || 'sem instagram'}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00adef] text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`flex min-h-0 flex-col rounded-[16px] border p-6 ${guidedPanelChrome}`}>
          <h2 className="text-[18px] font-black text-white">2. Visual</h2>
          <p className="mt-3 text-[13px] leading-5 text-zinc-400">Defina as cores principais do projeto.</p>
          <div className="mt-5 grid grid-cols-5 gap-5 rounded-[14px] border border-[#182432] bg-[#101820] p-4">
            {renderGuidedColorField('Primária', currentBrandTheme.accent || '#EAB308', (val) => updateGlobalProperty(['brandTheme', 'accent'], val))}
            {renderGuidedColorField('Secundária', currentBrandTheme.cardBg || '#101820', (val) => updateGlobalProperty(['brandTheme', 'cardBg'], val))}
            {renderGuidedColorField('Fundo', currentBrandTheme.background || '#0D0D0D', (val) => updateGlobalProperty(['brandTheme', 'background'], val))}
            {renderGuidedColorField('Texto', currentBrandTheme.text || '#F5F3EE', (val) => updateGlobalProperty(['brandTheme', 'text'], val))}
            {renderGuidedColorField('Destaque', currentBrandTheme.hlBgColor || currentBrandTheme.accent || '#EAB308', (val) => updateGlobalProperty(['brandTheme', 'hlBgColor'], val))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-[14px] border border-[#182432] bg-[#101820] p-4">
            {renderGuidedFontField('Fonte padrão', currentBrandTheme.fontPadrão || 'Inter', (val) => updateGlobalProperty(['brandTheme', 'fontPadrão'], val), 'guided-font-primary')}
            {renderGuidedFontField('Fonte destaque', currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão || 'Instrument Serif', (val) => updateGlobalProperty(['brandTheme', 'fontDestaque'], val), 'guided-font-display')}
          </div>
          <div className="mt-5 flex-1 rounded-[14px] border border-[#172230] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <p className="text-[10px] font-semibold text-zinc-500">Preview</p>
            <div className="mt-8 grid grid-cols-[1fr_150px] items-center gap-6">
              <div>
                <h3 className="text-[34px] font-black leading-[0.94]" style={{ color: currentBrandTheme.accent || '#00adef', fontFamily: currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão }}>
                  Visual
                </h3>
                <h4 className="text-[34px] font-black leading-[0.94] text-zinc-950" style={{ fontFamily: currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão }}>
                  pronto para gerar.
                </h4>
                <div className="mt-6 h-1 w-14 rounded-full" style={{ backgroundColor: currentBrandTheme.accent || '#00adef' }} />
              </div>
              <div className="flex aspect-square items-center justify-center rounded-[14px] bg-zinc-100 text-zinc-300">
                <ImageIconLucide size={54} />
              </div>
            </div>
          </div>
        </section>

        <section className={`flex min-h-0 flex-col rounded-[16px] border p-6 ${guidedPanelChrome}`}>
          <h2 className="text-[18px] font-black text-white">3. Roteiro</h2>
          <p className="mt-3 text-[13px] leading-5 text-zinc-400">Cole o conteudo bruto do carrossel.</p>
          <textarea
            value={rawScriptInput}
            onChange={(event) => setRawScriptInput(event.target.value)}
            placeholder={`Exemplo:\n\nSlide 1 - Sono e desenvolvimento\n\nUma crianca que dorme bem se desenvolve melhor.\n\n\nSlide 2 - O cronotipo importa\n\nEntender o cronotipo do seu filho faz toda a diferenca.\n\n\nSlide 3 - Salve esse carrossel\n\nColoque esses habitos em pratica hoje.`}
            className="mt-5 min-h-0 flex-1 resize-none rounded-[14px] border border-[#182432] bg-[#101820] p-5 font-mono text-[13px] leading-7 text-white outline-none placeholder:text-zinc-500 focus:border-[#00adef]/80 custom-scrollbar"
            spellCheck={false}
          />
          <div className="mt-3 text-[11px] font-semibold text-zinc-400">
            {rawScriptPreview.length || 0} slides
          </div>
        </section>
      </div>

      <footer className="mt-4 flex justify-end">
        <button
          onClick={handleCreateGuidedCarousel}
          className="flex items-center gap-3 rounded-[13px] bg-[#00adef] px-9 py-[18px] text-[12px] font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_52px_rgba(0,173,239,0.28)] transition-all hover:bg-[#33c4f5]"
        >
          Criar Carrossel
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </footer>
      </div>
    </main>
  );

  const renderGuidedProgress = () => (
    <header className="border-b border-[#101a27] bg-[#05080c]/95 px-8 py-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-6">
        <button onClick={() => setHasEnteredGuidedFlow(false)} className="flex items-center gap-3 text-left">
          {renderGuidedWordmark(false)}
        </button>
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0">
          {GUIDED_STEPS.map((step, index) => {
            const isActive = guidedStep === step.id;
            const isDone = index < guidedStepIndex;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => goToGuidedStep(step.id)}
                  className={`relative flex min-w-0 items-center gap-2.5 px-4 py-2.5 transition-all ${
                    isActive ? 'text-[#38bdf8]' : isDone ? 'text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    isActive
                      ? 'bg-[#38bdf8] text-black shadow-[0_0_22px_rgba(56,189,248,0.55)]'
                      : isDone
                        ? 'bg-[#101a27] text-white'
                        : 'bg-[#0b121c] text-zinc-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="truncate text-[10px] font-black uppercase tracking-[0.18em]">{step.label}</span>
                  {isActive && <span className="absolute bottom-[-17px] left-4 right-4 h-[2px] rounded-full bg-[#38bdf8] shadow-[0_0_18px_rgba(56,189,248,0.8)]" />}
                </button>
                {index < GUIDED_STEPS.length - 1 && <span className="h-px w-8 bg-[#101a27]" />}
              </React.Fragment>
            );
          })}
        </nav>
        <button
          onClick={() => setStudioMode('advanced')}
          className="flex items-center gap-3 rounded-[15px] border border-[#1f4261] bg-[#102235] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-100 transition-all hover:border-[#38bdf8] hover:text-[#38bdf8]"
        >
          Abrir editor avancado
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </header>
  );

  const renderGuidedClientStep = () => (
    <div className="mx-auto flex h-full w-full max-w-[1240px] overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#38bdf8]">Passo 1 de 6</p>
          <h2 className="text-[32px] font-black leading-tight tracking-tight text-white">Escolha a identidade do cliente</h2>
          <p className="text-[14px] leading-6 text-zinc-400">Selecione a marca que sera usada como base para cores, fontes e padroes visuais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={brandSearchQuery}
              onChange={(event) => setBrandSearchQuery(event.target.value)}
              placeholder="Buscar cliente ou instagram"
              className="w-full rounded-[16px] border border-[#1f4261] bg-[#102235] py-4 pl-12 pr-5 text-[13px] font-semibold text-white outline-none transition-all placeholder:text-zinc-400 focus:border-[#38bdf8]/70 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.16)]"
            />
          </div>
          <button onClick={useLastClient} className="rounded-[16px] border border-[#1f4261] bg-[#102235] px-4 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-[#38bdf8]/55 hover:text-[#38bdf8]">
            Usar ultimo cliente
          </button>
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto pr-3 custom-scrollbar lg:grid-cols-2 xl:grid-cols-3">
          {filteredBrandPresets.map((preset) => {
            const swatches = getBrandPaletteSwatches(preset).slice(0, 5);
            const isActive = activePaletteId === preset.id || carousel?.brandTheme?.paletteId === preset.id;
            const accent = swatches[2] || '#38bdf8';
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPalettePreset(preset)}
                className={`group rounded-[20px] border p-5 text-left transition-all ${
                  isActive
                    ? 'border-[#38bdf8] bg-[#07111b]/80 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_18px_60px_rgba(56,189,248,0.1)]'
                    : guidedInteractiveCardChrome
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    {renderClientAvatar(preset, 'h-12 w-12 border-[3px]', 'text-[18px]', accent)}
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-black text-white">{preset.name}</h3>
                      <p className="truncate text-[11px] font-semibold text-zinc-500">{preset.instagram || 'sem instagram'}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#38bdf8] text-black">
                      <Check size={15} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {swatches.map((color, index) => (
                    <span key={`${preset.id}-${color}-${index}`} className="h-7 flex-1 rounded-lg border border-black/35 shadow-inner" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderGuidedVisualStep = () => (
    <div className="grid h-full grid-cols-[1fr_340px] gap-7 overflow-hidden">
      <section className="min-h-0 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#38bdf8]">Passo 2 de 6</p>
          <h2 className="text-[30px] font-black leading-tight text-white">Defina a direção visual</h2>
          <p className="text-[13px] leading-6 text-zinc-500">Escolha um comportamento visual e ajuste apenas as cores essenciais.</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {VISUAL_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => applyGuidedVisualPreset(preset.id)} className={`rounded-[18px] border p-4 text-left transition-all ${guidedInteractiveCardChrome}`}>
              <div className="mb-4 flex gap-1.5">
                <span className="h-3 flex-1 rounded-full border border-black/35" style={{ backgroundColor: preset.options.background }} />
                <span className="h-3 flex-1 rounded-full border border-black/35" style={{ backgroundColor: preset.options.text }} />
                <span className="h-3 flex-1 rounded-full border border-black/35" style={{ backgroundColor: preset.options.accent }} />
              </div>
              <h3 className="text-[12px] font-black text-white">{preset.label}</h3>
              <p className="mt-2 text-[9px] leading-4 text-zinc-500">{preset.description}</p>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {renderGuidedColorField('Cor principal', currentBrandTheme.accent || '#EAB308', (val) => updateGlobalProperty(['brandTheme', 'accent'], val))}
          {renderGuidedColorField('Cor de destaque', currentBrandTheme.hlBgColor || currentBrandTheme.accent || '#EAB308', (val) => updateGlobalProperty(['brandTheme', 'hlBgColor'], val))}
          {renderGuidedColorField('Fundo', currentBrandTheme.background || '#0D0D0D', (val) => updateGlobalProperty(['brandTheme', 'background'], val))}
          {renderGuidedColorField('Texto', currentBrandTheme.text || '#F5F3EE', (val) => updateGlobalProperty(['brandTheme', 'text'], val))}
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-[20px] border border-[#1a344f] bg-[#0d1b2b] p-4">
          {renderGuidedFontField('Fonte padrão', currentBrandTheme.fontPadrão || 'Inter', (val) => updateGlobalProperty(['brandTheme', 'fontPadrão'], val), 'guided-step-font-primary')}
          {renderGuidedFontField('Fonte destaque', currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão || 'Instrument Serif', (val) => updateGlobalProperty(['brandTheme', 'fontDestaque'], val), 'guided-step-font-display')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Densidade</p>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#1a344f] bg-[#0d1b2b] p-1.5">
              {(['compact', 'balanced', 'airy'] as GuidedDensity[]).map((density) => (
                <button key={density} onClick={() => applyGuidedDensity(density)} className={`rounded-xl py-3 text-[9px] font-black uppercase tracking-[0.12em] ${guidedDensity === density ? 'bg-[#38bdf8] text-black' : 'text-zinc-500 hover:text-white'}`}>
                  {density === 'compact' ? 'Compacto' : density === 'balanced' ? 'Equilibrado' : 'Arejado'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Contraste</p>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#1a344f] bg-[#0d1b2b] p-1.5">
              {(['soft', 'medium', 'strong'] as GuidedContrast[]).map((contrast) => (
                <button key={contrast} onClick={() => applyGuidedContrast(contrast)} className={`rounded-xl py-3 text-[9px] font-black uppercase tracking-[0.12em] ${guidedContrast === contrast ? 'bg-[#38bdf8] text-black' : 'text-zinc-500 hover:text-white'}`}>
                  {contrast === 'soft' ? 'Suave' : contrast === 'medium' ? 'Medio' : 'Forte'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <aside className={`rounded-[24px] border p-5 ${guidedPanelChrome}`}>
        <div className="h-full rounded-[20px] p-6" style={{ backgroundColor: currentBrandTheme.background || '#111' }}>
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: currentBrandTheme.accent || '#EAB308' }}>Preview visual</p>
          <h3 className="mt-10 text-[38px] font-black leading-[0.94]" style={{ color: currentBrandTheme.text || '#fff', fontFamily: currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão }}>
            Uma decisao visual clara.
          </h3>
          <p className="mt-5 text-[14px] leading-6" style={{ color: currentBrandTheme.text || '#fff', opacity: 0.72 }}>
            Densidade {guidedDensity === 'compact' ? 'compacta' : guidedDensity === 'airy' ? 'arejada' : 'equilibrada'} com contraste {guidedContrast === 'soft' ? 'suave' : guidedContrast === 'strong' ? 'forte' : 'medio'}.
          </p>
        </div>
      </aside>
    </div>
  );

  const renderGuidedScriptStep = () => (
    <div className="grid h-full grid-cols-[1.08fr_0.92fr] gap-8 overflow-hidden">
      <section className="flex min-h-0 flex-col gap-5">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Passo 3</p>
          <h2 className="text-[32px] font-black leading-tight text-white">Cole ou organize o roteiro</h2>
        </div>
        <textarea
          value={rawScriptInput}
          onChange={(event) => setRawScriptInput(event.target.value)}
          placeholder={`Slide 1 - Sono e desenvolvimento\nUma crianca que dorme bem se desenvolve melhor.\n\nSlide 2 - O cronotipo importa\nEntender o cronotipo do seu filho faz toda a diferenca.\n\nSlide 3 - Salve esse carrossel\nColoque esses habitos em pratica hoje.`}
          className="min-h-0 flex-1 rounded-[28px] border border-[#1f4261] bg-[#102235] p-6 font-mono text-[13px] leading-7 text-white outline-none transition-all placeholder:text-zinc-400 focus:border-brand/60 custom-scrollbar"
          spellCheck={false}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!rawScriptInput.trim()) {
                showToast('Cole um roteiro antes de gerar.', 'error');
                return;
              }
              if (handleGenerateFromRawScript()) {
                setGuidedStep('images');
              }
            }}
            className="rounded-2xl bg-brand px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-xl transition-all hover:bg-brand/85"
          >
            Gerar carrossel
          </button>
          <button
            onClick={() => setRawScriptInput((value) => value.replace(/\n{3,}/g, '\n\n').trim())}
            className={`rounded-2xl border px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 hover:text-white ${guidedInteractiveCardChrome}`}
          >
            Organizar roteiro automaticamente
          </button>
          <button onClick={() => setRawScriptInput('')} className="rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-300">
            Limpar
          </button>
        </div>
      </section>
      <aside className="min-h-0 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
        <div className={`rounded-[28px] border p-6 ${guidedPanelChrome}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">Leitura rapida</p>
          <h3 className="mt-3 text-[22px] font-black leading-tight text-white">{guidedScriptSummary}</h3>
        </div>
        <div className={`rounded-[28px] border p-6 ${guidedPanelChrome}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">Exemplo</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-black/35 p-4 font-mono text-[11px] leading-6 text-zinc-400">{`Slide 1 - Titulo da capa\nA promessa central do carrossel.\n\nSlide 2 - Primeiro ponto\nExplique a ideia em poucas linhas.\n\nSlide 3 - Checklist\n- item um\n- item dois\n- item tres`}</pre>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">Preview heuristico</p>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-700">{rawScriptPreview.length} slides</span>
          </div>
          {rawScriptPreview.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#1a344f] bg-[#0d1b2b] p-6 text-[12px] leading-6 text-zinc-500">
              O preview mostra tipo de slide, peso visual e template antes de gerar.
            </div>
          ) : rawScriptPreview.map((preview) => (
            <div key={preview.index} className={`rounded-[22px] border p-4 ${guidedCardChrome}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">{preview.kind === 'cover' ? 'Capa' : `Slide ${preview.index}`}</p>
              <h4 className="mt-2 text-[13px] font-black leading-snug text-white">{preview.title}</h4>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">{preview.selection.templateId.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );

  const renderGuidedImagesStep = () => {
    const selectedGuidedBlock = guidedSelectedBlockIndex !== null
      ? currentSlide?.blocks?.[guidedSelectedBlockIndex]
      : null;
    const selectedGuidedBlockContent = selectedGuidedBlock
      ? Array.isArray(selectedGuidedBlock.content)
        ? selectedGuidedBlock.content.join('\n')
        : String(selectedGuidedBlock.content || '')
      : '';
    const selectedGuidedBlockIsHighlight = selectedGuidedBlock?.options?.semanticRole === 'highlight'
      || Boolean(selectedGuidedBlock?.options?.highlight)
      || String(selectedGuidedBlock?.content || '').includes('[[');
    const selectedGuidedBlockIsBox = selectedGuidedBlock?.type === 'BOX';
    const selectedGuidedBlockIsList = selectedGuidedBlock?.type === 'LIST';
    const selectedGuidedBlockIsBadge = selectedGuidedBlock?.type === 'BADGE';
    const selectedGuidedBlockFontSize = selectedGuidedBlock
      ? getEffectiveBlockFontSize(selectedGuidedBlock, currentSlide?.blocks)
      : 32;
    const selectedGuidedBlockLineHeight = selectedGuidedBlock?.options?.lineHeight ?? (
      selectedGuidedBlock?.type === 'TITLE'
        ? 1.04
        : selectedGuidedBlockIsHighlight
          ? 1.2
          : 1.2
    );
    const guidedContentOffsetX = currentSlide?.options?.contentOffsetX || 0;
    const guidedContentOffsetY = currentSlide?.options?.contentOffsetY || 0;
    const guidedContentScale = currentSlide?.options?.contentScale || 1;
    const heroSocialContentOption = !isCoverSlide
      ? visibleContentTemplateOptionsForCurrentSlide.find((option) => option.heroVariant === 'social')
      : null;
    const isHeroSocialActive = currentVisibleContentTemplateId === 'HERO_SOCIAL';
    const inspectorOptions = [
      { id: 'image' as const, label: 'Imagem', description: isHeroSocialActive ? 'Social' : (currentImageLayoutFamily?.name || 'Sem imagem'), icon: ImagePlus },
      { id: 'alignment' as const, label: 'Alinhamento', description: `${Math.round(guidedContentScale * 100)}% · ${guidedContentOffsetX}px / ${guidedContentOffsetY}px`, icon: Move3d },
      { id: 'colors' as const, label: 'Cores', description: 'Cores do projeto', icon: Baseline },
      { id: 'finish' as const, label: 'Acabamento', description: `${Math.round((guidedFinishScope === 'current' ? currentSlide?.options?.postFX?.noiseAmount ?? carousel?.projectFX?.noiseAmount ?? 0 : carousel?.projectFX?.noiseAmount ?? 0) * 100)}% ruído`, icon: SlidersHorizontal },
    ];
    const horizontalAlignments = [
      { id: 'left' as const, label: 'Esquerda' },
      { id: 'center' as const, label: 'Centro' },
      { id: 'right' as const, label: 'Direita' },
    ];
    const renderImageModeControls = () => (
      <div className="space-y-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Modo da imagem</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">Escolha Sem imagem ou qualquer modelo disponível para este slide.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {heroSocialContentOption && (
            <button
              onClick={() => applyVisibleContentTemplateSelection(heroSocialContentOption)}
              className={`rounded-2xl border p-3 text-left transition-all ${isHeroSocialActive ? 'border-[#00adef] bg-[#101d2e]' : guidedInteractiveCardChrome}`}
            >
              <div className="flex items-center gap-2">
                <User size={14} className={isHeroSocialActive ? 'text-[#00adef]' : 'text-zinc-400'} />
                <p className={`text-[10px] font-black uppercase ${isHeroSocialActive ? 'text-[#00adef]' : 'text-white'}`}>Social</p>
              </div>
              <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-500">Foto, nome, @ e frase em um slide sem imagem.</p>
            </button>
          )}
          {imageLayoutFamilies.map((family) => {
            const isActive = currentImageLayoutFamily?.id === family.id || (!currentImageLayoutFamily && family.id === 'none' && !isHeroSocialActive);
            return (
              <button
                key={family.id}
                onClick={() => applyImageLayoutFamilySelection(family.id)}
                className={`rounded-2xl border p-3 text-left transition-all ${isActive ? 'border-[#00adef] bg-[#101d2e]' : guidedInteractiveCardChrome}`}
              >
                <p className={`text-[10px] font-black uppercase ${isActive ? 'text-[#00adef]' : 'text-white'}`}>{family.name}</p>
                <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-500">{family.description}</p>
              </button>
            );
          })}
        </div>
        {currentImageLayoutFamily && currentImageLayoutFamily.directionOptions.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {currentImageLayoutFamily.directionOptions.map((direction) => {
              const nextLayoutId = getImageLayoutIdForFamilyDirection(currentImageLayoutFamily.id, direction);
              const isDirectionActive = nextLayoutId ? currentSlideComposition?.imageLayoutId === nextLayoutId : false;
              return (
                <button
                  key={direction}
                  onClick={() => nextLayoutId && applySlideCompositionSelection(undefined, nextLayoutId)}
                  className={`rounded-xl border px-2 py-2 text-[8px] font-black uppercase tracking-[0.12em] transition-all ${isDirectionActive ? 'border-[#00adef] bg-[#00adef] text-white' : 'border-[#182432] bg-[#101820] text-zinc-400 hover:text-white'}`}
                >
                  {imageDirectionLabel(direction)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );

    const renderInspectorDetails = () => {
      if (!guidedImageInspector) {
        return (
          <div className={`rounded-[24px] border p-5 text-[12px] leading-6 text-zinc-500 ${guidedPanelChrome}`}>
            Clique em um bloco acima para abrir os ajustes daquele item.
          </div>
        );
      }

      return (
        <div className={`rounded-[24px] border p-5 ${guidedPanelChrome}`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00adef]">Detalhes</p>
              <h3 className="mt-1 text-[18px] font-black text-white">
                {guidedImageInspector === 'text' ? 'Texto' : inspectorOptions.find((option) => option.id === guidedImageInspector)?.label}
              </h3>
            </div>
            <button
              onClick={() => setGuidedImageInspector(null)}
              className="rounded-full bg-[#101820] p-2 text-zinc-500 transition-all hover:text-white"
              aria-label="Fechar detalhes"
            >
              <X size={16} />
            </button>
          </div>

          {guidedImageInspector === 'image' && (
            <div className="space-y-5">
              {isPendingImageOnCurrentSlide && pendingImageDraft && (
                <div className="rounded-2xl border border-[#00adef]/35 bg-[#00adef]/10 p-4 shadow-[0_18px_52px_rgba(0,173,239,0.12)]">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00adef]">Imagem pendente</p>
                  <p className="mt-2 text-[12px] font-bold leading-5 text-zinc-200">
                    Ajuste {getPendingImageTargetLabel(pendingImageDraft.target)} e confirme para otimizar.
                  </p>
                  <button
                    onClick={confirmPendingImageDraft}
                    disabled={isOptimizingPendingImage}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00adef] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-[#00adef]/85 disabled:opacity-60"
                  >
                    {isOptimizingPendingImage ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                    {isOptimizingPendingImage ? 'Otimizando...' : 'OK e otimizar'}
                  </button>
                </div>
              )}
              <button onClick={() => imageInputRef.current?.click()} className="w-full rounded-2xl bg-[#00adef] px-5 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                Adicionar imagem
              </button>
              {renderImageModeControls()}
              {imageConfig ? (
                <div className="space-y-5">
                  <TransformControl label="Zoom da imagem" value={imageConfig.imageScale || 1} min={0.1} max={10} step={0.05} onChange={(v) => { markHistoryMerge('guided-image-zoom'); updateSlideProperty(['image', 'imageScale'], v); }} highlight />
                  <TransformControl label="Posicao X" value={imageConfig.imageX || 0} min={-1000} max={1000} step={1} onChange={(v) => { markHistoryMerge('guided-image-x'); updateSlideProperty(['image', 'imageX'], v); }} />
                  <TransformControl label="Posicao Y" value={imageConfig.imageY || 0} min={-1000} max={1000} step={1} onChange={(v) => { markHistoryMerge('guided-image-y'); updateSlideProperty(['image', 'imageY'], v); }} />
                </div>
              ) : (
                <p className="text-[12px] leading-6 text-zinc-500">Este slide está sem imagem ativa. Escolha um modo ou adicione uma imagem.</p>
              )}
            </div>
          )}

          {guidedImageInspector === 'text' && (
            selectedGuidedBlock && guidedSelectedBlockIndex !== null ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Conteúdo</p>
                  <textarea
                    value={selectedGuidedBlockContent}
                    onChange={(event) => updateSlideProperty(
                      ['blocks', guidedSelectedBlockIndex, 'content'],
                      selectedGuidedBlock.type === 'LIST' ? event.target.value.split('\n').filter(Boolean) : event.target.value,
                    )}
                    className="min-h-[108px] w-full resize-none rounded-2xl border border-[#182432] bg-[#101820] p-4 text-[13px] font-semibold leading-6 text-white outline-none focus:border-[#00adef]/80 custom-scrollbar"
                  />
                </div>
                {selectedGuidedBlockIsList && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Modelo da lista</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'box', label: 'Cards' },
                        { id: 'check-list', label: 'Checklist' },
                        { id: 'numbered', label: 'Numerada' },
                        { id: 'default', label: 'Simples' },
                      ].map((variant) => {
                        const isActive = (selectedGuidedBlock.options?.variant || 'default') === variant.id;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'variant'], variant.id)}
                            className={`rounded-xl border px-3 py-3 text-[9px] font-black uppercase tracking-[0.14em] ${isActive ? 'border-[#00adef] bg-[#00adef] text-white' : 'border-[#182432] bg-[#101820] text-zinc-400 hover:text-white'}`}
                          >
                            {variant.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Estilo da fonte</p>
                    <select
                      value={selectedGuidedBlock.options?.fontVariant || (selectedGuidedBlock.type === 'TITLE' ? 'destaque' : 'padrão')}
                      onChange={(event) => updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'fontVariant'], event.target.value)}
                      className="w-full rounded-xl border border-[#182432] bg-[#101820] px-3 py-3 text-[10px] font-black text-white outline-none focus:border-[#00adef]/80"
                    >
                      <option value="padrão">Padrão</option>
                      <option value="destaque">Destaque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Fonte</p>
                    <select
                      value={selectedGuidedBlock.options?.fontFamily || ''}
                      onChange={(event) => updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'fontFamily'], event.target.value || undefined)}
                      className="w-full rounded-xl border border-[#182432] bg-[#101820] px-3 py-3 text-[10px] font-black text-white outline-none focus:border-[#00adef]/80"
                    >
                      <option value="">Usar estilo selecionado</option>
                      {allFontOptions.map((font) => (
                        <option key={font.id} value={font.id}>{font.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Cor do texto</p>
                    {(() => {
                      const textColorValue = selectedGuidedBlock.options?.color || currentBrandTheme.text || '#ffffff';
                      return (
                        <>
                          <label className="relative block h-11 cursor-pointer overflow-hidden rounded-xl border border-[#182432]" style={{ backgroundColor: textColorValue }}>
                            <input
                              type="color"
                              value={textColorValue}
                              onChange={(event) => {
                                markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-text-color`);
                                updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'color'], event.target.value);
                              }}
                              onBlur={endHistoryMerge}
                              className="absolute inset-[-8px] h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer opacity-0"
                            />
                          </label>
                          {renderGuidedClientColorSwatches(
                            textColorValue,
                            (color) => updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'color'], color),
                            `guided-block-${guidedSelectedBlockIndex}-text-color`,
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <StepperNumberControl
                    label="Tamanho"
                    value={selectedGuidedBlockFontSize}
                    min={8}
                    max={400}
                    step={1}
                    onChange={(value) => {
                      markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-font-size`);
                      updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'fontSize'], value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TransformControl
                    label="Altura Linha"
                    value={selectedGuidedBlockLineHeight}
                    min={0.5}
                    max={3}
                    step={0.01}
                    onChange={(value) => {
                      markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-line-height`);
                      updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'lineHeight'], value);
                    }}
                  />
                  <TransformControl
                    label="Espaçamento"
                    value={selectedGuidedBlock.options?.letterSpacing || 0}
                    min={-10}
                    max={50}
                    step={1}
                    onChange={(value) => {
                      markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-letter-spacing`);
                      updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'letterSpacing'], value);
                    }}
                  />
                </div>
                {supportsFontWeightControl(selectedGuidedBlock) && (
                  <StepperNumberControl
                    label="Peso"
                    value={selectedGuidedBlock.options?.fontWeight ?? (
                      selectedGuidedBlock.type === 'TITLE'
                        ? ((selectedGuidedBlock.options?.fontVariant || 'destaque') === 'destaque' ? 400 : 900)
                        : selectedGuidedBlock.type === 'BOX'
                          ? 900
                          : selectedGuidedBlock.type === 'USER'
                            ? 900
                            : ((selectedGuidedBlock.options?.fontVariant || 'padrão') === 'destaque' ? 400 : 300)
                    )}
                    min={100}
                    max={900}
                    step={100}
                    onChange={(value) => {
                      markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-font-weight`);
                      updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', 'fontWeight'], value);
                    }}
                  />
                )}
                {(selectedGuidedBlockIsHighlight || selectedGuidedBlockIsBox || selectedGuidedBlockIsList || selectedGuidedBlockIsBadge) && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {selectedGuidedBlockIsHighlight ? 'Fundo do highlight' : selectedGuidedBlockIsBadge ? 'Fundo do botão' : selectedGuidedBlockIsList ? 'Fundo da lista' : selectedGuidedBlockIsBox ? 'Fundo da box' : 'Fundo'}
                    </p>
                    {(() => {
                      const backgroundColorValue = selectedGuidedBlockIsHighlight
                        ? (selectedGuidedBlock.options?.highlightBackgroundColor || selectedGuidedBlock.options?.backgroundColor || currentBrandTheme.hlBgColor || currentBrandTheme.accent || '#00adef')
                        : selectedGuidedBlockIsBox || selectedGuidedBlockIsList || selectedGuidedBlockIsBadge
                        ? (selectedGuidedBlock.options?.backgroundColor || currentBrandTheme.cardBg || currentBrandTheme.accent || '#00adef')
                        : (selectedGuidedBlock.options?.backgroundColor || currentBrandTheme.hlBgColor || currentBrandTheme.accent || '#00adef');
                      const updateBackgroundColor = (color: string) => {
                        updateSlideProperty(['blocks', guidedSelectedBlockIndex, 'options', selectedGuidedBlockIsHighlight ? 'highlightBackgroundColor' : 'backgroundColor'], color);
                      };

                      return (
                        <>
                          <label
                            className="relative block h-11 cursor-pointer overflow-hidden rounded-xl border border-[#182432]"
                            style={{ backgroundColor: backgroundColorValue }}
                          >
                            <input
                              type="color"
                              value={backgroundColorValue}
                              onChange={(event) => {
                                markHistoryMerge(`guided-block-${guidedSelectedBlockIndex}-background-color`);
                                updateBackgroundColor(event.target.value);
                              }}
                              onBlur={endHistoryMerge}
                              className="absolute inset-[-8px] h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer opacity-0"
                            />
                          </label>
                          {renderGuidedClientColorSwatches(
                            backgroundColorValue,
                            updateBackgroundColor,
                            `guided-block-${guidedSelectedBlockIndex}-background-color`,
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">Alinhamento do texto</p>
                  <div className="grid grid-cols-3 gap-2">
                    {horizontalAlignments.map((align) => {
                      const isActive = (selectedGuidedBlock.options?.textAlign || selectedGuidedBlock.options?.align || 'left') === align.id;
                      return (
                        <button
                          key={align.id}
                          onClick={() => updateSlideProperties([
                            { path: ['blocks', guidedSelectedBlockIndex, 'options', 'textAlign'], value: align.id },
                            { path: ['blocks', guidedSelectedBlockIndex, 'options', 'align'], value: align.id },
                          ])}
                          className={`rounded-xl border px-3 py-3 text-[9px] font-black uppercase tracking-[0.14em] ${isActive ? 'border-[#00adef] bg-[#00adef] text-white' : 'border-[#182432] bg-[#101820] text-zinc-400 hover:text-white'}`}
                        >
                          {align.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] leading-6 text-zinc-500">Clique em um texto no slide para editar conteúdo, cor, tamanho e alinhamento.</p>
            )
          )}

          {guidedImageInspector === 'alignment' && currentSlide && (
            <div className="space-y-5">
              <p className="text-[12px] leading-6 text-zinc-500">Move e ajusta o zoom do conjunto de texto livremente, sem trocar o modelo do slide.</p>
              <TransformControl
                label="Zoom do texto"
                value={guidedContentScale}
                min={0.6}
                max={1.6}
                step={0.01}
                onChange={(v) => { markHistoryMerge('guided-content-scale'); updateSlideProperty(['options', 'contentScale'], v); }}
                highlight
              />
              <TransformControl
                label="Mover texto X"
                value={guidedContentOffsetX}
                min={-260}
                max={260}
                step={1}
                onChange={(v) => { markHistoryMerge('guided-content-offset-x'); updateSlideProperty(['options', 'contentOffsetX'], v); }}
              />
              <TransformControl
                label="Mover texto Y"
                value={guidedContentOffsetY}
                min={-360}
                max={360}
                step={1}
                onChange={(v) => { markHistoryMerge('guided-content-offset-y'); updateSlideProperty(['options', 'contentOffsetY'], v); }}
              />
              <button
                onClick={() => updateSlideProperties([
                  { path: ['options', 'contentOffsetX'], value: 0 },
                  { path: ['options', 'contentOffsetY'], value: 0 },
                  { path: ['options', 'contentScale'], value: 1 },
                ])}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#182432] bg-[#101820] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-[#00adef]/70 hover:text-white"
              >
                <RotateCcw size={14} />
                Voltar ao padrão
              </button>
            </div>
          )}

          {guidedImageInspector === 'colors' && (
            <div className="grid grid-cols-2 gap-4">
              {renderGuidedColorField('Primária', currentBrandTheme.accent || '#00adef', (val) => updateGlobalProperty(['brandTheme', 'accent'], val), 'guided-detail-brand-accent', true)}
              {renderGuidedColorField('Fundo', currentBrandTheme.background || '#0D0D0D', (val) => updateGlobalProperty(['brandTheme', 'background'], val), 'guided-detail-brand-background', true)}
              {renderGuidedColorField('Texto', currentBrandTheme.text || '#F5F3EE', (val) => updateGlobalProperty(['brandTheme', 'text'], val), 'guided-detail-brand-text', true)}
              {renderGuidedColorField('Destaque', currentBrandTheme.hlBgColor || currentBrandTheme.accent || '#00adef', (val) => updateGlobalProperty(['brandTheme', 'hlBgColor'], val), 'guided-detail-brand-highlight', true)}
            </div>
          )}

          {guidedImageInspector === 'finish' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all' as const, label: 'Todos' },
                  { id: 'current' as const, label: 'Este slide' },
                ].map((scope) => (
                  <button
                    key={scope.id}
                    onClick={() => setGuidedFinishScope(scope.id)}
                    className={`rounded-xl border px-3 py-3 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${guidedFinishScope === scope.id ? 'border-[#00adef] bg-[#00adef] text-white' : 'border-[#182432] bg-[#101820] text-zinc-400 hover:text-white'}`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
              <TransformControl
                label="Ruído"
                value={guidedFinishScope === 'current' ? currentSlide?.options?.postFX?.noiseAmount ?? carousel?.projectFX?.noiseAmount ?? 0 : carousel?.projectFX?.noiseAmount ?? 0}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => {
                  markHistoryMerge('guided-finish-noise');
                  if (guidedFinishScope === 'current') {
                    updateSlideProperty(['options', 'postFX', 'noiseAmount'], v);
                    return;
                  }
                  updateGlobalProperty(['projectFX', 'noiseAmount'], v);
                }}
                highlight
              />
              <TransformControl
                label="Vinheta"
                value={guidedFinishScope === 'current' ? currentSlide?.options?.postFX?.vignette ?? carousel?.projectFX?.vignette ?? 0 : carousel?.projectFX?.vignette ?? 0}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => {
                  markHistoryMerge('guided-finish-vignette');
                  if (guidedFinishScope === 'current') {
                    updateSlideProperty(['options', 'postFX', 'vignette'], v);
                    return;
                  }
                  updateGlobalProperty(['projectFX', 'vignette'], v);
                }}
              />
              {guidedFinishScope === 'current' && (
                <button
                  onClick={() => updateSlideProperty(['options', 'postFX'], undefined)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#182432] bg-[#101820] px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-red-400/60 hover:text-white"
                >
                  <RotateCcw size={14} />
                  Remover acabamento local
                </button>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="grid h-full grid-cols-[220px_1fr_380px] gap-6 overflow-hidden">
        <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {(carousel?.slides || []).map((slide, index) => {
            const guidance = getSlideImageGuidance(slide as SlideDefinition, index);
            const isActive = currentIndex === index;
            const totalSlides = carousel?.slides.length ?? 0;
            return (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-full rounded-[18px] border p-4 text-left transition-all cursor-pointer ${isActive ? 'border-[#00adef] bg-[#101d2e] shadow-[0_18px_60px_rgba(0,173,239,0.18)]' : guidedInteractiveCardChrome}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">{getSlideDisplayLabel(slide, index)}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${guidance.tone === 'success' ? 'bg-emerald-400' : guidance.tone === 'warning' ? 'bg-amber-300' : 'bg-zinc-600'}`} />
                </div>
                <p className="mt-3 text-[10px] leading-5 text-zinc-500">{guidance.label}</p>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1 border-t border-white/5 pt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={index === 0}
                      onClick={() => moveSlide(index, index - 1)}
                      className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
                      title="Mover para cima"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      disabled={index === totalSlides - 1}
                      onClick={() => moveSlide(index, index + 1)}
                      className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      onClick={() => duplicateSlide(index)}
                      className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-brand/20 hover:text-brand"
                      title="Duplicar slide"
                    >
                      <Icons.Copy size={12} />
                    </button>
                    <div className="flex-1" />
                    <button
                      disabled={totalSlides <= 1}
                      onClick={() => deleteSlide(index)}
                      className="rounded-lg p-1.5 text-zinc-500 transition-all hover:bg-red-400/10 hover:text-red-400 disabled:opacity-20"
                      title="Remover slide"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </aside>
        <main className="relative flex min-h-0 items-center justify-center overflow-auto rounded-[28px] border border-[#111b25] bg-[#0b0f14] p-10">
          <div className="absolute right-5 top-5 z-30 flex items-center gap-1 rounded-2xl border border-[#182432] bg-[#071019]/90 p-1.5 shadow-[0_18px_52px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <button
              onClick={() => setZoom(Math.max(0.2, zoom - 0.05))}
              className="rounded-xl p-2 text-zinc-500 transition-all hover:bg-[#101820] hover:text-white"
              aria-label="Diminuir zoom do slide"
            >
              <ZoomOut size={15} />
            </button>
            <span className="min-w-12 text-center font-mono text-[10px] font-black text-zinc-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1, zoom + 0.05))}
              className="rounded-xl p-2 text-zinc-500 transition-all hover:bg-[#101820] hover:text-white"
              aria-label="Aumentar zoom do slide"
            >
              <ZoomIn size={15} />
            </button>
          </div>
          {selectedGuidedBlock && guidedImageInspector === 'text' && (
            <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-2xl border border-[#00adef]/40 bg-[#071019]/90 px-4 py-3 shadow-[0_18px_52px_rgba(0,173,239,0.18)] backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#00adef]">Selecionado</p>
              <p className="mt-1 max-w-[320px] truncate text-[12px] font-black text-white">
                {selectedGuidedBlock.type} · {selectedGuidedBlockContent || 'Sem conteúdo'}
              </p>
            </div>
          )}
          {carousel?.slides[currentIndex] ? (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="shrink-0 shadow-[0_40px_100px_rgba(0,0,0,0.75)]">
              <SlideCanvas
                slide={carousel.slides[currentIndex]}
                index={currentIndex}
                canvasRef={canvasRef}
                onEditIcon={(b, i, itemIndex) => openIconEditor(b, i, itemIndex)}
                customFonts={[...(carousel.customFonts || []), ...clientFonts]}
                brandTheme={carousel.brandTheme}
                projectFX={carousel.projectFX}
                onUpdateImage={updateSlideProperties}
                onSelectionChange={(selection) => {
                  setSelectedCanvasObject(selection);
                  if (selection) setGuidedImageInspector('image');
                }}
                interactionScale={zoom}
                onSelectBlock={(_, blockIndex) => {
                  setGuidedSelectedBlockIndex(blockIndex);
                  setGuidedImageInspector('text');
                }}
                debugMode={isDebugMode}
              />
            </div>
          ) : (
            <div className="text-center text-zinc-600">
              <ImageIconLucide size={46} className="mx-auto mb-4" />
              <p className="text-[12px] font-black uppercase tracking-[0.18em]">Gere um carrossel para revisar imagens.</p>
            </div>
          )}
        </main>
        <aside className="min-h-0 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {inspectorOptions.map((option) => {
              const Icon = option.icon;
              const isActive = guidedImageInspector === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setGuidedImageInspector(option.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${isActive ? 'border-[#00adef] bg-[#101d2e]' : guidedInteractiveCardChrome}`}
                >
                  <Icon size={17} className={isActive ? 'text-[#00adef]' : 'text-zinc-400'} />
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.12em] text-white">{option.label}</p>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-500">{option.description}</p>
                </button>
              );
            })}
          </div>
          {renderInspectorDetails()}
        </aside>
      </div>
    );
  };

  const renderGuidedFinishStep = () => (
    <div className="grid h-full grid-cols-[1fr_360px] gap-8 overflow-hidden">
      <section className="space-y-7">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Passo 5</p>
          <h2 className="text-[32px] font-black leading-tight text-white">Escolha o acabamento final</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {FINISH_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => applyGuidedFinishPreset(preset.id)} className={`rounded-[24px] border p-5 text-left transition-all hover:bg-brand/8 ${guidedInteractiveCardChrome}`}>
              <Sparkles size={18} className="mb-5 text-brand" />
              <h3 className="text-[14px] font-black text-white">{preset.label}</h3>
              <p className="mt-2 text-[10px] leading-5 text-zinc-500">{preset.description}</p>
            </button>
          ))}
        </div>
        <div className={`grid grid-cols-2 gap-6 rounded-[30px] border p-6 ${guidedPanelChrome}`}>
          <TransformControl label="Textura" value={guidedFinishScope === 'current' ? currentSlide?.options?.postFX?.noiseAmount ?? 0 : carousel?.projectFX?.noiseAmount ?? 0} min={0} max={1} step={0.01} onChange={(v) => { markHistoryMerge('guided-finish-texture'); if (guidedFinishScope === 'current') { updateSlideProperty(['options', 'postFX', 'noiseAmount'], v); } else { updateGlobalProperty(['projectFX', 'noiseAmount'], v); } }} />
          <TransformControl label="Bordas escurecidas" value={guidedFinishScope === 'current' ? currentSlide?.options?.postFX?.vignette ?? 0 : carousel?.projectFX?.vignette ?? 0} min={0} max={1} step={0.01} onChange={(v) => { markHistoryMerge('guided-finish-vignette'); if (guidedFinishScope === 'current') { updateSlideProperty(['options', 'postFX', 'vignette'], v); } else { updateGlobalProperty(['projectFX', 'vignette'], v); } }} />
        </div>
      </section>
      <aside className={`rounded-[28px] border p-6 ${guidedPanelChrome}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">Aplicar em</p>
        <div className="mt-4 grid gap-3">
          {[
            { id: 'all' as const, label: 'Aplicar em todos' },
            { id: 'current' as const, label: 'Aplicar so neste slide' },
          ].map((scope) => (
            <button key={scope.id} onClick={() => setGuidedFinishScope(scope.id)} className={`rounded-2xl border px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] ${guidedFinishScope === scope.id ? 'border-brand bg-brand/10 text-brand' : `${guidedCardChrome} text-zinc-300`}`}>
              {scope.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );

  const renderGuidedReviewStep = () => (
    <div className="grid h-full grid-cols-[1fr_420px] gap-8 overflow-hidden">
      <section className="space-y-7 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand">Passo 6</p>
          <h2 className="text-[32px] font-black leading-tight text-white">Revisar, baixar ou refinar</h2>
          <p className="text-[13px] leading-6 text-zinc-500">Quer ajustar algum detalhe no modo profissional? Abra o editor livre.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => setCurrentIndex(0)} className={`rounded-[28px] border p-6 text-left ${guidedInteractiveCardChrome}`}>
            <CheckCircle2 size={22} className="text-brand" />
            <h3 className="mt-5 text-[18px] font-black text-white">Revisar</h3>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">Ver todos os slides e problemas detectados.</p>
          </button>
          <button onClick={() => { setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i))); setShowExportModal(true); }} className="rounded-[28px] border border-brand/35 bg-brand/10 p-6 text-left hover:bg-brand/15">
            <Download size={22} className="text-brand" />
            <h3 className="mt-5 text-[18px] font-black text-white">Baixar</h3>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">Exportar PNG, ZIP ou tudo junto.</p>
          </button>
          <button onClick={() => { if (guardPendingImageFlow()) return; setStudioMode('advanced'); }} className={`rounded-[28px] border p-6 text-left ${guidedInteractiveCardChrome}`}>
            <Edit3 size={22} className="text-brand" />
            <h3 className="mt-5 text-[18px] font-black text-white">Editar livremente</h3>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">Abrir templates, imagem, marca, conteudo e avancado.</p>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {(carousel?.slides || []).map((slide, index) => (
            <button key={index} onClick={() => setCurrentIndex(index)} className={`rounded-[18px] border p-4 text-left ${currentIndex === index ? 'border-brand bg-brand/10 shadow-[0_14px_44px_rgba(56,189,248,0.18)]' : guidedCardChrome}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white">{getSlideDisplayLabel(slide, index)}</p>
              <p className="mt-2 truncate text-[10px] text-zinc-600">{slide.template || slide.contentTemplate || 'slide'}</p>
            </button>
          ))}
        </div>
      </section>
      <aside className={`min-h-0 overflow-y-auto rounded-[30px] border p-6 custom-scrollbar ${guidedPanelChrome}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">Problemas detectados</p>
        {guidedReviewIssues.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-5 text-[12px] leading-6 text-emerald-100">
            Nenhum problema critico encontrado nesta revisao inicial.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {guidedReviewIssues.map((issue, index) => (
              <button key={`${issue.type}-${issue.slideIndex}-${index}`} onClick={() => setCurrentIndex(issue.slideIndex)} className="w-full rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-left">
                <p className="text-[11px] font-black text-amber-100">{issue.label}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300/70">{issue.type.replace(/-/g, ' ')}</p>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );

  const renderGuidedStepContent = () => {
    switch (guidedStep) {
      case 'client':
        return renderGuidedClientStep();
      case 'visual':
        return renderGuidedVisualStep();
      case 'script':
        return renderGuidedScriptStep();
      case 'images':
        return renderGuidedImagesStep();
      case 'finish':
        return renderGuidedFinishStep();
      case 'review':
        return renderGuidedReviewStep();
      default:
        return null;
    }
  };

  const renderGuidedStudio = () => {
    if (!hasEnteredGuidedFlow) return renderGuidedStart();

    return (
      <main
        className="flex h-screen w-full flex-col text-zinc-300"
        style={{ background: 'linear-gradient(135deg, #05080c 0%, #080d13 54%, #050607 100%)' }}
      >
        <header className="flex items-center justify-between border-b border-[#101a27] bg-[#05080c]/95 px-6 py-4">
          <button onClick={() => setHasEnteredGuidedFlow(false)} className="flex items-center gap-3 text-left">
            {renderGuidedWordmark(false)}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (guardPendingImageFlow()) return; setStudioMode('advanced'); }}
              className="rounded-[13px] border border-[#172434] bg-[#071019] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300 transition-all hover:border-[#00adef] hover:text-[#00adef]"
            >
              Editor livre
            </button>
            <button
              onClick={() => { setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i))); setShowExportModal(true); }}
              className="rounded-[13px] bg-[#00adef] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white"
            >
              Baixar
            </button>
          </div>
        </header>
        <section className="min-h-0 flex-1 p-6">
          {renderGuidedStepContent()}
        </section>
      </main>
    );
  };

  return (
    <div onDragOver={handleGlobalDragOver} onDragLeave={handleGlobalDragLeave} onDrop={handleGlobalDrop} className="flex h-screen w-full bg-[#050507] text-zinc-300 font-sans overflow-hidden relative">
      {isDraggingFile && (
        <div className="fixed inset-0 z-[10000] bg-brand/10 backdrop-blur-sm border-4 border-dashed border-brand/50 flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900 p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95">
             <Upload size={64} className="text-brand animate-bounce" />
             <p className="text-xl font-black text-white uppercase italic tracking-tighter">Solte o arquivo para importar</p>
          </div>
        </div>
      )}

      {showPasteTargetModal && pendingPastedImage && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in" onClick={() => { setShowPasteTargetModal(false); setPendingPastedImage(null); }}>
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[36px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand">CTRL+V</p>
              <h2 className="text-xl font-black text-white tracking-tight">Para onde essa imagem deve ir?</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {pendingImageTargetOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    void beginImageStaging(option.id, pendingPastedImage);
                    setShowPasteTargetModal(false);
                    setPendingPastedImage(null);
                  }}
                  className="w-full p-4 rounded-2xl border border-white/5 bg-white/5 hover:border-brand/50 hover:bg-brand/10 transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center text-brand">
                    <option.icon size={18} />
                  </div>
                  <span className="text-[12px] font-black text-white">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showScriptComposerModal && (
        <div className="fixed inset-0 z-[440] flex items-center justify-center p-6 bg-black/92 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowScriptComposerModal(false)}>
          <div className="w-full max-w-6xl bg-zinc-950 border border-white/10 rounded-[36px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-brand">Heuristica</p>
                <h2 className="text-xl font-black text-white">Gerar carrossel por roteiro bruto</h2>
                <p className="text-[11px] text-zinc-500 font-medium">Cole um texto com `Slide 1`, `Slide 2` e deixe a plataforma montar o JSON base.</p>
              </div>
              <button onClick={() => setShowScriptComposerModal(false)} className="p-3 rounded-full hover:bg-white/5 text-zinc-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-[1.15fr_0.85fr] gap-6">
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Roteiro bruto</p>
                <textarea
                  value={rawScriptInput}
                  onChange={(e) => setRawScriptInput(e.target.value)}
                  placeholder={`Slide 1 - O que mudou\nA lei mudou, mas ainda compensa.\n\nSlide 2 - Canais que funcionam\n- SEO orgânico\n- Parcerias B2B`}
                  className="w-full min-h-[420px] bg-black/40 p-5 font-mono text-[12px] leading-6 border border-white/5 rounded-3xl outline-none text-white custom-scrollbar"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Preview heuristico</p>
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
                    {rawScriptPreview.length} slides
                  </span>
                </div>
                <div className="min-h-[420px] max-h-[420px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {rawScriptPreview.length === 0 ? (
                    <div className="h-full rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-[11px] text-zinc-500">
                      O parser mostra aqui o tipo do slide e o content template sugerido antes de gerar o JSON.
                    </div>
                  ) : rawScriptPreview.map((preview) => (
                    <div key={preview.index} className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">
                            {preview.kind === 'cover' ? 'Capa' : `Slide ${preview.index}`}
                          </p>
                          <p className="text-[12px] font-black text-white leading-snug">{preview.title}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-black/40 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                          {preview.selection.templateId.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-brand">
                          {preview.analysis.type}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                          conteudo
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                          {preview.analysis.textLength} chars
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                          {preview.analysis.visualWeightHint}
                        </span>
                        {preview.analysis.itemCount > 0 && (
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                            {preview.analysis.itemCount} itens
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[10px] text-zinc-500 font-medium">A geração mantém branding, fontes e FX globais atuais e cria só a base dos slides.</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowScriptComposerModal(false)} className="px-6 py-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.14em]">
                  Cancelar
                </button>
                <button onClick={handleGenerateFromRawScript} className="px-6 py-3 rounded-2xl bg-brand text-black hover:bg-brand/85 transition-all text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-2">
                  <Sparkles size={14} />
                  Gerar Carrossel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSingleSlideScriptModal && currentSlide && (
        <div className="fixed inset-0 z-[442] flex items-center justify-center p-6 bg-black/92 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowSingleSlideScriptModal(false)}>
          <div className="w-full max-w-6xl bg-zinc-950 border border-white/10 rounded-[36px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-brand">Roteiro por Slide</p>
                <h2 className="text-xl font-black text-white">
                  {isCoverSlide ? 'Gerar capa individualmente' : `Gerar ${getSlideDisplayLabel(currentSlide, currentIndex)} individualmente`}
                </h2>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Escolha entre um ajuste pontual, preservando a estrutura atual, ou substituição completa do slide com nova heurística só aqui.
                </p>
              </div>
              <button onClick={() => setShowSingleSlideScriptModal(false)} className="p-3 rounded-full hover:bg-white/5 text-zinc-500">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-[1.08fr_0.92fr] gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Modo de aplicação</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        id: 'patch' as const,
                        title: 'Ajuste pontual',
                        description: 'Mantém template e imagem atuais, trocando só o conteúdo compatível deste slide.',
                      },
                      {
                        id: 'replace' as const,
                        title: 'Substituir slide',
                        description: 'Permite trocar o template e o layout de imagem só neste slide.',
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSingleSlideScriptMode(option.id)}
                        className={`rounded-3xl border p-4 text-left transition-all ${
                          singleSlideScriptMode === option.id
                            ? 'border-brand bg-brand/10'
                            : 'border-white/5 bg-white/[0.03] hover:border-white/10'
                        }`}
                      >
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${singleSlideScriptMode === option.id ? 'text-brand' : 'text-white'}`}>
                          {option.title}
                        </p>
                        <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Roteiro do slide</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
                      {singleSlideScriptMode === 'patch' ? 'modo pontual' : 'modo replace'}
                    </span>
                  </div>
                  <textarea
                    value={singleSlideScriptInput}
                    onChange={(e) => setSingleSlideScriptInput(e.target.value)}
                    placeholder={isCoverSlide
                      ? `Título: Nem toda dor na bexiga\nSubtítulo: Quando o sintoma engana\nTexto: Às vezes o problema não nasce no sistema urinário.`
                      : `Título: Onde o erro começa\nTexto: Valores muito baixos indicam economia em três pilares fatais.\nLista:\n- segurança\n- tecnologia\n- tempo`}
                    className="w-full min-h-[420px] bg-black/40 p-5 font-mono text-[12px] leading-6 border border-white/5 rounded-3xl outline-none text-white custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Preview do resultado</p>
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
                    {singleSlideScriptPreview.result ? 'pronto para aplicar' : 'aguardando roteiro'}
                  </span>
                </div>

                {!singleSlideScriptInput.trim() ? (
                  <div className="min-h-[420px] rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-[11px] text-zinc-500">
                    O preview mostra aqui o template final, o layout de imagem e um resumo dos blocos que entrarão só neste slide.
                  </div>
                ) : singleSlideScriptPreview.error ? (
                  <div className="min-h-[420px] rounded-3xl border border-red-400/20 bg-red-400/8 p-6 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-300">Falha no preview</p>
                    <p className="text-[11px] leading-relaxed text-zinc-300">{singleSlideScriptPreview.error}</p>
                  </div>
                ) : singleSlideScriptPreview.result ? (
                  <div className="min-h-[420px] max-h-[420px] overflow-y-auto custom-scrollbar rounded-3xl border border-white/5 bg-white/[0.03] p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Template</p>
                        <p className="text-[12px] font-black text-white">{singleSlideScriptPreview.result.contentTemplateId}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Imagem</p>
                        <p className="text-[12px] font-black text-white">{singleSlideScriptPreview.result.imageLayoutId}</p>
                      </div>
                    </div>

                    {singleSlideScriptPreview.result.warnings.length > 0 && (
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">Aviso</p>
                        {singleSlideScriptPreview.result.warnings.map((warning, index) => (
                          <p key={index} className="text-[10px] leading-relaxed text-zinc-300">{warning}</p>
                        ))}
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Blocos gerados</p>
                      <div className="space-y-2">
                        {singleSlideScriptPreview.result.slide.blocks.slice(0, 6).map((block, index) => (
                          <div key={`${block.type}-${index}`} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 space-y-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-brand">{block.type}</p>
                            <p className="text-[11px] leading-relaxed text-white">
                              {Array.isArray(block.content) ? block.content.join(' • ') : String(block.content || '')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Como isso vai aplicar</p>
                      <p className="text-[10px] leading-relaxed text-zinc-300">
                        {singleSlideScriptMode === 'patch'
                          ? 'Template, imagem e ajustes locais são mantidos. O roteiro atualiza só o conteúdo compatível deste slide.'
                          : 'Este slide será recomposto por heurística, mas o branding local e a imagem atual serão reaproveitados quando fizer sentido.'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[10px] text-zinc-500 font-medium">
                {singleSlideScriptMode === 'patch'
                  ? 'Use ajuste pontual para corrigir ou complementar um slide sem mexer na estrutura visual.'
                  : 'Use substituir slide quando quiser reinterpretar completamente só este slide.'}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSingleSlideScriptModal(false)} className="px-6 py-3 rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.14em]">
                  Cancelar
                </button>
                <button onClick={handleGenerateCurrentSlideFromScript} className="px-6 py-3 rounded-2xl bg-brand text-black hover:bg-brand/85 transition-all text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-2">
                  <Sparkles size={14} />
                  Aplicar neste slide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] px-12 py-6 rounded-[32px] flex items-center gap-6 animate-in slide-in-from-bottom-12 fade-in duration-500 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-3xl border border-white/10 pointer-events-none ${toast.type === 'success' ? 'bg-brand/95 text-black' : 'bg-red-500/95 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={28} strokeWidth={3} /> : <AlertCircle size={28} strokeWidth={3} />}
          <span className="text-[16px] font-black uppercase tracking-[0.1em]">{toast.message}</span>
        </div>
      )}

      <input type="file" ref={importInputRef} onChange={handleImportProject} accept=".json" className="hidden" />
      <input type="file" ref={fontInputRef} onChange={handleFontUpload} accept=".ttf,.otf,.woff2" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={bgImageInputRef} onChange={handleBgImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={overlayImageInputRef} onChange={handleOverlayImageUpload} accept="image/*" className="hidden" />



      {showExportModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setShowExportModal(false)}>
           <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Exportar Carrossel</h2>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">ZIP conterá imagens + JSON do projeto</p>
                 </div>
                 <button onClick={() => setShowExportModal(false)} className="p-3 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                 {carousel?.slides.map((s, idx) => (
                    <button key={idx} onClick={() => { const next = new Set(selectedSlidesToExport); if (next.has(idx)) next.delete(idx); else next.add(idx); setSelectedSlidesToExport(next); }} className={`relative aspect-[4/5] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden ${selectedSlidesToExport.has(idx) ? 'border-brand bg-brand/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}>
                       <div className={`min-w-10 h-10 rounded-full flex items-center justify-center px-3 ${selectedSlidesToExport.has(idx) ? 'bg-brand text-black' : 'bg-zinc-800 text-zinc-500'}`}><span className="font-black text-xs">{s?.cover ? 'Capa' : getSlideDisplayNumber(s, idx)}</span></div>
                       <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest truncate px-2 w-full">{s.template.replace(/_/g, ' ')}</p>
                       {selectedSlidesToExport.has(idx) && (<div className="absolute top-2 right-2 text-brand"><CheckCircle2 size={16} /></div>)}
                    </button>
                 ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-white/5">
                 <button onClick={() => setSelectedSlidesToExport(new Set())} className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all">Limpar</button>
                 <button onClick={() => setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i)))} className="px-6 py-5 text-[10px] font-black text-brand uppercase tracking-widest hover:text-brand/80 transition-all">Todos</button>
                 <button onClick={startBatchExport} disabled={selectedSlidesToExport.size === 0 || hasPendingImageDraft} className="flex-1 py-5 bg-brand hover:bg-brand/80 disabled:opacity-30 text-black font-black uppercase rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"><Download size={18} strokeWidth={3} /> Gerar {selectedSlidesToExport.size} Slides</button>
              </div>
           </div>
        </div>
      )}

      {editingIconBlock && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setEditingIconBlock(null)}>
           <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Escolher Ícone</h2>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Biblioteca ou CTRL+V para PNG</p>
                 </div>
                 <button onClick={() => setEditingIconBlock(null)} className="p-3 hover:bg-white/5 rounded-full text-zinc-500"><X size={24}/></button>
              </div>
              <div className="space-y-4">
                 <div className="relative">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                   <input
                     type="text"
                     placeholder="Buscar na Lucide por nome..."
                     className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-sm font-bold text-white outline-none focus:border-brand/50 transition-all"
                     value={iconSearchQuery}
                     onChange={(e) => setIconSearchQuery(e.target.value)}
                   />
                 </div>
                 {!iconSearchQuery.trim() && (
                   <div className="space-y-3">
                     {recentLucideIcons.length > 0 && (
                       <div className="space-y-3">
                         <div className="flex items-center justify-between px-1">
                           <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">Recentes</span>
                           <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">{recentLucideIcons.length} usados</span>
                         </div>
                         <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-1">
                           {recentLucideIcons.map((item) => {
                             const IconComponent = (Icons as any)[item.id];
                             if (!IconComponent) return null;
                             return (
                               <button
                                 key={`recent-${item.id}`}
                                 onClick={() => {
                                   updateSlideProperties(buildIconEditUpdates(editingIconBlock, { icon: item.id, customIcon: undefined }));
                                   rememberRecentIcon(item.id);
                                   setEditingIconBlock(null);
                                 }}
                                 className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all group ${currentEditingIconSelection.icon === item.id ? 'border-brand bg-brand/10 text-brand' : 'border-white/5 bg-black/40 hover:border-brand/50'}`}
                               >
                                 <IconComponent size={32} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
                                 <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 group-hover:text-brand text-center leading-tight">{item.label}</span>
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     )}
                     <div className="flex items-center justify-between px-1">
                       <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">Principais</span>
                       <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">{ICON_LIBRARY_PRESETS.length} favoritos</span>
                     </div>
                     <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-1">
                        {ICON_LIBRARY_PRESETS.map(item => (
                           <button key={item.id} onClick={() => { updateSlideProperties(buildIconEditUpdates(editingIconBlock, { icon: item.id, customIcon: undefined })); rememberRecentIcon(item.id); setEditingIconBlock(null); }} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all group ${currentEditingIconSelection.icon === item.id ? 'border-brand bg-brand/10 text-brand' : 'border-white/5 bg-black/40 hover:border-brand/50'}`}><item.icon size={32} strokeWidth={1.5} className="transition-transform group-hover:scale-110" /><span className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 group-hover:text-brand">{item.label}</span></button>
                        ))}
                     </div>
                   </div>
                 )}
                 <div className="space-y-3">
                   <div className="flex items-center justify-between px-1">
                     <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">{iconSearchQuery.trim() ? 'Resultados' : 'Todos os Ícones'}</span>
                     <span className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">{filteredLucideIcons.length} ícones</span>
                   </div>
                   <div className="max-h-[420px] overflow-y-auto custom-scrollbar rounded-[28px] border border-white/5 bg-black/20 p-4">
                     <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
                       {filteredLucideIcons.map((item) => {
                         const IconComponent = (Icons as any)[item.id];
                         if (!IconComponent) return null;
                         return (
                           <button
                             key={item.id}
                             onClick={() => { updateSlideProperties(buildIconEditUpdates(editingIconBlock, { icon: item.id, customIcon: undefined })); rememberRecentIcon(item.id); setEditingIconBlock(null); }}
                             className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border transition-all group ${currentEditingIconSelection.icon === item.id ? 'border-brand bg-brand/10 text-brand' : 'border-white/5 bg-black/40 hover:border-brand/50'}`}
                             title={item.label}
                           >
                             <IconComponent size={28} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
                             <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 group-hover:text-brand text-center leading-tight">
                               {item.label}
                             </span>
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-black uppercase text-zinc-500 px-1 tracking-widest">Personalizado (URL ou SVG)</label>
                 <div className="flex gap-3"><input type="text" placeholder="https://... ou <svg..." className="flex-1 bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" value={iconInput} onChange={(e) => setIconInput(e.target.value)} /><button onClick={() => { updateSlideProperties(buildIconEditUpdates(editingIconBlock, { customIcon: iconInput, icon: undefined })); setEditingIconBlock(null); }} className="px-8 py-4 bg-zinc-800 text-white font-black uppercase text-[10px] rounded-2xl hover:bg-zinc-700 transition-all">Aplicar</button></div>
              </div>
           </div>
        </div>
      )}

      {isCreatingPalette && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => { setIsCreatingPalette(false); setEditingPaletteId(null); }}>
           <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{editingPaletteId ? 'Editar Branding' : 'Novo Branding'}</h2>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Cores e Fontes mestras da marca</p>
                 </div>
                 <button onClick={() => { setIsCreatingPalette(false); setEditingPaletteId(null); }} className="p-3 hover:bg-white/5 rounded-full text-zinc-500"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <input type="text" value={newPaletteData.name} onChange={(e) => setNewPaletteData({ ...newPaletteData, name: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-base text-white font-bold outline-none focus:border-brand/50 transition-all" placeholder="Nome da Marca" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newPaletteData.font_padrao} onChange={(e) => setNewPaletteData({ ...newPaletteData, font_padrao: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-3 text-[11px] font-bold text-white outline-none">
                    {allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <select value={newPaletteData.font_destaque} onChange={(e) => setNewPaletteData({ ...newPaletteData, font_destaque: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-3 text-[11px] font-bold text-white outline-none">
                    {allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-5 gap-4">
                   {['Fundo', 'Texto', 'Accent', 'HL', 'Cards'].map((l, i) => (
                     <div key={i} className="flex flex-col items-center gap-2">
                       <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                         <input type="color" value={newPaletteData.colors[i]} onChange={(e) => { const c = [...newPaletteData.colors]; c[i] = e.target.value; setNewPaletteData({ ...newPaletteData, colors: c }); }} className="absolute inset-[-10px] w-[150%] h-[150%] cursor-pointer p-0 m-0 border-none" />
                       </div>
                       <span className="text-[7px] font-black uppercase text-zinc-600">{l}</span>
                     </div>
                   ))}
                </div>
              </div>
              <button onClick={handleCreatePalette} className="w-full py-4 bg-brand text-black font-black uppercase rounded-2xl shadow-2xl transition-all">Sincronizar Branding</button>
           </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-3xl animate-in fade-in">
           <div className="w-full max-w-md space-y-10 text-center px-10">
              <div className="relative inline-block"><div className="absolute inset-0 blur-3xl bg-brand/20 animate-pulse rounded-full" /><Loader2 size={64} className="animate-spin text-brand relative mx-auto" strokeWidth={3} /></div>
              <div className="space-y-4"><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter animate-pulse">{exportStatus}</h2><div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand transition-all duration-500" style={{ width: `${exportProgress}%` }} /></div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{exportProgress}% COMPLETO</p></div>
           </div>
        </div>
      )}

      {studioMode === 'guided' ? renderGuidedStudio() : (
      <div className="flex h-screen w-full">
        <aside className="w-[440px] border-r border-white/5 flex flex-col bg-zinc-900/50 backdrop-blur-2xl z-20 shrink-0">
          <header className="p-5 border-b border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button onClick={() => importInputRef.current?.click()} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-500 transition-all"><Upload size={18} /></button>
              <img src={LOGO_URL} className="h-8 object-contain" />
              <div className="w-9" />
            </div>
            <nav className="grid grid-cols-6 gap-1 p-1 bg-black/40 rounded-xl">
              {[
                { id: 'TEMPLATES', icon: Library, label: 'Templates' },
                { id: 'IMAGE', icon: ImageIcon, label: 'Imagem' },
                { id: 'BRAND', icon: Palette, label: 'Marca' },
                { id: 'CONTENT', icon: TypeIcon, label: 'Conteudo' },
                { id: 'REFINE', icon: Sparkles, label: 'Refino' },
                { id: 'ADVANCED', icon: FileJson, label: 'Avancado' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id !== 'IMAGE' && guardPendingImageFlow()) return;
                    setActiveTab(tab.id as any);
                  }}
                  className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                >
                  <tab.icon size={15} />
                  <span className="text-[8px] font-black uppercase tracking-[0.14em]">{tab.label}</span>
                </button>
              ))}
            </nav>
          </header>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
            <section className="rounded-[28px] border border-white/5 bg-black/30 px-5 py-4 shadow-inner">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.24em] text-brand">{activeTabMeta.eyebrow}</p>
                  <h2 className="text-[14px] font-black text-white leading-tight">{activeTabMeta.title}</h2>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">
                  {activeTabMeta.scope}
                </span>
              </div>
            </section>
            {activeTab === 'TEMPLATES' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <button
                  onClick={() => setShowScriptComposerModal(true)}
                  className="w-full p-4 rounded-2xl border border-brand/30 bg-brand/10 hover:bg-brand/15 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand text-black flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-brand">Gerar por roteiro</p>
                      <p className="text-[8px] text-zinc-400 font-medium">Cole Slide 1, Slide 2... e a heurística monta o JSON base</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-brand shrink-0" />
                </button>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1 px-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.24em] text-brand">Templates oficiais</p>
                    <h3 className="text-[12px] font-black text-white">Conteúdo e imagem vivem separados</h3>
                    <p className="text-[10px] leading-relaxed text-zinc-500">
                      Você escolhe uma das 4 famílias canônicas de conteúdo e, quando o slide realmente usa imagem, escolhe também a família visual da imagem. Sem ruído histórico no catálogo.
                    </p>
                  </div>

                  {!isCoverSlide && currentSlideFit && currentSlideFit.status !== 'fits' && (
                    <div
                      className={`rounded-2xl border p-4 space-y-1 ${
                        currentSlideFit.status === 'fits_shrunk'
                          ? 'border-amber-400/25 bg-amber-400/8'
                          : 'border-red-400/25 bg-red-400/8'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                          currentSlideFit.status === 'fits_shrunk' ? 'text-amber-300' : 'text-red-300'
                        }`}
                      >
                        {currentSlideFit.status === 'fits_shrunk' ? 'Layout comprimido' : 'Template não comporta o conteúdo'}
                      </p>
                      <p className="text-[10px] leading-relaxed text-zinc-300">
                        {currentSlideFit.message}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Conteúdo</span>
                        <span className="text-[9px] font-mono text-brand">
                          {currentVisibleContentTemplateId || 'n/a'}
                        </span>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {visibleContentTemplateOptionsForCurrentSlide.map((contentTemplateOption) => {
                          const isActive = contentTemplateOption.id === currentVisibleContentTemplateId;
                          return (
                            <button
                              key={contentTemplateOption.id}
                              type="button"
                              onClick={() => applyVisibleContentTemplateSelection(contentTemplateOption)}
                              className={`w-full rounded-2xl border p-3 text-left transition-all ${
                                isActive
                                  ? 'bg-brand/10 border-brand'
                                  : 'bg-white/[0.03] border-white/6 hover:border-white/14'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className={`text-[10px] font-black uppercase ${isActive ? 'text-brand' : 'text-white'}`}>
                                  {contentTemplateOption.name}
                                </p>
                                <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                  {contentTemplateOption.allowedBlockCount} blocos
                                </span>
                              </div>
                              <p className="mt-1 text-[9px] leading-relaxed text-zinc-500">{contentTemplateOption.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Imagem</span>
                        <span className="text-[9px] font-mono text-brand">
                          {isCoverSlide ? 'COVER_IMAGES' : (hasActiveImageTemplate ? (currentSlideComposition?.imageLayoutId || 'n/a') : 'SEM_IMAGEM')}
                        </span>
                      </div>
                      {isCoverSlide ? (
                        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 space-y-2">
                          <p className="text-[10px] font-black uppercase text-brand">Modo de capa</p>
                          <p className="text-[9px] leading-relaxed text-zinc-400">
                            A capa usa <span className="font-black text-white">Imagem Fundo</span> e <span className="font-black text-white">Imagem Destaque</span> no editor próprio.
                            Ela não usa `imageLayout` comum, então não deve aparecer como `None` aqui.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-1 space-y-3">
                          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className={`text-[10px] font-black uppercase ${!hasActiveImageTemplate ? 'text-brand' : 'text-white'}`}>
                                Sem imagem
                              </p>
                              <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                estado
                              </span>
                            </div>
                            <p className="text-[9px] leading-relaxed text-zinc-500">
                              Este slide usa só conteúdo. Nenhum template de imagem está ativo.
                            </p>
                            <button
                              type="button"
                              onClick={() => applySlideCompositionSelection(undefined, 'IMAGE_NONE')}
                              className={`w-full rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] transition-all ${
                                !hasActiveImageTemplate
                                  ? 'bg-brand text-black border-brand'
                                  : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              Manter sem imagem
                            </button>
                          </div>
                          {groupedImageLayouts.map((group) => (
                            <div key={group.id} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => applyImageLayoutFamilySelection(group.id)}
                                className={`w-full rounded-2xl border p-3 text-left transition-all ${
                                  currentImageLayoutFamily?.id === group.id
                                    ? 'bg-brand/10 border-brand'
                                    : 'bg-white/[0.03] border-white/6 hover:border-white/14'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className={`text-[10px] font-black uppercase ${currentImageLayoutFamily?.id === group.id ? 'text-brand' : 'text-white'}`}>
                                    {group.name}
                                  </p>
                                  <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                    {group.directionOptions.length > 1 ? 'direção' : 'fixo'}
                                  </span>
                                </div>
                                <p className="mt-1 text-[9px] leading-relaxed text-zinc-500">{group.description}</p>
                              </button>

                              {currentImageLayoutFamily?.id === group.id && group.directionOptions.length > 1 && (
                                <div className="grid grid-cols-2 gap-2 px-1">
                                  {group.directionOptions.filter((direction) => direction !== 'center').map((direction) => {
                                    const nextLayoutId = getImageLayoutIdForFamilyDirection(group.id, direction);
                                    const isActive = nextLayoutId ? currentSlideComposition?.imageLayoutId === nextLayoutId : false;
                                    return (
                                      <button
                                        key={direction}
                                        type="button"
                                        onClick={() => nextLayoutId && applySlideCompositionSelection(undefined, nextLayoutId)}
                                        className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] transition-all ${
                                          isActive
                                            ? 'bg-brand text-black border-brand'
                                            : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        {imageDirectionLabel(direction)}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'BRAND' ? (
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Search size={16} className="text-brand" />
                      <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Clientes</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setIsCreatingPalette(true)} className="p-2 bg-brand/10 text-brand rounded-xl hover:bg-brand/20 transition-all">
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="text"
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      placeholder="Buscar cliente ou instagram"
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                    />
                  </div>
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {filteredBrandPresets.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPalettePreset(preset)}
                          className={`w-full p-4 border rounded-[22px] flex items-center justify-between gap-4 text-left transition-all cursor-pointer ${activePaletteId === preset.id ? 'bg-brand/10 border-brand shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] font-black uppercase tracking-widest truncate ${activePaletteId === preset.id ? 'text-brand' : 'text-white'}`}>
                              {preset.name}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 truncate">
                              {preset.instagram ? `@${preset.instagram}` : 'Cliente / marca'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex -space-x-1.5">
                              {getBrandPaletteSwatches(preset).map((color: string, index: number) => (
                                <div key={`${preset.id}-${index}`} className="w-5 h-5 rounded-full border-2 border-zinc-950" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            {!DEFAULT_BRAND_PRESETS.find((item) => item.id === preset.id) && (
                              <button
                                onClick={(e) => handleEditPalette(e, preset)}
                                className="p-1.5 text-zinc-500 hover:text-brand transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Palette size={16} className="text-brand" />
                    <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Ajustes Rapidos da Marca</h3>
                  </div>
                  <div className="space-y-6">
                    <ColorPropertyControl
                      label="Brand Color"
                      value={currentBrandTheme.accent || TOKENS.colors.accent}
                      paletteColors={activePaletteColors}
                      onChange={(val) => updateGlobalProperty(['brandTheme', 'accent'], val)}
                    />
                    <ColorPropertyControl
                      label="Fundo Global"
                      value={currentBrandTheme.background || TOKENS.colors.background}
                      paletteColors={activePaletteColors}
                      onChange={(val) => updateGlobalProperty(['brandTheme', 'background'], val)}
                    />
                    <ColorPropertyControl
                      label="Texto Global"
                      value={currentBrandTheme.text || TOKENS.colors.textPrimary}
                      paletteColors={activePaletteColors}
                      onChange={(val) => updateGlobalProperty(['brandTheme', 'text'], val)}
                    />
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Frame size={16} className="text-brand" />
                    <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Espacamento Global</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Aplica margens e espacamento em todos os slides.</p>
                    {(!globalSpacing.paddingIsUniform || !globalSpacing.blockGapIsUniform) && (
                      <p className="text-[8px] uppercase tracking-[0.16em] text-zinc-600">Os slides estavam com valores mistos. Ao mexer aqui, tudo sera unificado.</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <TransformControl
                      label="Margens Globais"
                      value={globalSpacing.padding}
                      min={20}
                      max={200}
                      step={4}
                      onChange={(value) => updateAllSlidesOption('padding', value)}
                    />
                    <TransformControl
                      label="Espacamento Global"
                      value={globalSpacing.blockGap}
                      min={0}
                      max={160}
                      step={2}
                      onChange={(value) => updateAllSlidesOption('blockGap', value)}
                    />
                  </div>
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setShowBrandAdvanced((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">Sistema Completo de Cores</p>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500">Mapa global inteiro. Abra so quando quiser refinar.</p>
                    </div>
                    {showBrandAdvanced ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                  </button>
                  {showBrandAdvanced && (
                    <div className="space-y-6 rounded-[24px] border border-white/5 bg-black/20 p-4">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-zinc-500">Ordem Global</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ['Fundo', currentBrandTheme.background || TOKENS.colors.background],
                            ['Texto', currentBrandTheme.text || TOKENS.colors.textPrimary],
                            ['Brand', currentBrandTheme.accent || TOKENS.colors.accent],
                            ['HL Fundo', currentBrandTheme.hlBgColor || currentBrandTheme.accent || TOKENS.colors.accent],
                            ['HL Texto', currentBrandTheme.hlTextColor || currentBrandTheme.black || '#141414'],
                            ['Card Fundo', currentBrandTheme.cardBg || currentBrandTheme.accent || TOKENS.colors.accent],
                            ['Card Texto', currentBrandTheme.cardTextColor || currentBrandTheme.black || '#141414'],
                            ['Branco', currentBrandTheme.white || '#efefef'],
                            ['Preto', currentBrandTheme.black || '#141414'],
                          ].map(([label, color]) => (
                            <div key={String(label)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                              <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: String(color) }} />
                              <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <ColorPropertyControl
                        label="Highlight Global"
                        value={currentBrandTheme.hlBgColor || currentBrandTheme.accent || TOKENS.colors.accent}
                        paletteColors={activePaletteColors}
                        onChange={(val) => updateGlobalProperty(['brandTheme', 'hlBgColor'], val)}
                      />
                      <ColorPropertyControl
                        label="Texto Highlight"
                        value={currentBrandTheme.hlTextColor || currentBrandTheme.black || '#141414'}
                        paletteColors={activePaletteColors}
                        onChange={(val) => updateGlobalProperty(['brandTheme', 'hlTextColor'], val)}
                      />
                      <ColorPropertyControl
                        label="Card Global"
                        value={currentBrandTheme.cardBg || currentBrandTheme.accent || TOKENS.colors.accent}
                        paletteColors={activePaletteColors}
                        onChange={(val) => updateGlobalProperty(['brandTheme', 'cardBg'], val)}
                      />
                      <ColorPropertyControl
                        label="Texto de Card"
                        value={currentBrandTheme.cardTextColor || currentBrandTheme.black || '#141414'}
                        paletteColors={activePaletteColors}
                        onChange={(val) => updateGlobalProperty(['brandTheme', 'cardTextColor'], val)}
                      />
                      <div className="grid grid-cols-1 gap-6 pt-2 border-t border-white/5">
                        <ColorPropertyControl
                          label="Branco Base"
                          value={currentBrandTheme.white || '#efefef'}
                          paletteColors={activePaletteColors}
                          onChange={(val) => updateGlobalProperty(['brandTheme', 'white'], val)}
                        />
                        <ColorPropertyControl
                          label="Preto Base"
                          value={currentBrandTheme.black || '#141414'}
                          paletteColors={activePaletteColors}
                          onChange={(val) => updateGlobalProperty(['brandTheme', 'black'], val)}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4 pt-6 border-t border-white/5 pb-10">
                  <button
                    onClick={() => setShowBrandFonts((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">Fontes da Marca</p>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500">{clientFonts.length} carregadas para este cliente</p>
                    </div>
                    {showBrandFonts ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                  </button>
                  {showBrandFonts && (
                    <div className="space-y-5 rounded-[24px] border border-white/5 bg-black/20 p-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte Padrão Global</label>
                        <select
                          value={currentBrandTheme.fontPadrão || 'Inter'}
                          onChange={(e) => updateGlobalProperty(['brandTheme', 'fontPadrão'], e.target.value)}
                          className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                        >
                          {allFontOptions.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte Destaque Global</label>
                        <select
                          value={currentBrandTheme.fontDestaque || currentBrandTheme.fontPadrão || 'Inter'}
                          onChange={(e) => updateGlobalProperty(['brandTheme', 'fontDestaque'], e.target.value)}
                          className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                        >
                          {allFontOptions.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
                        </select>
                      </div>

                      <div className="bg-black/20 p-4 rounded-xl max-h-40 overflow-y-auto text-xs font-mono text-white/60">
                        {clientFonts.length === 0 ? (
                          <p className="opacity-50">Nenhuma fonte carregada.</p>
                        ) : (
                          <ul className="space-y-1">
                            {clientFonts.map((font, index) => (
                              <li key={index} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                                <span style={{ fontFamily: `"${font.family}"` }}>{font.name}</span>
                                <span className="opacity-50 text-[10px]">{font.family}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : activeTab === 'REFINE' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-2.5"><Sparkles size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Post FX</h3></div>
                <section className="space-y-10">
                  <TransformControl label="Ruído Global" value={carousel?.projectFX?.noiseAmount ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'noiseAmount'], v)} />
                  <TransformControl label="Vinheta Global" value={carousel?.projectFX?.vignette ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'vignette'], v)} />
                </section>
                <section className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5"><Focus size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Override Deste Slide</h3></div>
                    <button
                      onClick={() => updateSlideProperty(['options', 'postFX'], undefined)}
                      className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      Limpar Override
                    </button>
                  </div>
                  <TransformControl label="Ruído Local" value={currentSlide?.options?.postFX?.noiseAmount ?? carousel?.projectFX?.noiseAmount ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'noiseAmount'], v)} />
                  <TransformControl label="Vinheta Local" value={currentSlide?.options?.postFX?.vignette ?? carousel?.projectFX?.vignette ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'vignette'], v)} />
                </section>
              </div>
            ) : activeTab === 'CONTENT' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  {currentSlide ? (
                    <>
                      <section className="space-y-4 rounded-[28px] border border-white/5 bg-black/30 p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-brand">Roteiro Individual</p>
                            <h3 className="text-[13px] font-black text-white">
                              {isCoverSlide ? 'Gerar a capa por roteiro' : `Gerar ${getSlideDisplayLabel(currentSlide, currentIndex)} por roteiro`}
                            </h3>
                            <p className="text-[10px] leading-relaxed text-zinc-500">
                              Faça um ajuste pontual mantendo a estrutura atual ou substitua completamente só este slide, sem tocar no restante do carrossel.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowSingleSlideScriptModal(true)}
                            className="shrink-0 p-4 rounded-2xl border border-brand/30 bg-brand/10 hover:bg-brand/15 transition-all flex items-center gap-3"
                          >
                            <Sparkles size={16} className="text-brand" />
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">Gerar este slide</span>
                          </button>
                        </div>
                      </section>

                      {isCoverSlide ? (
                        <section className="space-y-6 rounded-[28px] border border-white/5 bg-black/30 p-6">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-brand">Editor da Capa</p>
                            <h3 className="text-[13px] font-black text-white">Hierarquia exclusiva do slide 1</h3>
                            <p className="text-[10px] leading-relaxed text-zinc-500">
                              A capa continua com sua hierarquia própria, mas agora você consegue ajustar tipografia, largura, alinhamento e cor de cada camada como no resto do editor.
                            </p>
                          </div>

                          <div className="space-y-5 pt-2 border-t border-white/5">
                            {coverLayerConfigs.map((layer) => {
                              const layerOptions = currentSlide.cover?.textOptions?.[layer.key];
                              const defaultFontSize = getDefaultCoverLayerFontSize(layer.key, currentSlide.cover);
                              const defaultWeight = getDefaultCoverLayerWeight(layer.key);
                              const defaultVariant = layer.key === 'titleMain' ? 'destaque' : 'padrão';

                              return (
                                <div key={layer.key} className="space-y-4 rounded-[24px] border border-white/5 bg-black/20 p-4">
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">{layer.label}</span>
                                    <SafeTextArea
                                      value={currentSlide.cover?.text?.[layer.key] || ''}
                                      onChange={(val) => updateSlideProperty(['cover', 'text', layer.key], val || undefined)}
                                      className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-[13px] font-medium text-white outline-none focus:border-brand/50 custom-scrollbar resize-none transition-all"
                                      placeholder={layer.placeholder}
                                      style={{ minHeight: layer.minHeight } as any}
                                    />
                                  </div>

                                  <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Estilo</span>
                                        <select
                                          value={layerOptions?.fontVariant || defaultVariant}
                                          onChange={(e) => updateSlideProperty(['cover', 'textOptions', layer.key, 'fontVariant'], e.target.value)}
                                          className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-3 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer"
                                        >
                                          <option value="padrão">Padrão</option>
                                          <option value="destaque">Destaque</option>
                                        </select>
                                      </div>
                                      <StepperNumberControl
                                        label="Tamanho"
                                        value={layerOptions?.fontSize ?? defaultFontSize}
                                        min={10}
                                        max={240}
                                        step={1}
                                        onChange={(value) => updateSlideProperty(['cover', 'textOptions', layer.key, 'fontSize'], value)}
                                      />
                                    </div>

                                    <StepperNumberControl
                                      label="Peso"
                                      value={layerOptions?.fontWeight ?? defaultWeight}
                                      min={100}
                                      max={900}
                                      step={100}
                                      onChange={(value) => updateSlideProperty(['cover', 'textOptions', layer.key, 'fontWeight'], value)}
                                    />

                                    <TransformControl
                                      label="Largura (%)"
                                      value={layerOptions?.widthPercent ?? 100}
                                      min={20}
                                      max={100}
                                      step={1}
                                      onChange={(value) => updateSlideProperty(['cover', 'textOptions', layer.key, 'widthPercent'], value)}
                                    />

                                    <div className="flex gap-4">
                                      <div className="space-y-2 flex-1">
                                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Cor</span>
                                        <div className="flex items-center gap-2 bg-black/60 border border-white/5 rounded-xl p-1.5">
                                          <input
                                            type="color"
                                            value={layerOptions?.color || currentSlideTheme.text || '#ffffff'}
                                            onChange={(e) => updateSlideProperty(['cover', 'textOptions', layer.key, 'color'], e.target.value)}
                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                                          />
                                          <span className="text-[10px] font-mono text-zinc-400">{layerOptions?.color || currentSlideTheme.text || '#ffffff'}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-2 flex-1">
                                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Alinhamento</span>
                                        <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                                          {[
                                            { id: 'left', icon: AlignLeft },
                                            { id: 'center', icon: AlignCenter },
                                            { id: 'right', icon: AlignRight },
                                          ].map((align) => (
                                            <button
                                              key={align.id}
                                              onClick={() => updateSlideProperty(['cover', 'textOptions', layer.key, 'textAlign'], align.id)}
                                              className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${((layerOptions?.textAlign || currentSlide?.options?.contentHorizontalAlign || 'center') === align.id) ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                              <align.icon size={14} />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <TransformControl
                                        label="Espaçamento"
                                        value={layerOptions?.letterSpacing ?? 0}
                                        min={-10}
                                        max={50}
                                        step={1}
                                        onChange={(value) => updateSlideProperty(['cover', 'textOptions', layer.key, 'letterSpacing'], value)}
                                      />
                                      <TransformControl
                                        label="Altura Linha"
                                        value={layerOptions?.lineHeight ?? (layer.key === 'titleMain' ? 0.84 : layer.key === 'titleTop' ? 0.96 : layer.key === 'eyebrow' ? 1.22 : 1.28)}
                                        min={0.5}
                                        max={3}
                                        step={0.1}
                                        onChange={(value) => updateSlideProperty(['cover', 'textOptions', layer.key, 'lineHeight'], value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ) : (
                        <>
                      {currentSlide.blocks.map((block, bIdx) => (
                        <div key={bIdx} className="bg-black/40 border border-white/5 rounded-[28px] overflow-hidden group hover:border-white/10 transition-all">
                          <div className="px-6 py-4 bg-black/40 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand" /><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{block.type}</span></div>
                            <button onClick={() => { const next = [...currentSlide.blocks]; next.splice(bIdx, 1); updateSlideProperty(['blocks'], next); }} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                          </div>
                          <div className="p-6 space-y-5">
                            {block.type === 'USER' ? (
                              <div className="space-y-5">
                                <div className="flex gap-4 items-start">
                                  <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10 shrink-0 group shadow-lg">
                                      <img src={block.options?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover" />
                                      <input type="file" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onloadend = () => { updateSlideProperty(['blocks', bIdx, 'options', 'avatar'], reader.result as string); showToast("Avatar atualizado!"); };
                                        reader.readAsDataURL(file);
                                      }} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Icons.Image size={14} className="text-white" /></div>
                                  </div>
                                  <div className="flex-1 space-y-3">
                                      <input type="text" value={(block.content as string) || ''} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'content'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all" placeholder="Nome do Autor" />
                                      <input type="text" value={block.options?.handle || ''} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'handle'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[11px] font-bold text-brand outline-none focus:border-brand/50 transition-all" placeholder="@handle" />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Exibir Nome</span><button onClick={() => updateSlideProperty(['blocks', bIdx, 'options', 'hideName'], !block.options?.hideName)} className={`p-2 rounded-lg transition-all ${!block.options?.hideName ? 'text-brand bg-brand/10' : 'text-zinc-600 bg-white/5'}`}>{block.options?.hideName ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Cor do Nome</span><input type="color" value={block.options?.nameColor || '#f5f3ee'} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'nameColor'], e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden" /></div>
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Cor do @</span><input type="color" value={block.options?.handleColor || '#1fb2f7'} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'handleColor'], e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden" /></div>
                              </div>
                            ) : block.type !== 'SPACER' ? (
                              <>
                                <SafeTextArea value={block.type === 'LIST' ? ((Array.isArray(block.content) ? block.content.join('\n') : block.content as string) || '') : getBlockEditorTextValue(block)} onChange={(val, meta) => updateTextBlockFromEditor(bIdx, val, meta)} className="w-full bg-black/60 border border-white/5 rounded-2xl p-5 text-[13px] font-medium text-white outline-none focus:border-brand/50 min-h-[120px] custom-scrollbar resize-none transition-all" placeholder="Digite o conteúdo do slide aqui..." />
                              </>
                            ) : null}
                            
                            {block.type !== 'SPACER' && (
                              <div className="space-y-4 pt-2 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Estilo</span>
                                      <select value={block.options?.fontVariant || (block.type === 'TITLE' ? 'destaque' : 'padrão')} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'fontVariant'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-3 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer"><option value="padrão">Padrão</option><option value="destaque">Destaque</option></select>
                                    </div>
                                    <div className="space-y-2">
                                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte</span>
                                      <select value={block.options?.fontFamily || ''} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'fontFamily'], e.target.value || undefined)} className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-3 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer">
                                        <option value="">Usar estilo selecionado</option>
                                        {allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                      </select>
                                    </div>
                                    <StepperNumberControl
                                      label="Tamanho"
                                      value={getEffectiveBlockFontSize(block, currentSlide.blocks)}
                                      min={10}
                                      max={400}
                                      step={1}
                                      onChange={(value) => updateSlideProperty(['blocks', bIdx, 'options', 'fontSize'], value)}
                                    />
                                </div>
                                {supportsFontWeightControl(block) && (
                                  <StepperNumberControl
                                    label="Peso"
                                    value={block.options?.fontWeight ?? (
                                      block.type === 'TITLE'
                                        ? ((block.options?.fontVariant || 'destaque') === 'destaque' ? 400 : 900)
                                        : block.type === 'BOX'
                                          ? 900
                                          : block.type === 'USER'
                                            ? 900
                                            : ((block.options?.fontVariant || 'padrão') === 'destaque' ? 400 : 300)
                                    )}
                                    min={100}
                                    max={900}
                                    step={100}
                                    onChange={(value) => updateSlideProperty(['blocks', bIdx, 'options', 'fontWeight'], value)}
                                  />
                                )}
                                {block.type !== 'IMAGE' && (
                                  <TransformControl label="Largura (%)" value={block.options?.widthPercent ?? currentSlide?.options?.contentWidthPercent ?? 100} min={20} max={100} step={1} onChange={(v) => updateSlideProperty(['blocks', bIdx, 'options', 'widthPercent'], v)} />
                                )}
                                <div className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Cor</span>
                                      <div className="flex items-center gap-2 bg-black/60 border border-white/5 rounded-xl p-1.5">
                                          <input type="color" value={block.options?.color || '#ffffff'} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'color'], e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden" />
                                          <span className="text-[10px] font-mono text-zinc-400">{block.options?.color || '#ffffff'}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Alinhamento</span>
                                      <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                                          {[
                                            { id: 'left', icon: AlignLeft },
                                            { id: 'center', icon: AlignCenter },
                                            { id: 'right', icon: AlignRight }
                                          ].map(align => (
                                            <button
                                              key={align.id}
                                              onClick={() => updateSlideProperties([
                                                { path: ['blocks', bIdx, 'options', 'textAlign'], value: align.id },
                                                { path: ['blocks', bIdx, 'options', 'align'], value: align.id },
                                              ])}
                                              className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${((block.options?.align || block.options?.textAlign) === align.id) ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                              <align.icon size={14} />
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TransformControl label="Espaçamento" value={block.options?.letterSpacing || 0} min={-10} max={50} step={1} onChange={(v) => updateSlideProperty(['blocks', bIdx, 'options', 'letterSpacing'], v)} />
                                    <TransformControl label="Altura Linha" value={block.options?.lineHeight || 1.2} min={0.5} max={3} step={0.1} onChange={(v) => updateSlideProperty(['blocks', bIdx, 'options', 'lineHeight'], v)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="space-y-4">
                        <button
                          onClick={() => setShowAddBlockPicker((current) => !current)}
                          className={`w-full py-10 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] ${showAddBlockPicker ? 'border-brand/50 bg-brand/8 text-brand' : 'border-white/10 text-zinc-500 hover:text-brand hover:border-brand/40 hover:bg-brand/5'}`}
                        >
                          <PlusCircle size={24}/>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {showAddBlockPicker ? 'Escolha o Tipo de Conteúdo' : 'Adicionar Novo Bloco'}
                          </span>
                        </button>
                        {showAddBlockPicker && (
                          <div className="rounded-[28px] border border-white/5 bg-black/40 p-4">
                            <div className="grid grid-cols-2 gap-3">
                              {newBlockOptions.map((option) => {
                                const Icon = NEW_BLOCK_OPTION_ICONS[option.icon];
                                return (
                                  <button
                                    key={option.type}
                                    onClick={() => appendNewBlockOfType(option.type)}
                                    className="rounded-[22px] border border-white/6 bg-black/30 p-4 text-left hover:border-brand/30 hover:bg-brand/5 transition-all"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-brand">
                                        <Icon size={18} />
                                      </div>
                                      <div className="min-w-0 space-y-1">
                                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
                                          {option.label}
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-zinc-500">
                                          {option.description}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                        </>
                      )}

                      <section className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <TypeIcon size={16} className="text-brand" />
                            <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Cores de Texto</h3>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest pl-6">Ajustes de cor para textos e acentos do slide</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          <ColorPropertyControl label="Fundo do Slide" value={currentSlideTheme.background || '#0D0D0D'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'background'], val)} />
                          <ColorPropertyControl label="Texto Principal" value={currentSlideTheme.text || '#FFFFFF'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'text'], val)} />
                          <ColorPropertyControl label="Cor de Acento" value={currentSlideTheme.accent || '#1fb2f7'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'accent'], val)} />
                          <ColorPropertyControl label="Texto Highlight" value={currentSlideTheme.hlTextColor || '#000000'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'hlTextColor'], val)} />
                          <ColorPropertyControl label="Texto de Card" value={currentSlideTheme.cardTextColor || '#000000'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'cardTextColor'], val)} />
                        </div>
                      </section>

                      <section className="space-y-5 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <TypeIcon size={16} className="text-brand" />
                            <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Estrutura de Texto</h3>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest pl-6">Controle a largura da area de conteudo e a numeracao</p>
                        </div>
                        <TransformControl label="Area de Texto (%)" value={currentSlide?.options?.contentWidthPercent ?? 100} min={20} max={100} step={1} onChange={(v) => updateSlideProperty(['options', 'contentWidthPercent'], v)} />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Alinhamento Horizontal</span>
                            <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                              {[
                                { id: 'left', icon: AlignLeft },
                                { id: 'center', icon: AlignCenter },
                                { id: 'right', icon: AlignRight }
                              ].map(align => (
                                <button
                                  key={align.id}
                                  onClick={() => currentSlide && updateSlideProperties(buildSlideAlignmentUpdates(
                                    align.id as 'left' | 'center' | 'right',
                                    currentSlide.options?.contentVerticalAlign || 'center',
                                    currentSlide.blocks || [],
                                  ))}
                                  className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${((currentSlide?.options?.contentHorizontalAlign || 'left') === align.id) ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                                >
                                  <align.icon size={14} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Alinhamento Vertical</span>
                            <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                              {[
                                { id: 'top', icon: AlignStartVertical },
                                { id: 'center', icon: AlignCenterVertical },
                                { id: 'bottom', icon: AlignEndVertical }
                              ].map(align => (
                                <button
                                  key={align.id}
                                  onClick={() => updateSlideProperty(['options', 'contentVerticalAlign'], align.id)}
                                  className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${((currentSlide?.options?.contentVerticalAlign || 'center') === align.id) ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                                >
                                  <align.icon size={14} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {currentSlide?.cover ? (
                            <>
                              <div className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-brand uppercase tracking-[0.18em]">
                                {getSlideDisplayLabel(currentSlide, currentIndex)}
                              </div>
                              <button onClick={resetSlideNumbers} className="px-4 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-2xl bg-white/5 text-brand hover:bg-brand/10 transition-all">Resetar Tudo</button>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                value={getSlideDisplayNumber(currentSlide, currentIndex)}
                                onChange={(e) => updateSlideProperty(['slideNumber'], Number(e.target.value || currentIndex + 1))}
                                className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                              />
                              <button onClick={() => updateSlideProperty(['slideNumber'], currentIndex + 1)} className="px-4 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all">Reset</button>
                              <button onClick={resetSlideNumbers} className="px-4 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-2xl bg-white/5 text-brand hover:bg-brand/10 transition-all">Resetar Tudo</button>
                            </>
                          )}
                        </div>
                      </section>

                      <section className="space-y-8 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <BoxSelect size={16} className="text-brand" />
                            <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Destaques do Slide</h3>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest pl-6">Fundos de highlight, cards e caixas deste slide</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="grid grid-cols-1 gap-6">
                            <ColorPropertyControl label="Fundo Highlight" value={currentSlideTheme.hlBgColor || '#1fb2f7'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'hlBgColor'], val)} />
                            <ColorPropertyControl label="Fundo de Card" value={currentSlideTheme.cardBg || '#1fb2f7'} paletteColors={activePaletteColors} onChange={(val) => updateSlideProperty(['options', 'cardBg'], val)} />
                          </div>
                        </div>
                      </section>

                      {currentSlideHasBoxes && (
                        <section className="space-y-6 pt-6 border-t border-white/5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2.5">
                              <Layout size={16} className="text-brand" />
                              <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Grupo de Boxes</h3>
                            </div>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest pl-6">Posição e distribuição do conjunto</p>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Alinhamento</label>
                              <div className="flex bg-black/60 p-1 rounded-xl border border-white/5 gap-1">
                                {[
                                  { id: 'left', icon: AlignLeft },
                                  { id: 'center', icon: AlignCenter },
                                  { id: 'right', icon: AlignRight },
                                ].map((align) => (
                                  <button
                                    key={align.id}
                                    onClick={() => updateSlideProperty(['options', 'boxGroupAlign'], align.id)}
                                    className={`flex-1 py-3 flex items-center justify-center rounded-lg transition-all ${((currentSlide?.options?.boxGroupAlign || 'left') === align.id) ? 'bg-zinc-800 text-brand' : 'text-zinc-500 hover:text-white'}`}
                                  >
                                    <align.icon size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Layout</label>
                              <select
                                value={currentSlide?.options?.boxGroupLayout || 'auto'}
                                onChange={(e) => updateSlideProperty(['options', 'boxGroupLayout'], e.target.value)}
                                className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                              >
                                <option value="auto">Auto</option>
                                <option value="row">Linha</option>
                                <option value="grid">Grid</option>
                                <option value="stack">Pilha</option>
                              </select>
                            </div>
                          </div>
                        </section>
                      )}

                      <section className="space-y-6 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <Baseline size={16} className="text-brand" />
                            <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-[0.2em]">Tipografia e Espaçamento</h3>
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest pl-6">Ajustes gerais deste slide</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte Padrão</label><select value={currentSlideTheme.fontPadrão || 'Inter'} onChange={(e) => updateSlideProperty(['options', 'fontPadrão'], e.target.value)} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all">{allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte Destaque</label><select value={currentSlideTheme.fontDestaque || currentSlideTheme.fontPadrão || 'Inter'} onChange={(e) => updateSlideProperty(['options', 'fontDestaque'], e.target.value)} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all">{allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                          <TransformControl label="Margens" value={currentSlide?.options?.padding ?? 80} min={20} max={200} step={4} onChange={(v) => updateSlideProperty(['options', 'padding'], v)} />
                          <TransformControl label="Espaçamento" value={currentSlide?.options?.blockGap ?? 24} min={0} max={160} step={2} onChange={(v) => updateSlideProperty(['options', 'blockGap'], v)} />
                        </div>
                      </section>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                      <LayoutTemplate size={48} strokeWidth={1} />
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhum slide selecionado</p>
                    </div>
                  )}
              </div>
            ) : activeTab === 'IMAGE' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                {isPendingImageOnCurrentSlide && pendingImageDraft && (
                  <section className="rounded-[30px] border border-brand/30 bg-brand/10 px-5 py-5 shadow-[0_20px_60px_rgba(31,178,247,0.12)]">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-brand">Imagem Pendente</p>
                        <h3 className="text-[15px] font-black text-white">Ajuste {getPendingImageTargetLabel(pendingImageDraft.target)} e confirme antes de seguir.</h3>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          A ideia aqui é simples: primeiro posicionamos, giramos e damos o zoom certo. Depois consolidamos em WebP leve, sem travar a página.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={confirmPendingImageDraft}
                          disabled={isOptimizingPendingImage}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-xl transition-all hover:bg-brand/85 disabled:opacity-60"
                        >
                          {isOptimizingPendingImage ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                          {isOptimizingPendingImage ? 'Otimizando...' : 'OK e Otimizar'}
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          Navegação e export ficam travadas até confirmar
                        </span>
                      </div>
                    </div>
	                  </section>
	                )}
	                {isCoverSlide ? (
                  <>
                    <section className="space-y-6 pt-8 border-t border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <ImageIconLucide size={18} className="text-brand" />
                          <h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Imagem de Fundo da Capa</h3>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest pl-6">Base geral da composição hero</p>
                      </div>
                      <label className="relative block aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl cursor-pointer">
                        {currentSlide?.cover?.images?.backgroundImage ? (
                          <img src={currentSlide.cover.images.backgroundImage} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700">
                            <Icons.ImagePlus size={40} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Imagem Fundo</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={handleCoverBackgroundImageUpload}
                        />
                        <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-dashed border-brand/50 rounded-3xl" />
                      </label>
                      {currentSlide?.cover?.images?.backgroundImage && (
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              updateSlideProperty(['cover', 'images', 'backgroundImage'], undefined);
                              clearPendingImageDraft('cover-background');
                            }}
                            className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 size={12} /> Limpar fundo
                          </button>

                          <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-2 px-1"><Move3d size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Ajustes do Fundo</span></div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Fundo X" value={currentSlide?.cover?.images?.backgroundX || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['cover', 'images', 'backgroundX'], v)} />
                              <TransformControl label="Fundo Y" value={currentSlide?.cover?.images?.backgroundY || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['cover', 'images', 'backgroundY'], v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Zoom Fundo" value={currentSlide?.cover?.images?.backgroundScale || 1} min={0.5} max={4} step={0.05} onChange={(v) => updateSlideProperty(['cover', 'images', 'backgroundScale'], v)} highlight />
                              <TransformControl label="Blur Fundo" value={currentSlide?.cover?.images?.backgroundBlur || 0} min={0} max={40} step={1} onChange={(v) => updateSlideProperty(['cover', 'images', 'backgroundBlur'], v)} />
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-2 px-1"><Contrast size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Leitura do Fundo</span></div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Força do Overlay" value={currentSlide?.options?.backgroundOverlayStrength ?? 0.82} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'backgroundOverlayStrength'], v)} />
                              <TransformControl label="Blur de Leitura" value={currentSlide?.options?.backgroundBlur ?? 0} min={0} max={40} step={1} onChange={(v) => updateSlideProperty(['options', 'backgroundBlur'], v)} />
                            </div>
                          </div>
                          {renderOptimizationSummary('cover-background')}
                        </div>
                      )}
                    </section>

                    <section className="space-y-6 pt-8 border-t border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <Scissors size={18} className="text-brand" />
                          <h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Imagem Destaque da Capa</h3>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest pl-6">Camada frontal recortada / cutout</p>
                      </div>
                      <label className="relative block aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl cursor-pointer">
                        {currentSlide?.cover?.images?.foregroundImage ? (
                          <img src={currentSlide.cover.images.foregroundImage} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700">
                            <Scissors size={40} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Imagem Destaque</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={handleCoverForegroundImageUpload}
                        />
                        <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-dashed border-brand/50 rounded-3xl" />
                      </label>
                      {currentSlide?.cover?.images?.foregroundImage && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Modo</span>
                            <select
                              value={currentSlide.cover.images.foregroundMode || 'cutout'}
                              onChange={(e) => updateSlideProperty(['cover', 'images', 'foregroundMode'], e.target.value)}
                              className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-4 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                            >
                              <option value="cutout">Cutout</option>
                              <option value="soft-overlay">Soft Overlay</option>
                              <option value="none">Ocultar</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              updateSlideProperties([
                                { path: ['cover', 'images', 'foregroundImage'], value: undefined },
                                { path: ['cover', 'images', 'foregroundMode'], value: 'none' },
                              ]);
                              clearPendingImageDraft('cover-foreground');
                            }}
                            className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 size={12} /> Limpar destaque
                          </button>

                          <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-2 px-1"><Move3d size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Ajustes do Container</span></div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Box X" value={currentSlide?.image?.boxX || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'boxX'], v)} />
                              <TransformControl label="Box Y" value={currentSlide?.image?.boxY || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'boxY'], v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Largura" value={currentSlide?.image?.width || 760} min={200} max={980} step={1} onChange={(v) => updateSlideProperty(['image', 'width'], v)} />
                              <TransformControl label="Altura" value={currentSlide?.image?.height || 980} min={240} max={1200} step={1} onChange={(v) => updateSlideProperty(['image', 'height'], v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Box Scale" value={currentSlide?.image?.boxScale || 1} min={0.1} max={5} step={0.05} onChange={(v) => updateSlideProperty(['image', 'boxScale'], v)} />
                              <TransformControl label="Box Rotation" value={currentSlide?.image?.boxRotation || 0} min={-360} max={360} step={1} onChange={(v) => updateSlideProperty(['image', 'boxRotation'], v)} />
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-2 px-1"><FocusIcon size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Ajustes da Imagem</span></div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Img X" value={currentSlide?.image?.imageX || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'imageX'], v)} />
                              <TransformControl label="Img Y" value={currentSlide?.image?.imageY || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'imageY'], v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <TransformControl label="Img Zoom" value={currentSlide?.image?.imageScale || 1} min={0.1} max={10} step={0.05} onChange={(v) => updateSlideProperty(['image', 'imageScale'], v)} highlight />
                              <TransformControl label="Img Rotation" value={currentSlide?.image?.imageRotation || 0} min={-360} max={360} step={1} onChange={(v) => updateSlideProperty(['image', 'imageRotation'], v)} highlight />
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                              <TransformControl label="Opacidade" value={currentSlide?.image?.backgroundOpacity ?? (currentSlide?.cover?.images?.foregroundMode === 'soft-overlay' ? 0.5 : 0.98)} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['image', 'backgroundOpacity'], v)} />
                            </div>
                          </div>
                          {renderOptimizationSummary('cover-foreground')}
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <>
                <section className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5"><ImageIconLucide size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Imagem do Template</h3></div>
                    {imageConfig?.url && <button onClick={() => { updateSlideProperty(['image', 'url'], undefined); clearPendingImageDraft('template'); }} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1.5"><Trash2 size={12} /> Limpar</button>}
                  </div>
                  <div
                    className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl"
                    style={{ aspectRatio: `${currentTemplatePreviewFrame.width} / ${currentTemplatePreviewFrame.height}` }}
                  >
                    {imageConfig?.url ? (
                      currentTemplatePreviewMetrics && !isTemplatePreviewCutout ? (
                        <>
                          <div className="absolute inset-0 bg-zinc-950" />
                          <div className="absolute inset-0 overflow-hidden">
                            <div
                              className="absolute"
                              style={{
                                left: `${(currentTemplatePreviewCoverFrame.left / currentTemplatePreviewFrame.width) * 100}%`,
                                top: `${(currentTemplatePreviewCoverFrame.top / currentTemplatePreviewFrame.height) * 100}%`,
                                width: `${(currentTemplatePreviewCoverFrame.width / currentTemplatePreviewFrame.width) * 100}%`,
                                height: `${(currentTemplatePreviewCoverFrame.height / currentTemplatePreviewFrame.height) * 100}%`,
                                overflow: 'hidden',
                              }}
                            >
                              <img
                                src={imageConfig.url}
                                alt=""
                                className="absolute block max-w-none"
                                style={{
                                  left: `calc(50% + ${(Math.max(-currentTemplatePreviewMetrics.maxOffsetX, Math.min(currentTemplatePreviewMetrics.maxOffsetX, imageConfig.imageX || 0)) / currentTemplatePreviewCoverFrame.width) * 100}%)`,
                                  top: `calc(50% + ${(Math.max(-currentTemplatePreviewMetrics.maxOffsetY, Math.min(currentTemplatePreviewMetrics.maxOffsetY, imageConfig.imageY || 0)) / currentTemplatePreviewCoverFrame.height) * 100}%)`,
                                  width: `${(currentTemplatePreviewMetrics.renderedWidth / currentTemplatePreviewCoverFrame.width) * 100}%`,
                                  height: `${(currentTemplatePreviewMetrics.renderedHeight / currentTemplatePreviewCoverFrame.height) * 100}%`,
                                  transform: `translate(-50%, -50%) scale(${imageConfig.imageScale || 1}) rotate(${imageConfig.imageRotation || 0}deg)`,
                                  transformOrigin: 'center',
                                  opacity: imageConfig.backgroundOpacity ?? 1,
                                }}
                              />
                            </div>
                          </div>
                          {currentTemplateFadeSide && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: currentTemplateFadeSide === 'left'
                                  ? 'linear-gradient(90deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.58) 20%, rgba(0,0,0,0.18) 40%, transparent 56%)'
                                  : currentTemplateFadeSide === 'right'
                                    ? 'linear-gradient(270deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.58) 20%, rgba(0,0,0,0.18) 40%, transparent 56%)'
                                    : currentTemplateFadeSide === 'top'
                                      ? 'linear-gradient(180deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.58) 20%, rgba(0,0,0,0.18) 40%, transparent 56%)'
                                      : 'linear-gradient(0deg, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.58) 20%, rgba(0,0,0,0.18) 40%, transparent 56%)',
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <img src={imageConfig.url} className="w-full h-full object-contain" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700"><Icons.ImagePlus size={40} /><span className="text-[9px] font-black uppercase tracking-widest">Add Imagem Template</span></div>
                    )}
                    <input ref={imageInputRef} type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                    <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-dashed border-brand/50 rounded-3xl" />
                  </div>
                  {imageConfig?.url && currentTemplatePreviewMetrics && (
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="rounded-2xl border border-white/5 bg-black/40 px-4 py-3">
                        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Folga Horizontal</div>
                        <div className="mt-1 text-[12px] font-black text-zinc-100">{currentTemplatePreviewMetrics.maxOffsetX}px</div>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/40 px-4 py-3">
                        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">Folga Vertical</div>
                        <div className="mt-1 text-[12px] font-black text-zinc-100">{currentTemplatePreviewMetrics.maxOffsetY}px</div>
                      </div>
                      {currentTemplatePreviewMetrics.maxOffsetX === 0 && (
                        <div className="col-span-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[10px] leading-5 text-amber-100">
                          Esse enquadramento não tem sobra lateral real. Para mover mais para os lados, precisa de uma imagem mais larga ou mais zoom.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {imageConfig && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                         <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Modo de Exibição</span>
                         <div className="grid grid-cols-5 gap-2">{IMAGE_TYPE_PRESETS.map(p => (<button key={p.id} onClick={() => updateSlideProperty(['image', 'type'], p.id)} className={`p-3 rounded-xl border flex items-center justify-center transition-all ${imageConfig.type === p.id ? 'bg-brand text-black border-brand shadow-lg scale-105' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`} title={p.label}><p.icon size={18}/></button>))}</div>
                       </div>
                       
                       {/* Seletor de Posição (Horizontal e Vertical) */}
                       {(imageConfig.type === 'IMAGE_BOX' || imageConfig.type === 'IMAGE_SPLIT_HALF') && (
                         <div className="pt-6 border-t border-white/5 space-y-4">
                           <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Posição / Lado</span>
                           <div className="grid grid-cols-4 gap-2">
                             {[
                               { id: 'left', icon: AlignLeft, label: 'Esquerda' },
                               { id: 'right', icon: AlignRight, label: 'Direita' },
                               { id: 'top', icon: AlignStartVertical, label: 'Topo' },
                               { id: 'bottom', icon: AlignEndVertical, label: 'Base' }
                             ].map(pos => (
                               <button 
                                 key={pos.id} 
                                 onClick={() => updateSlideProperty(['image', 'position'], pos.id)} 
                                 className={`p-3 rounded-xl border flex items-center justify-center transition-all ${imageConfig.position === pos.id ? 'bg-brand text-black border-brand shadow-lg scale-105' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}
                                 title={pos.label}
                               >
                                 <pos.icon size={18}/>
                               </button>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Ajustes da Moldura (Box) */}
                       {(currentImageLayoutFamily === 'box' || currentImageLayoutFamily === 'stack_box') && (
                       <div className="pt-6 border-t border-white/5 space-y-6">
                         <div className="flex items-center gap-2 px-1"><Move3d size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Ajustes da Moldura (Box)</span></div>
                         <div className="grid grid-cols-2 gap-6">
                           <TransformControl label="Box X" value={imageConfig.boxX || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'boxX'], v)} />
                           <TransformControl label="Box Y" value={imageConfig.boxY || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'boxY'], v)} />
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                           <TransformControl label="Largura" value={imageConfig.width || 540} min={180} max={860} step={1} onChange={(v) => updateSlideProperty(['image', 'width'], v)} />
                           <TransformControl label="Altura" value={imageConfig.height || ((imageConfig.position === 'left' || imageConfig.position === 'right') ? 850 : 540)} min={220} max={1120} step={1} onChange={(v) => updateSlideProperty(['image', 'height'], v)} />
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                           <TransformControl label="Box Scale" value={imageConfig.boxScale || 1} min={0.1} max={5} step={0.05} onChange={(v) => updateSlideProperty(['image', 'boxScale'], v)} />
                           <TransformControl label="Box Rotation" value={imageConfig.boxRotation || 0} min={-360} max={360} step={1} onChange={(v) => updateSlideProperty(['image', 'boxRotation'], v)} />
                         </div>
                       </div>
                       )}

                       {/* Ajustes do Conteúdo (Inner Image) */}
                       <div className="pt-6 border-t border-white/5 space-y-6">
                         <div className="flex items-center gap-2 px-1"><FocusIcon size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Ajustes da Imagem Interna</span></div>
                         <div className="grid grid-cols-2 gap-6">
                           <TransformControl label="Img X" value={imageConfig.imageX || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'imageX'], v)} />
                           <TransformControl label="Img Y" value={imageConfig.imageY || 0} min={-1000} max={1000} step={1} onChange={(v) => updateSlideProperty(['image', 'imageY'], v)} />
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                           <TransformControl label="Img Zoom" value={imageConfig.imageScale || 1} min={0.1} max={10} step={0.05} onChange={(v) => updateSlideProperty(['image', 'imageScale'], v)} highlight />
                           <TransformControl label="Img Rotation" value={imageConfig.imageRotation || 0} min={-360} max={360} step={1} onChange={(v) => updateSlideProperty(['image', 'imageRotation'], v)} highlight />
                         </div>
                         <div className="grid grid-cols-1 gap-6">
                           <TransformControl label="Opacidade" value={imageConfig.backgroundOpacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['image', 'backgroundOpacity'], v)} />
                         </div>
                       </div>
                       {renderOptimizationSummary('template')}
                       {(() => {
                         const imageLayoutId = currentSlideComposition?.imageLayoutId;
                         const isGlassLayout = imageLayoutId === 'IMAGE_GLASS_CARD' || imageLayoutId === 'IMAGE_GLASS_BOTTOM';
                         const isFadeLayout = imageLayoutId === 'IMAGE_FADE_LEFT' || imageLayoutId === 'IMAGE_FADE_RIGHT' || imageLayoutId === 'IMAGE_FADE_TOP' || imageLayoutId === 'IMAGE_FADE_BOTTOM';
                         const isBackgroundHero = imageLayoutId === 'IMAGE_BACKGROUND' && (currentSlideComposition?.contentTemplateId === 'HERO' || currentSlideComposition?.contentTemplateId === 'STAT');
                         return (isGlassLayout || isBackgroundHero || isFadeLayout) && (
                         <div className="pt-6 border-t border-white/5 space-y-6">
                           <div className="flex items-center gap-2 px-1"><Contrast size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Leitura da Imagem</span></div>
                           {isGlassLayout && (
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Tom da Box</label>
                               <select value={imageConfig.boxOverlay || 'light'} onChange={(e) => updateSlideProperty(['image', 'boxOverlay'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-4 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all">
                                 <option value="light">Light Glass</option>
                                 <option value="dark">Dark Glass</option>
                               </select>
                             </div>
                           )}
                           {isFadeLayout && (
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Lado do Fade</label>
                               <select
                                 value={currentSlide?.options?.fadeSide || imageConfig.position || 'left'}
                                 onChange={(e) => {
                                   const nextSide = e.target.value as 'left' | 'right' | 'top' | 'bottom';
                                   const nextLayout = nextSide === 'right'
                                     ? 'IMAGE_FADE_RIGHT'
                                     : nextSide === 'top'
                                       ? 'IMAGE_FADE_TOP'
                                       : nextSide === 'bottom'
                                         ? 'IMAGE_FADE_BOTTOM'
                                         : 'IMAGE_FADE_LEFT';
                                   updateSlideProperties([
                                     { path: ['options', 'fadeSide'], value: nextSide },
                                     { path: ['imageLayout'], value: nextLayout },
                                     { path: ['image', 'position'], value: nextSide },
                                   ]);
                                 }}
                                 className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-4 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                               >
                                 <option value="left">Esquerda</option>
                                 <option value="right">Direita</option>
                                 <option value="top">Topo</option>
                                 <option value="bottom">Base</option>
                               </select>
                             </div>
                           )}
                           {isFadeLayout ? (
                             <div className="grid grid-cols-1 gap-6">
                               <TransformControl label="Blur de Leitura" value={currentSlide?.options?.fadeBlur ?? 0} min={0} max={40} step={1} onChange={(v) => updateSlideProperty(['options', 'fadeBlur'], v)} />
                             </div>
                           ) : (
                             <div className="grid grid-cols-2 gap-6">
                               <TransformControl label={isGlassLayout ? ((imageConfig.boxOverlay || 'light') === 'dark' ? 'Potência do Dark Glass' : 'Potência do Light Glass') : 'Força do Overlay'} value={currentSlide?.options?.backgroundOverlayStrength ?? (isGlassLayout ? 0.42 : isBackgroundHero ? 0.26 : 0.55)} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'backgroundOverlayStrength'], v)} />
                               <TransformControl label="Blur de Leitura" value={currentSlide?.options?.backgroundBlur ?? (isBackgroundHero ? 0 : 12)} min={0} max={40} step={1} onChange={(v) => updateSlideProperty(['options', 'backgroundBlur'], v)} />
                             </div>
                           )}
                           {isFadeLayout && (
                             <TransformControl label="Força do Fade" value={currentSlide?.options?.fadeStrength ?? 0.38} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'fadeStrength'], v)} highlight />
                           )}
                           {isBackgroundHero && (
                             <div className="grid grid-cols-2 gap-6">
                               <TransformControl label="Preservar Highlights" value={currentSlide?.options?.preserveHighlights ?? 0.25} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'preserveHighlights'], v)} />
                               <TransformControl label="Levantar Sombras" value={currentSlide?.options?.liftShadows ?? 0.2} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'liftShadows'], v)} />
                             </div>
                           )}
                         </div>
                         );
                       })()}
                    </div>
                  )}
                </section>
                  </>
                )}

                <section className="space-y-6 pt-8 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5"><Ghost size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Objetos Overlay (PNG)</h3></div>
                   </div>
                   
                   <div 
                      onClick={() => overlayImageInputRef.current?.click()} 
                      className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-950 border-2 border-dashed border-brand/20 group shadow-2xl cursor-pointer hover:border-brand/50 transition-all flex items-center justify-center"
                   >
                      <div className="flex flex-col items-center gap-3 text-brand/40 group-hover:text-brand transition-colors">
                         <PlusCircle size={32} />
                         <span className="text-[9px] font-black uppercase tracking-widest">CTRL+V ou Clique para ADD PNG</span>
                      </div>
                      <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>

                   {overlayConfigs.length > 0 && (
                     <div className="space-y-8 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-4 gap-3">
                           {overlayConfigs.map((ov, idx) => (
                             <button 
                               key={ov.id || idx} 
                               onClick={() => setActiveOverlayIndex(idx)}
                               className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${activeOverlayIndex === idx ? 'border-brand scale-105 shadow-lg' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                             >
                                <img src={ov.url} className="w-full h-full object-contain p-1" />
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = [...overlayConfigs];
                                    next.splice(idx, 1);
                                    updateSlideProperty(['overlayImages'], next);
                                    setActiveOverlayIndex(Math.max(0, idx - 1));
                                    clearPendingImageDraft('overlay', ov.id);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                                >
                                  <Trash2 size={10} />
                                </button>
                             </button>
                           ))}
                        </div>

                        {activeOverlay && (
                          <div className="space-y-6 p-6 bg-black/40 border border-brand/20 rounded-[32px] animate-in zoom-in-95">
                             <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <span className="text-[10px] font-black uppercase text-brand tracking-widest">Ajustes: Overlay #{activeOverlayIndex + 1}</span>
                                <button onClick={() => {
                                  const next = [...overlayConfigs];
                                  next.splice(activeOverlayIndex, 1);
                                  updateSlideProperty(['overlayImages'], next);
                                  setActiveOverlayIndex(0);
                                  clearPendingImageDraft('overlay', activeOverlay.id);
                                }} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                               <TransformControl label="Horizontal (X)" value={activeOverlay.x || 0} min={-1200} max={1200} step={1} onChange={(v) => updateSlideProperty(['overlayImages', activeOverlayIndex, 'x'], v)} highlight />
                               <TransformControl label="Vertical (Y)" value={activeOverlay.y || 0} min={-1200} max={1200} step={1} onChange={(v) => updateSlideProperty(['overlayImages', activeOverlayIndex, 'y'], v)} highlight />
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                               <TransformControl label="Tamanho" value={activeOverlay.scale || 1} min={0.05} max={8} step={0.05} onChange={(v) => updateSlideProperty(['overlayImages', activeOverlayIndex, 'scale'], v)} highlight />
                               <TransformControl label="Giro" value={activeOverlay.rotation || 0} min={-360} max={360} step={1} onChange={(v) => updateSlideProperty(['overlayImages', activeOverlayIndex, 'rotation'], v)} highlight />
                             </div>
                             <div className="flex items-center gap-4">
                                <TransformControl label="Opacidade" value={activeOverlay.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['overlayImages', activeOverlayIndex, 'opacity'], v)} />
                                <button 
                                  onClick={() => updateSlideProperty(['overlayImages', activeOverlayIndex, 'isFlipped'], !activeOverlay.isFlipped)}
                                  className={`px-6 h-[46px] rounded-xl border flex items-center gap-2 transition-all ${activeOverlay.isFlipped ? 'bg-brand text-black border-brand' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}
                                >
                                  <MoveHorizontal size={14} />
                                  <span className="text-[9px] font-black uppercase">Espelho</span>
                                </button>
                             </div>
                          </div>
                        )}
                        {renderOptimizationSummary('overlay')}
                     </div>
                   )}
                </section>

                <section className="space-y-6 pt-8 border-t border-white/5 pb-10">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><LayoutTemplate size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Biblioteca de Fundo</h3></div>{currentSlide?.options?.backgroundImage && <button onClick={() => { updateSlideProperty(['options', 'backgroundImage'], undefined); clearPendingImageDraft('background'); }} className="text-[8px] font-black text-red-500 uppercase hover:text-red-400">Remover</button>}</div>
                  <div onClick={() => bgImageInputRef.current?.click()} className="relative aspect-video max-w-full rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl cursor-pointer hover:border-brand/40 transition-all flex items-center justify-center">{currentSlide?.options?.backgroundImage ? <img src={currentSlide.options.backgroundImage} className="w-full h-full object-contain" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700"><CloudUpload size={32} /><span className="text-[8px] font-black uppercase tracking-widest">Subir Background</span></div>}<div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus size={24} className="text-brand" /></div></div>
                  {uploadedBackgrounds.length > 0 && (
                    <div className="space-y-3">
                       <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Seus Backdrops</span>
                       <div className="grid grid-cols-4 gap-3">
                         {uploadedBackgrounds.map((bg, idx) => (
                           <div key={idx} className="relative group">
                              <button onClick={() => { updateSlideProperty(['options', 'backgroundImage'], bg); clearPendingImageDraft('background'); }} className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentSlide?.options?.backgroundImage === bg ? 'border-brand scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={bg} className="w-full h-full object-cover" /></button>
                              <button onClick={(e) => { e.stopPropagation(); setUploadedBackgrounds(prev => prev.filter((_, i) => i !== idx)); }} className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={8} /></button>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                  {renderOptimizationSummary('background')}
                </section>
              </div>
            ) : activeTab === 'ADVANCED' ? (
              <textarea value={dslInput} onChange={(e) => setDslInput(e.target.value)} className="w-full h-[600px] bg-black/40 p-4 font-mono text-[10px] border border-white/5 rounded-2xl outline-none custom-scrollbar" spellCheck={false} />
            ) : null}
          </div>
          <footer className="p-5 border-t border-white/5 bg-zinc-950"><button onClick={() => { if (guardPendingImageFlow('Confirme a imagem pendente antes de abrir a exportação.')) return; setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i))); setShowExportModal(true); }} className="w-full py-4 bg-brand text-black font-black rounded-xl text-[10px] uppercase shadow-lg flex items-center justify-center gap-3 active:scale-95"><Download size={16} strokeWidth={3} /> Exportar Tudo</button></footer>
        </aside>
        <main className="flex-1 bg-[#121214] relative flex flex-col">
          {error && <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4"><AlertCircle size={18}/><span className="text-[11px] font-black uppercase">{error}</span></div>}

          <div className="absolute top-5 right-5 z-40 flex items-center gap-1 bg-black/30 backdrop-blur-xl p-1.5 rounded-xl border border-white/5"><button onClick={() => setZoom(Math.max(0.1, zoom - 0.05))} className="p-1.5 text-zinc-500 hover:text-white"><ZoomOut size={16} /></button><div className="px-2 text-[10px] font-black font-mono text-zinc-400">{(zoom * 100).toFixed(0)}%</div><button onClick={() => setZoom(Math.min(1.5, zoom + 0.05))} className="p-1.5 text-zinc-500 hover:text-white"><ZoomIn size={16} /></button></div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-20">
            {carousel && carousel.slides.length > 0 ? (
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="transition-transform duration-500 shadow-[0_60px_150px_rgba(0,0,0,0.8)] shrink-0">
                {carousel.slides[currentIndex] && <SlideCanvas slide={carousel.slides[currentIndex]} index={currentIndex} canvasRef={canvasRef} onEditIcon={(b, i, itemIndex) => openIconEditor(b, i, itemIndex)} customFonts={[...(carousel.customFonts || []), ...clientFonts]} brandTheme={carousel.brandTheme} projectFX={carousel.projectFX} onUpdateImage={updateSlideProperties} onSelectionChange={setSelectedCanvasObject} interactionScale={zoom} debugMode={isDebugMode} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 text-center opacity-50 select-none">
                <FileJson size={80} strokeWidth={1} className="text-zinc-700" />
                <div className="space-y-3">
                  <h2 className="text-3xl font-black uppercase text-zinc-600 tracking-tighter italic">Nenhum Projeto</h2>
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-[0.2em]">Cole um JSON ou importe um arquivo para iniciar</p>
                </div>
                <button onClick={() => importInputRef.current?.click()} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all flex items-center gap-3 border border-white/5 hover:border-white/10 shadow-xl">
                  <Upload size={16} /> Importar JSON
                </button>
              </div>
            )}
          </div>
          {isDebugMode && carousel && carousel.slides.length > 0 && (
            <div className="absolute right-5 bottom-24 z-50 w-[440px] max-h-[55vh] overflow-auto rounded-[28px] border border-amber-400/30 bg-black/85 p-4 shadow-2xl backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Debug Branding</span>
                <span className="text-[10px] font-mono text-amber-100/70">?debug=1</span>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[10px] leading-5 text-amber-50">{JSON.stringify(fontDebugInfo, null, 2)}</pre>
            </div>
          )}
          {carousel && carousel.slides.length > 0 && (<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 bg-black/50 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/5 shadow-2xl transition-all hover:border-white/10"><button disabled={currentIndex === 0} onClick={() => { if (guardPendingImageFlow()) return; setCurrentIndex(prev => prev - 1); }} className="p-2 text-zinc-500 hover:text-white disabled:opacity-5 transition-all"><ChevronLeft size={20}/></button><div className="flex gap-2.5">{carousel.slides.map((_, i) => (<button key={i} onClick={() => { if (guardPendingImageFlow()) return; setCurrentIndex(i); }} className={`h-2 transition-all duration-300 rounded-full ${currentIndex === i ? 'w-8 bg-brand' : 'w-2 bg-white/10 hover:bg-white/20'}`} />))}</div><button disabled={currentIndex === carousel.slides.length - 1} onClick={() => { if (guardPendingImageFlow()) return; setCurrentIndex(prev => prev + 1); }} className="p-2 text-zinc-500 hover:text-white disabled:opacity-5 transition-all"><ChevronRight size={20}/></button><div className="w-[1px] h-5 bg-white/10" /><button onClick={() => duplicateSlide(currentIndex)} className="p-2 text-zinc-500 hover:text-brand transition-all" title="Duplicar slide"><Icons.Copy size={16} /></button><button disabled={carousel.slides.length <= 1} onClick={() => deleteSlide(currentIndex)} className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-20 transition-all" title="Remover slide"><Trash2 size={16} /></button></div>)}
        </main>
      </div>
      )}
    </div>
  );
};

export default App;
