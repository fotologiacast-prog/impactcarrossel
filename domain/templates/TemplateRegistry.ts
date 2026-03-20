
import { TemplateDefinition, BlockType } from '../../types';

const UNIVERSAL_BLOCKS: BlockType[] = ['TITLE', 'LIST', 'PARAGRAPH', 'CARD', 'BADGE', 'SPACER', 'IMAGE', 'BOX', 'USER'];

export const INITIAL_TEMPLATES: TemplateDefinition[] = [
  { 
    name: 'SOCIAL_CHECKLIST', 
    description: 'Estilo checklist de perfil com header e boxes quadrados.',
    layoutType: 'STACKED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'SOCIAL_CHECKLIST',
      blocks: [
        { type: 'USER', content: 'Alex Design', options: { handle: '@alex.dsgn', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200', hideName: false } },
        { type: 'LIST', content: ['Definir Nicho', 'Criar Identidade', 'Planejar Conteúdo'], options: { variant: 'check-list', fontSize: 42 } },
        { type: 'BOX', content: 'Começar Agora', options: { variant: 'outlined', align: 'center', icon: 'ArrowRight' } }
      ],
      options: { theme: 'dark', accent: '#EAB308', background: '#0D0D0D' }
    }
  },
  { 
    name: 'BENTO_SHOWCASE', 
    description: 'Grid modular ultra-moderno estilo Bento. Perfeito para features.',
    layoutType: 'GRID', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'BENTO_SHOWCASE',
      blocks: [
        { type: 'BOX', content: 'Analytics', options: { variant: 'box', icon: 'BarChart2', fontSize: 32 } },
        { type: 'BOX', content: 'Growth', options: { variant: 'box', icon: 'TrendingUp', fontSize: 32, color: '#10B981' } },
        { type: 'BOX', content: 'Users', options: { variant: 'box', icon: 'Users', fontSize: 32 } },
        { type: 'BOX', content: 'Revenue', options: { variant: 'box', icon: 'DollarSign', fontSize: 32 } }
      ],
      options: { theme: 'dark', accent: '#3B82F6', background: '#0F172A' }
    }
  },
  { 
    name: 'MEGA_STATEMENT', 
    description: 'Tipografia máxima e minimalismo. Impacto visual imediato.',
    layoutType: 'CENTERED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'MEGA_STATEMENT',
      blocks: [
        { type: 'TITLE', content: 'LESS IS MORE', options: { fontSize: 120, align: 'center', fontVariant: 'destaque', lineHeight: 0.9 } },
        { type: 'PARAGRAPH', content: 'O poder do minimalismo no design moderno.', options: { align: 'center', fontSize: 24, color: '#888' } }
      ],
      options: { theme: 'light', background: '#FFFFFF', text: '#000000' }
    }
  },
  { 
    name: 'GLASS_OVERLAY', 
    description: 'Camadas de vidro flutuante com profundidade e desfoque.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'GLASS_OVERLAY',
      image: { type: 'IMAGE_GLASS_CARD', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?fit=crop&w=800&q=80', overlay: 'dark' },
      blocks: [
        { type: 'TITLE', content: 'Glassmorphism', options: { fontSize: 48, align: 'center' } },
        { type: 'PARAGRAPH', content: 'Transparência e desfoque para profundidade.', options: { align: 'center', fontSize: 18 } }
      ],
      options: { theme: 'dark' }
    }
  },
  { 
    name: 'ASPECT_EDITORIAL', 
    description: 'Equilíbrio assimétrico de revista com foco em imagem.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'ASPECT_EDITORIAL',
      image: { type: 'IMAGE_SPLIT_HALF', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=800&q=80', position: 'right' },
      blocks: [
        { type: 'TITLE', content: 'Editorial', options: { fontSize: 64, fontVariant: 'destaque' } },
        { type: 'PARAGRAPH', content: 'Layouts inspirados em revistas de moda.', options: { fontSize: 20 } }
      ],
      options: { theme: 'light', background: '#F3F4F6' }
    }
  },
  { 
    name: 'MINIMAL_CHECKLIST', 
    description: 'Lista limpa e direta para conteúdo educacional rápido.',
    layoutType: 'STACKED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'MINIMAL_CHECKLIST',
      blocks: [
        { type: 'TITLE', content: 'Daily Routine', options: { fontSize: 48 } },
        { type: 'LIST', content: ['Wake up early', 'Drink water', 'Exercise', 'Read 30 mins'], options: { variant: 'default', fontSize: 28 } }
      ],
      options: { theme: 'light', background: '#FFFFFF', accent: '#000' }
    }
  },
  { 
    name: 'HERO_STATEMENT', 
    description: 'Impacto total centralizado. Ideal para capas.',
    layoutType: 'CENTERED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'HERO_STATEMENT',
      blocks: [
        { type: 'TITLE', content: 'MAKE IT POP', options: { fontSize: 96, align: 'center', color: '#FFFFFF', fontVariant: 'destaque' } },
        { type: 'BADGE', content: 'NEW COLLECTION', options: { align: 'center', variant: 'pill' } }
      ],
      options: { theme: 'dark', background: '#4F46E5' }
    }
  },
  { 
    name: 'INFO_LIST_V1', 
    description: 'Foco em conteúdo denso e listas técnicas.',
    layoutType: 'STACKED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'INFO_LIST_V1',
      blocks: [
        { type: 'TITLE', content: 'Specs', options: { fontSize: 42 } },
        { type: 'LIST', content: ['Processor: M2 Chip', 'Memory: 16GB Unified', 'Storage: 512GB SSD', 'Display: Retina XDR'], options: { variant: 'muted', fontSize: 24 } }
      ],
      options: { theme: 'dark', background: '#18181B' }
    }
  },
  { 
    name: 'PREMIUM_GLASS', 
    description: 'Cartão translúcido elegante sobre imagem.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'PREMIUM_GLASS',
      image: { type: 'IMAGE_GLASS_CARD', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?fit=crop&w=800&q=80', boxOverlay: 'light' },
      blocks: [
        { type: 'TITLE', content: 'Premium', options: { fontSize: 56, align: 'center', color: '#000' } },
        { type: 'PARAGRAPH', content: 'Elegância em cada detalhe.', options: { align: 'center', color: '#333' } }
      ],
      options: { theme: 'light' }
    }
  },
  { 
    name: 'SPLIT_EDITORIAL', 
    description: 'Divisão equilibrada entre visual e texto.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'SPLIT_EDITORIAL',
      image: { type: 'IMAGE_SPLIT_HALF', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=800&q=80', position: 'left' },
      blocks: [
        { type: 'TITLE', content: 'Fashion', options: { fontSize: 64 } },
        { type: 'PARAGRAPH', content: 'Trends for the upcoming season.', options: { fontSize: 18 } }
      ],
      options: { theme: 'dark', background: '#000000' }
    }
  },
  { 
    name: 'PROFILE_FOCUS', 
    description: 'Autoridade e branding pessoal.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'PROFILE_FOCUS',
      blocks: [
        { type: 'USER', content: 'Sarah CEO', options: { handle: '@sarah.ceo', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=200&h=200', size: 'lg' } },
        { type: 'PARAGRAPH', content: '"Leadership is not about being in charge. It is about taking care of those in your charge."', options: { fontSize: 24, align: 'center', fontVariant: 'destaque' } }
      ],
      options: { theme: 'light', background: '#FDF2F8', accent: '#DB2777' }
    }
  },
  { 
    name: 'FOCUS_OBJECT', 
    description: 'Destaque de produto com suporte a cards.',
    layoutType: 'EDITORIAL', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'FOCUS_OBJECT',
      image: { type: 'IMAGE_BOX', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?fit=crop&w=800&q=80', position: 'bottom' },
      blocks: [
        { type: 'TITLE', content: 'Minimal Watch', options: { fontSize: 48, align: 'center' } },
        { type: 'BADGE', content: '$199', options: { align: 'center', variant: 'pill' } }
      ],
      options: { theme: 'light', background: '#FFFFFF' }
    }
  },
  { 
    name: 'CINEMATIC_BG', 
    description: 'Imagem full-bleed com sobreposição flexível.',
    layoutType: 'CENTERED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'CINEMATIC_BG',
      image: { type: 'IMAGE_BACKGROUND', url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?fit=crop&w=800&q=80', overlay: 'dark' },
      blocks: [
        { type: 'TITLE', content: 'The City', options: { fontSize: 80, align: 'center', color: '#FFF' } },
        { type: 'PARAGRAPH', content: 'Lights, camera, action.', options: { align: 'center', color: '#CCC' } }
      ],
      options: { theme: 'dark' }
    }
  },
  {
    name: 'FADE',
    description: 'Imagem full background com fade direcional para leitura.',
    layoutType: 'EDITORIAL',
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'FADE',
      image: { type: 'IMAGE_BACKGROUND', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?fit=crop&w=1200&q=80', position: 'left' },
      blocks: [
        { type: 'TITLE', content: 'Fade Focus', options: { fontSize: 70 } },
        { type: 'PARAGRAPH', content: 'Leitura suave com profundidade e contraste controlado.', options: { fontSize: 24 } },
      ],
      options: { theme: 'dark', fadeSide: 'left', fadeStrength: 0.38, fadeBlur: 0 }
    }
  },
  {
    name: 'PNG_STAGE',
    description: 'Canvas limpo para compor texto com espaco reservado para PNGs.',
    layoutType: 'EDITORIAL',
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'PNG_STAGE',
      blocks: [
        { type: 'TITLE', content: 'Destaque com PNG', options: { fontSize: 80 } },
        { type: 'PARAGRAPH', content: 'Use este modo para deixar uma area limpa e posicionar overlays PNG com mais liberdade.', options: { fontSize: 24 } },
      ],
      options: { theme: 'light', background: '#F7F3EC', text: '#141414', contentHorizontalAlign: 'left', contentVerticalAlign: 'center' }
    }
  },
  { 
    name: 'IMAGE_SIDEBAR', 
    description: 'Layout de revista com sidebar visual.',
    layoutType: 'STACKED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'IMAGE_SIDEBAR',
      image: { type: 'IMAGE_SPLIT_HALF', url: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?fit=crop&w=800&q=80', position: 'left' },
      blocks: [
        { type: 'TITLE', content: 'Tech Life', options: { fontSize: 56 } },
        { type: 'LIST', content: ['Coding', 'Coffee', 'Repeat'], options: { variant: 'default' } }
      ],
      options: { theme: 'dark', background: '#111' }
    }
  },
  { 
    name: 'CARD_CLUSTER', 
    description: 'Foco em conversão e blocos de destaque.',
    layoutType: 'STACKED', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'CARD_CLUSTER',
      blocks: [
        { type: 'TITLE', content: 'Why Us?', options: { fontSize: 48, align: 'center' } },
        { type: 'CARD', content: 'Fast Support', options: { icon: 'Zap' } },
        { type: 'CARD', content: 'Secure', options: { icon: 'Shield' } }
      ],
      options: { theme: 'dark', background: '#1E293B' }
    }
  },
  { 
    name: 'CARD_BOX', 
    description: 'Boxes informativos grandes com grid automático.',
    layoutType: 'GRID', 
    allowedBlocks: UNIVERSAL_BLOCKS,
    exampleSlide: {
      template: 'CARD_BOX',
      blocks: [
        { type: 'BOX', content: 'Strategy', options: { variant: 'box', fontSize: 24 } },
        { type: 'BOX', content: 'Execution', options: { variant: 'box', fontSize: 24 } }
      ],
      options: { theme: 'light', background: '#F8FAFC' }
    }
  }
];

class Registry {
  private templates: Map<string, TemplateDefinition> = new Map();
  
  constructor() { 
    INITIAL_TEMPLATES.forEach(t => this.templates.set(t.name, t)); 
  }
  
  get(name: string) { 
    return this.templates.get(name); 
  }
  
  register(template: TemplateDefinition) { 
    this.templates.set(template.name, template); 
  }
  
  unregister(name: string) { 
    this.templates.delete(name); 
  }
  
  getAll() { 
    return Array.from(this.templates.values()); 
  }
}

export const templateRegistry = new Registry();
