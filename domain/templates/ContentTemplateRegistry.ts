import type { ContentTemplateDefinition } from '../../types';

const CANONICAL_CONTENT_TEMPLATES: ContentTemplateDefinition[] = [
  {
    id: 'HERO',
    name: 'Hero',
    description: 'Uma ideia central com hierarquia forte e leitura de impacto.',
    allowedBlocks: ['TITLE', 'PARAGRAPH', 'BADGE'],
    visualSignature: 'hero',
  },
  {
    id: 'STAT',
    name: 'Stat',
    description: 'Número ou métrica dominante com apoio textual abaixo.',
    allowedBlocks: ['TITLE', 'PARAGRAPH', 'BADGE'],
    visualSignature: 'stat',
  },
  {
    id: 'CHECKLIST',
    name: 'Checklist',
    description: 'Leitura linear por itens com apoio editorial opcional.',
    allowedBlocks: ['TITLE', 'LIST', 'PARAGRAPH', 'BADGE'],
    visualSignature: 'checklist',
  },
  {
    id: 'BOX_GRID',
    name: 'Box Grid',
    description: 'Leitura por células, boxes ou cards com presença visual.',
    allowedBlocks: ['TITLE', 'BOX', 'CARD', 'PARAGRAPH', 'BADGE'],
    visualSignature: 'box-grid',
  },
];

class ContentTemplateRegistry {
  private templates = new Map<string, ContentTemplateDefinition>();

  constructor() {
    CANONICAL_CONTENT_TEMPLATES.forEach((template) => this.templates.set(template.id, template));
  }

  resolveId(id: string) {
    return this.templates.has(id) ? id : undefined;
  }

  get(id: string) {
    const resolvedId = this.resolveId(id) ?? id;
    return this.templates.get(resolvedId);
  }

  getAll() {
    return Array.from(this.templates.values());
  }
}

export const contentTemplateRegistry = new ContentTemplateRegistry();
