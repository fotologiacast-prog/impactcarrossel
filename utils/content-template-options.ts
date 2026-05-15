import type { ContentTemplateDefinition } from '../types';

export interface VisibleContentTemplateOption {
  id: string;
  name: string;
  description: string;
  contentTemplateId: string;
  heroVariant?: 'default' | 'social';
  allowedBlockCount: number;
  visualSignature?: string;
}

export const buildVisibleContentTemplateOptions = (
  contentTemplates: ContentTemplateDefinition[],
): VisibleContentTemplateOption[] => contentTemplates.flatMap((template) => {
  if (template.id !== 'HERO') {
    return [{
      id: template.id,
      name: template.name,
      description: template.description,
      contentTemplateId: template.id,
      allowedBlockCount: template.allowedBlocks.length,
      visualSignature: template.visualSignature,
    }];
  }

  return [
    {
      id: 'HERO',
      name: template.name,
      description: template.description,
      contentTemplateId: template.id,
      heroVariant: 'default',
      allowedBlockCount: template.allowedBlocks.length,
      visualSignature: template.visualSignature,
    },
    {
      id: 'HERO_SOCIAL',
      name: 'Social',
      description: 'Foto, nome, @instagram e frase em um layout social sem imagem de fundo.',
      contentTemplateId: template.id,
      heroVariant: 'social',
      allowedBlockCount: template.allowedBlocks.length + 1,
      visualSignature: template.visualSignature,
    },
  ];
});
