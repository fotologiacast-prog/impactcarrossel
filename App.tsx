
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { carouselSchema, ValidatedCarousel } from './template-dsl/schema';
import { SlideCanvas } from './renderers/SlideCanvas';
import { captureJpeg, downloadZip } from './utils/export';
import { templateRegistry } from './domain/templates/TemplateRegistry';
import { TOKENS } from './design-tokens/tokens';
import { TemplateDefinition, Block, Project, CustomFont, OverlayImageConfig } from './types';
import {
  applyProjectClientToSlide,
  createBrandThemeFromPreset,
  getBrandPaletteSwatches,
  mergeSlideOptionsWithBrandTheme,
  normalizeFontFamilyName,
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
  RectangleHorizontal, Move3d, Component, AlignStartVertical, AlignEndVertical,
  AlignCenterVertical, Layout, Monitor, Ghost, Copy, MousePointer, Focus as FocusIcon, Hash
} from 'lucide-react';

const LOGO_URL = "https://ik.imagekit.io/zslvvoal4/Logo%20Impact.webp?updatedAt=1761153002773";

// Configurações do Supabase
import { supabase } from './services/supabase';

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

const SafeTextArea = ({ value, onChange, className, placeholder }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string }) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

const normalizeRenderedText = (value: string) =>
  value
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const getEffectiveBlockFontSize = (block: Block, allBlocks?: Block[]) => {
  if (typeof block.options?.fontSize === 'number' && !Number.isNaN(block.options.fontSize)) {
    return block.options.fontSize;
  }

  switch (block.type) {
    case 'TITLE': {
      const size = block.options?.size || 'md';
      if (size === 'sm') return 64;
      if (size === 'lg') return 180;
      return 92;
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'IMAGE' | 'BRAND' | 'CONTENT' | 'REFINE' | 'ADVANCED'>('IMAGE');
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
  } | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSlidesToExport, setSelectedSlidesToExport] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [templates] = useState<TemplateDefinition[]>(templateRegistry.getAll());
  const [showPasteTargetModal, setShowPasteTargetModal] = useState(false);
  const [pendingPastedImage, setPendingPastedImage] = useState<string | null>(null);
  const [selectedCanvasObject, setSelectedCanvasObject] = useState<{ type: 'IMAGE_BOX'; mode: 'box' | 'image' } | null>(null);
  const historyStackRef = useRef<string[]>([INITIAL_DSL]);
  const historyIndexRef = useRef(0);
  const isApplyingHistoryRef = useRef(false);
  const currentSlide = useMemo(() => carousel?.slides[currentIndex], [carousel, currentIndex]);
  const currentSlideHasBoxes = useMemo(
    () => !!currentSlide?.blocks?.some((block) => block.type === 'BOX'),
    [currentSlide],
  );
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
  const imageConfig = useMemo(() => currentSlide?.image, [currentSlide]);
  const [activeOverlayIndex, setActiveOverlayIndex] = useState(0);
  const overlayConfigs = useMemo(() => currentSlide?.overlayImages || [], [currentSlide]);
  const activeOverlay = useMemo(() => overlayConfigs[activeOverlayIndex], [overlayConfigs, activeOverlayIndex]);
  const [editingIconBlock, setEditingIconBlock] = useState<{ block: Block; index: number } | null>(null);
  const [iconInput, setIconInput] = useState('');
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
    };
  }, [brandPresets, carousel?.brandTheme?.paletteId, selectedClientProfile]);
  const currentSlideTheme = useMemo(
    () => mergeSlideOptionsWithBrandTheme(carousel?.brandTheme, currentSlide?.options, carousel?.projectFX),
    [carousel?.brandTheme, carousel?.projectFX, currentSlide?.options],
  );
  const activePaletteColors = useMemo(() => {
    if (activePalette) return getBrandPaletteSwatches(activePalette);
    return getBrandPaletteSwatches(currentBrandTheme);
  }, [activePalette, currentBrandTheme]);
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
  }, [currentIndex]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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

  const updateSlideProperty = useCallback((path: (string | number)[], value: any) => {
    console.log('Updating slide property:', path, value);
    updateSlideProperties([{ path, value }]);
  }, [updateSlideProperties]);

  const applyPastedImageToTarget = useCallback((target: 'TEMPLATE' | 'OVERLAY' | 'BACKGROUND', imageData: string) => {
    if (target === 'OVERLAY') {
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
      const nextOverlays = [...(currentSlide?.overlayImages || []), newOverlay];
      updateSlideProperty(['overlayImages'], nextOverlays);
      setActiveOverlayIndex(nextOverlays.length - 1);
      showToast('Novo overlay flutuante colado!');
      return;
    }

    if (target === 'BACKGROUND') {
      updateSlideProperty(['options', 'backgroundImage'], imageData);
      setUploadedBackgrounds((prev) => [...new Set([...prev, imageData])]);
      showToast('Imagem de fundo colada!');
      return;
    }

    updateSlideProperty(['image', 'url'], imageData);
    showToast('Imagem do template colada!');
  }, [currentSlide?.overlayImages, showToast, updateSlideProperty]);

  const undoLastAction = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    isApplyingHistoryRef.current = true;
    setDslInput(historyStackRef.current[historyIndexRef.current]);
    showToast('Ação desfeita.');
  }, [showToast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateSlideProperty(['image', 'url'], reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOverlayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newOverlay: OverlayImageConfig = {
        id: crypto.randomUUID(),
        url: reader.result as string,
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        isFlipped: false
      };
      const nextOverlays = [...(currentSlide?.overlayImages || []), newOverlay];
      updateSlideProperty(['overlayImages'], nextOverlays);
      setActiveOverlayIndex(nextOverlays.length - 1);
      showToast("PNG adicionado à galeria!");
    };
    reader.readAsDataURL(file);
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imgUrl = reader.result as string;
      updateSlideProperty(['options', 'backgroundImage'], imgUrl);
      setUploadedBackgrounds(prev => [...new Set([...prev, imgUrl])]);
      showToast("Imagem de fundo aplicada!");
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
          setDslInput(content);
          setCurrentIndex(0);
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
                updateSlideProperties([
                  { path: ['blocks', editingIconBlock.index, 'options', 'customIcon'], value: result },
                  { path: ['blocks', editingIconBlock.index, 'options', 'icon'], value: undefined }
                ]);
                showToast("Ícone personalizado colado!");
              } else {
                setPendingPastedImage(result);
                setShowPasteTargetModal(true);
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

      setClientFonts(fetchedFonts);
      setBrandPresets(
        [...DEFAULT_BRAND_PRESETS, ...clientPresets].map((preset) => ({
          ...preset,
          colors: getBrandPaletteSwatches(preset),
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
    
    // Deduplicate fonts by family name
    const uniqueFonts = new Map();
    allFonts.forEach(f => {
      if (f.family && f.url) {
        uniqueFonts.set(normalizeFontFamilyName(f.family), f);
      }
    });
    
    console.log('Injecting fonts:', Array.from(uniqueFonts.values()).map(f => f.family));

    const css = Array.from(uniqueFonts.values()).map(font => {
      // Handle URLs with query parameters
      const cleanUrl = font.url.split('?')[0];
      const ext = cleanUrl.split('.').pop()?.toLowerCase();
      
      let format = '';
      if (ext === 'ttf') format = "format('truetype')";
      else if (ext === 'otf') format = "format('opentype')";
      else if (ext === 'woff') format = "format('woff')";
      else if (ext === 'woff2') format = "format('woff2')";
      
      // Ensure font family is properly quoted
      return `
        @font-face {
          font-family: '${font.family}';
          src: url('${font.url}') ${format};
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    }).join('\n');

    styleEl.textContent = css;
  }, [carousel?.customFonts, clientFonts]);

  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      return;
    }

    const currentSnapshot = historyStackRef.current[historyIndexRef.current];
    if (dslInput === currentSnapshot) return;

    historyStackRef.current = [
      ...historyStackRef.current.slice(0, historyIndexRef.current + 1),
      dslInput,
    ].slice(-120);
    historyIndexRef.current = historyStackRef.current.length - 1;
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
            if (block.type !== 'TITLE' && block.type !== 'PARAGRAPH') return;
            if (typeof block.content !== 'string') return;
            if (block.content.includes('[[') || block.content.includes('**')) return;

            const renderedElement = wrapper.firstElementChild as HTMLElement | null;
            if (!renderedElement) return;

            const renderedText = normalizeRenderedText(renderedElement.innerText || '');
            const currentText = normalizeRenderedText(block.content);

            if (!renderedText || renderedText === currentText) return;

            slide.blocks[blockIndex].content = renderedText;
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
    updateGlobalProperty(['brandTheme'], createBrandThemeFromPreset(preset));
  };

  const handleCreatePalette = async () => {
    if (!newPaletteData.name.trim()) return;
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
              {[
                { id: 'TEMPLATE', label: 'Imagem do template', icon: ImageIconLucide },
                { id: 'OVERLAY', label: 'Overlay PNG', icon: Ghost },
                { id: 'BACKGROUND', label: 'Background', icon: LayoutTemplate },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    applyPastedImageToTarget(option.id as 'TEMPLATE' | 'OVERLAY' | 'BACKGROUND', pendingPastedImage);
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

      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] px-12 py-6 rounded-[32px] flex items-center gap-6 animate-in slide-in-from-bottom-12 fade-in duration-500 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-3xl border border-white/10 ${toast.type === 'success' ? 'bg-brand/95 text-black' : 'bg-red-500/95 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={28} strokeWidth={3} /> : <AlertCircle size={28} strokeWidth={3} />}
          <span className="text-[16px] font-black uppercase tracking-[0.1em]">{toast.message}</span>
        </div>
      )}

      <input type="file" ref={importInputRef} onChange={handleImportProject} accept=".json" className="hidden" />
      <input type="file" ref={fontInputRef} onChange={handleFontUpload} accept=".ttf,.otf,.woff2" className="hidden" />
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
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedSlidesToExport.has(idx) ? 'bg-brand text-black' : 'bg-zinc-800 text-zinc-500'}`}><span className="font-black text-xs">{getSlideDisplayNumber(s, idx)}</span></div>
                       <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest truncate px-2 w-full">{s.template.replace(/_/g, ' ')}</p>
                       {selectedSlidesToExport.has(idx) && (<div className="absolute top-2 right-2 text-brand"><CheckCircle2 size={16} /></div>)}
                    </button>
                 ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-white/5">
                 <button onClick={() => setSelectedSlidesToExport(new Set())} className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all">Limpar</button>
                 <button onClick={() => setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i)))} className="px-6 py-5 text-[10px] font-black text-brand uppercase tracking-widest hover:text-brand/80 transition-all">Todos</button>
                 <button onClick={startBatchExport} disabled={selectedSlidesToExport.size === 0} className="flex-1 py-5 bg-brand hover:bg-brand/80 disabled:opacity-30 text-black font-black uppercase rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"><Download size={18} strokeWidth={3} /> Gerar {selectedSlidesToExport.size} Slides</button>
              </div>
           </div>
        </div>
      )}

      {editingIconBlock && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setEditingIconBlock(null)}>
           <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Escolher Ícone</h2>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Biblioteca ou CTRL+V para PNG</p>
                 </div>
                 <button onClick={() => setEditingIconBlock(null)} className="p-3 hover:bg-white/5 rounded-full text-zinc-500"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-1">
                 {ICON_LIBRARY_PRESETS.map(item => (
                    <button key={item.id} onClick={() => { updateSlideProperties([{ path: ['blocks', editingIconBlock.index, 'options', 'icon'], value: item.id }, { path: ['blocks', editingIconBlock.index, 'options', 'customIcon'], value: undefined }]); setEditingIconBlock(null); }} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all group ${editingIconBlock.block.options?.icon === item.id ? 'border-brand bg-brand/10 text-brand' : 'border-white/5 bg-black/40 hover:border-brand/50'}`}><item.icon size={32} strokeWidth={1.5} className="transition-transform group-hover:scale-110" /><span className="text-[8px] font-black uppercase tracking-tighter text-zinc-600 group-hover:text-brand">{item.label}</span></button>
                 ))}
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-black uppercase text-zinc-500 px-1 tracking-widest">Personalizado (URL ou SVG)</label>
                 <div className="flex gap-3"><input type="text" placeholder="https://... ou <svg..." className="flex-1 bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white outline-none focus:border-brand/50 transition-all" value={iconInput} onChange={(e) => setIconInput(e.target.value)} /><button onClick={() => { updateSlideProperties([{ path: ['blocks', editingIconBlock.index, 'options', 'customIcon'], value: iconInput }, { path: ['blocks', editingIconBlock.index, 'options', 'icon'], value: undefined }]); setEditingIconBlock(null); }} className="px-8 py-4 bg-zinc-800 text-white font-black uppercase text-[10px] rounded-2xl hover:bg-zinc-700 transition-all">Aplicar</button></div>
              </div>
           </div>
        </div>
      )}

      {isCreatingPalette && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => { setIsCreatingPalette(false); setEditingPaletteId(null); }}>
           <div className="w-full max-xl bg-zinc-900 border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
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
           <div className="w-full max-md space-y-10 text-center px-10">
              <div className="relative inline-block"><div className="absolute inset-0 blur-3xl bg-brand/20 animate-pulse rounded-full" /><Loader2 size={64} className="animate-spin text-brand relative mx-auto" strokeWidth={3} /></div>
              <div className="space-y-4"><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter animate-pulse">{exportStatus}</h2><div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand transition-all duration-500" style={{ width: `${exportProgress}%` }} /></div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{exportProgress}% COMPLETO</p></div>
           </div>
        </div>
      )}

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
                  onClick={() => setActiveTab(tab.id as any)}
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
                <div className="grid grid-cols-1 gap-2">
                  {templates.map(tpl => (
                    <button
                      key={tpl.name}
                      onClick={() => updateSlideProperty(['template'], tpl.name)}
                      className={`w-full p-4 border rounded-2xl flex items-center gap-4 transition-all ${currentSlide?.template === tpl.name ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentSlide?.template === tpl.name ? 'bg-brand text-black' : 'bg-black text-zinc-600'}`}>
                        <Library size={18}/>
                      </div>
                      <div className="text-left">
                        <p className={`text-[10px] font-black uppercase ${currentSlide?.template === tpl.name ? 'text-brand' : 'text-white'}`}>{tpl.name.replace(/_/g, ' ')}</p>
                        <p className="text-[8px] text-zinc-600 font-medium truncate max-w-[220px]">{tpl.description}</p>
                      </div>
                    </button>
                  ))}
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
                              {getBrandPaletteSwatches(preset).slice(0, 3).map((color: string, index: number) => (
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
                            ['Branco', currentBrandTheme.white || '#F5F3EE'],
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
                          value={currentBrandTheme.white || '#F5F3EE'}
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
                          value={currentBrandTheme.fontDestaque || 'Instrument Serif'}
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
                  <TransformControl label="Luz Global" value={carousel?.projectFX?.lightingIntensity ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'lightingIntensity'], v)} highlight />
                  <TransformControl label="Ruído Global" value={carousel?.projectFX?.noiseAmount ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'noiseAmount'], v)} />
                  <TransformControl label="Vinheta Global" value={carousel?.projectFX?.vignette ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'vignette'], v)} />
                  <TransformControl label="Clareza Global" value={carousel?.projectFX?.clarity ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateGlobalProperty(['projectFX', 'clarity'], v)} />
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
                  <TransformControl label="Luz Local" value={currentSlide?.options?.postFX?.lightingIntensity ?? carousel?.projectFX?.lightingIntensity ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'lightingIntensity'], v)} />
                  <TransformControl label="Ruído Local" value={currentSlide?.options?.postFX?.noiseAmount ?? carousel?.projectFX?.noiseAmount ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'noiseAmount'], v)} />
                  <TransformControl label="Vinheta Local" value={currentSlide?.options?.postFX?.vignette ?? carousel?.projectFX?.vignette ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'vignette'], v)} />
                  <TransformControl label="Clareza Local" value={currentSlide?.options?.postFX?.clarity ?? carousel?.projectFX?.clarity ?? 0} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'postFX', 'clarity'], v)} />
                </section>
              </div>
            ) : activeTab === 'CONTENT' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                  {currentSlide ? (
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
                              <SafeTextArea value={(Array.isArray(block.content) ? block.content.join('\n') : block.content as string) || ''} onChange={(val) => updateSlideProperty(['blocks', bIdx, 'content'], block.type === 'LIST' ? val.split('\n') : val)} className="w-full bg-black/60 border border-white/5 rounded-2xl p-5 text-[13px] font-medium text-white outline-none focus:border-brand/50 min-h-[120px] custom-scrollbar resize-none transition-all" placeholder="Digite o conteúdo do slide aqui..." />
                            ) : null}
                            
                            {block.type !== 'SPACER' && (
                              <div className="space-y-4 pt-2 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Estilo</span>
                                      <select value={block.options?.fontVariant || 'padrão'} onChange={(e) => updateSlideProperty(['blocks', bIdx, 'options', 'fontVariant'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 px-3 text-[10px] font-bold text-white outline-none appearance-none cursor-pointer"><option value="padrão">Padrão</option><option value="destaque">Destaque</option></select>
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
                      <button onClick={() => { const n = [...currentSlide.blocks, { type: 'PARAGRAPH', content: 'Novo parágrafo...', options: {} }]; updateSlideProperty(['blocks'], n); }} className="w-full py-10 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-brand hover:border-brand/40 hover:bg-brand/5 transition-all active:scale-[0.98]"><PlusCircle size={24}/><span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Novo Bloco</span></button>

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
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={getSlideDisplayNumber(currentSlide, currentIndex)}
                            onChange={(e) => updateSlideProperty(['slideNumber'], Number(e.target.value || currentIndex + 1))}
                            className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all"
                          />
                          <button onClick={() => updateSlideProperty(['slideNumber'], currentIndex + 1)} className="px-4 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-2xl bg-white/5 text-zinc-400 hover:text-white transition-all">Reset</button>
                          <button onClick={resetSlideNumbers} className="px-4 py-3.5 text-[9px] font-black uppercase tracking-widest rounded-2xl bg-white/5 text-brand hover:bg-brand/10 transition-all">Resetar Tudo</button>
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
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Fonte Destaque</label><select value={currentSlideTheme.fontDestaque || 'Instrument Serif'} onChange={(e) => updateSlideProperty(['options', 'fontDestaque'], e.target.value)} className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-3.5 px-4 text-[11px] font-bold text-white outline-none focus:border-brand/50 transition-all">{allFontOptions.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
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
                <section className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5"><ImageIconLucide size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Imagem do Template</h3></div>
                    {imageConfig?.url && <button onClick={() => updateSlideProperty(['image', 'url'], undefined)} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors flex items-center gap-1.5"><Trash2 size={12} /> Limpar</button>}
                  </div>
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl">
                    {imageConfig?.url ? <img src={imageConfig.url} className="w-full h-full object-contain" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700"><Icons.ImagePlus size={40} /><span className="text-[9px] font-black uppercase tracking-widest">Add Imagem Template</span></div>}
                    <input ref={imageInputRef} type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                    <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-dashed border-brand/50 rounded-3xl" />
                  </div>
                  
                  {imageConfig && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                         <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Modo de Exibição</span>
                         <div className="grid grid-cols-4 gap-2">{IMAGE_TYPE_PRESETS.map(p => (<button key={p.id} onClick={() => updateSlideProperty(['image', 'type'], p.id)} className={`p-3 rounded-xl border flex items-center justify-center transition-all ${imageConfig.type === p.id ? 'bg-brand text-black border-brand shadow-lg scale-105' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`} title={p.label}><p.icon size={18}/></button>))}</div>
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
                       {(currentSlide?.template === 'PREMIUM_GLASS' || currentSlide?.template === 'CINEMATIC_BG' || currentSlide?.template === 'FADE') && (
                         <div className="pt-6 border-t border-white/5 space-y-6">
                           <div className="flex items-center gap-2 px-1"><Contrast size={14} className="text-brand" /><span className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.15em]">Leitura da Imagem</span></div>
                           {currentSlide?.template === 'PREMIUM_GLASS' && (
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Tom da Box</label>
                               <select value={imageConfig.boxOverlay || 'light'} onChange={(e) => updateSlideProperty(['image', 'boxOverlay'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-4 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all">
                                 <option value="light">Light Glass</option>
                                 <option value="dark">Dark Glass</option>
                               </select>
                             </div>
                           )}
                           {currentSlide?.template === 'FADE' && (
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Lado do Fade</label>
                               <select value={currentSlide?.options?.fadeSide || imageConfig.position || 'left'} onChange={(e) => updateSlideProperty(['options', 'fadeSide'], e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-4 text-[12px] font-bold text-white outline-none focus:border-brand/50 transition-all">
                                 <option value="left">Esquerda</option>
                                 <option value="right">Direita</option>
                                 <option value="top">Topo</option>
                                 <option value="bottom">Base</option>
                               </select>
                             </div>
                           )}
                           <div className="grid grid-cols-2 gap-6">
                             <TransformControl label={currentSlide?.template === 'PREMIUM_GLASS' ? ((imageConfig.boxOverlay || 'light') === 'dark' ? 'Potência do Dark Glass' : 'Potência do Light Glass') : 'Força do Overlay'} value={currentSlide?.options?.backgroundOverlayStrength ?? (currentSlide?.template === 'PREMIUM_GLASS' ? 0.42 : currentSlide?.template === 'CINEMATIC_BG' ? 0.42 : 0.55)} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'backgroundOverlayStrength'], v)} />
                             <TransformControl label="Blur de Leitura" value={currentSlide?.template === 'FADE' ? (currentSlide?.options?.fadeBlur ?? 14) : (currentSlide?.options?.backgroundBlur ?? 12)} min={0} max={40} step={1} onChange={(v) => updateSlideProperty(currentSlide?.template === 'FADE' ? ['options', 'fadeBlur'] : ['options', 'backgroundBlur'], v)} />
                           </div>
                           {currentSlide?.template === 'FADE' && (
                             <TransformControl label="Força do Fade" value={currentSlide?.options?.fadeStrength ?? 0.55} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'fadeStrength'], v)} highlight />
                           )}
                           {currentSlide?.template === 'CINEMATIC_BG' && (
                             <div className="grid grid-cols-2 gap-6">
                               <TransformControl label="Preservar Highlights" value={currentSlide?.options?.preserveHighlights ?? 0.25} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'preserveHighlights'], v)} />
                               <TransformControl label="Levantar Sombras" value={currentSlide?.options?.liftShadows ?? 0.2} min={0} max={1} step={0.01} onChange={(v) => updateSlideProperty(['options', 'liftShadows'], v)} />
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                </section>

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
                     </div>
                   )}
                </section>

                <section className="space-y-6 pt-8 border-t border-white/5 pb-10">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><LayoutTemplate size={18} className="text-brand" /><h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.2em]">Biblioteca de Fundo</h3></div>{currentSlide?.options?.backgroundImage && <button onClick={() => updateSlideProperty(['options', 'backgroundImage'], undefined)} className="text-[8px] font-black text-red-500 uppercase hover:text-red-400">Remover</button>}</div>
                  <div onClick={() => bgImageInputRef.current?.click()} className="relative aspect-video max-w-full rounded-3xl overflow-hidden bg-zinc-950 border border-white/5 group shadow-2xl cursor-pointer hover:border-brand/40 transition-all flex items-center justify-center">{currentSlide?.options?.backgroundImage ? <img src={currentSlide.options.backgroundImage} className="w-full h-full object-contain" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-700"><CloudUpload size={32} /><span className="text-[8px] font-black uppercase tracking-widest">Subir Background</span></div>}<div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus size={24} className="text-brand" /></div></div>
                  {uploadedBackgrounds.length > 0 && (
                    <div className="space-y-3">
                       <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-1">Seus Backdrops</span>
                       <div className="grid grid-cols-4 gap-3">
                         {uploadedBackgrounds.map((bg, idx) => (
                           <div key={idx} className="relative group">
                              <button onClick={() => updateSlideProperty(['options', 'backgroundImage'], bg)} className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentSlide?.options?.backgroundImage === bg ? 'border-brand scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={bg} className="w-full h-full object-cover" /></button>
                              <button onClick={(e) => { e.stopPropagation(); setUploadedBackgrounds(prev => prev.filter((_, i) => i !== idx)); }} className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={8} /></button>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </section>
              </div>
            ) : activeTab === 'ADVANCED' ? (
              <textarea value={dslInput} onChange={(e) => setDslInput(e.target.value)} className="w-full h-[600px] bg-black/40 p-4 font-mono text-[10px] border border-white/5 rounded-2xl outline-none custom-scrollbar" spellCheck={false} />
            ) : null}
          </div>
          <footer className="p-5 border-t border-white/5 bg-zinc-950"><button onClick={() => { setSelectedSlidesToExport(new Set(carousel?.slides.map((_, i) => i))); setShowExportModal(true); }} className="w-full py-4 bg-brand text-black font-black rounded-xl text-[10px] uppercase shadow-lg flex items-center justify-center gap-3 active:scale-95"><Download size={16} strokeWidth={3} /> Exportar Tudo</button></footer>
        </aside>
        <main className="flex-1 bg-[#121214] relative flex flex-col">
          {error && <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4"><AlertCircle size={18}/><span className="text-[11px] font-black uppercase">{error}</span></div>}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl transition-all hover:bg-black/60"><button onClick={() => setZoom(Math.min(1.5, zoom + 0.05))} className="p-3 text-zinc-400 hover:text-brand hover:bg-brand/10 rounded-full transition-all active:scale-90" title="Zoom In"><ZoomIn size={20} /></button><div className="w-8 h-[1px] bg-white/10" /><div className="text-[10px] font-black font-mono text-zinc-500 py-1 select-none">{(zoom * 100).toFixed(0)}%</div><div className="w-8 h-[1px] bg-white/10" /><button onClick={() => setZoom(Math.max(0.1, zoom - 0.05))} className="p-3 text-zinc-400 hover:text-brand hover:bg-brand/10 rounded-full transition-all active:scale-90" title="Zoom Out"><ZoomOut size={20} /></button></div>
          <div className="absolute top-5 right-5 z-40 flex items-center gap-1 bg-black/30 backdrop-blur-xl p-1.5 rounded-xl border border-white/5"><button onClick={() => setZoom(Math.max(0.1, zoom - 0.05))} className="p-1.5 text-zinc-500 hover:text-white"><ZoomOut size={16} /></button><div className="px-2 text-[10px] font-black font-mono text-zinc-400">{(zoom * 100).toFixed(0)}%</div><button onClick={() => setZoom(Math.min(1.5, zoom + 0.05))} className="p-1.5 text-zinc-500 hover:text-white"><ZoomIn size={16} /></button></div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-20">
            {carousel && carousel.slides.length > 0 ? (
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="transition-transform duration-500 shadow-[0_60px_150px_rgba(0,0,0,0.8)] shrink-0">
                {carousel.slides[currentIndex] && <SlideCanvas slide={carousel.slides[currentIndex]} index={currentIndex} canvasRef={canvasRef} onEditIcon={(b, i) => setEditingIconBlock({ block: b, index: i })} customFonts={[...(carousel.customFonts || []), ...clientFonts]} brandTheme={carousel.brandTheme} projectFX={carousel.projectFX} onUpdateImage={updateSlideProperties} onSelectionChange={setSelectedCanvasObject} />}
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
          {carousel && carousel.slides.length > 0 && (<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 bg-black/50 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/5 shadow-2xl transition-all hover:border-white/10"><button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="p-2 text-zinc-500 hover:text-white disabled:opacity-5 transition-all"><ChevronLeft size={20}/></button><div className="flex gap-2.5">{carousel.slides.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={`h-2 transition-all duration-300 rounded-full ${currentIndex === i ? 'w-8 bg-brand' : 'w-2 bg-white/10 hover:bg-white/20'}`} />))}</div><button disabled={currentIndex === carousel.slides.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)} className="p-2 text-zinc-500 hover:text-white disabled:opacity-5 transition-all"><ChevronRight size={20}/></button></div>)}
        </main>
      </div>
    </div>
  );
};

export default App;
