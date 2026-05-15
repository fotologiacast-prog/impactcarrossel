import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Grid2x2, ImageIcon, Type } from 'lucide-react';
import type { PrototypeTemplateCard, PrototypeTemplateFamily } from '../types.ts';
import {
  BoxAccentBar,
  BoxFeatureRows,
  BoxGridCards,
  ImageCaption,
  ImageOverlay,
  ImageSideContent,
  ListNumberedRows,
  ListPillTags,
  ListStackedCards,
  TextBigStatement,
  TextQuote,
  TextStatHighlight,
} from './VisualBlockTemplates';
import {
  PROTOTYPE_TEMPLATE_LAB_FAMILIES,
  getPrototypeTemplateLabTemplatesByFamily,
} from '../utils/prototype-template-lab.ts';

const FAMILY_META: Record<
  PrototypeTemplateFamily,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    description: string;
  }
> = {
  LIST: {
    icon: Grid2x2,
    title: 'Lista',
    description: 'Modelos visuais de bloco LIST.',
  },
  BOX: {
    icon: Boxes,
    title: 'Box / Icon Grid',
    description: 'Modelos visuais de box e feature grid.',
  },
  IMAGE: {
    icon: ImageIcon,
    title: 'Imagem',
    description: 'Modelos visuais para blocos de imagem.',
  },
  TEXT: {
    icon: Type,
    title: 'Texto',
    description: 'Modelos visuais para quote, statement e stat.',
  },
};

const MOCK_IMAGE =
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80';

const getStageStyle = (family: PrototypeTemplateFamily): React.CSSProperties => {
  switch (family) {
    case 'LIST':
      return {
        background:
          'linear-gradient(180deg, #17161a 0%, #0d0d10 100%)',
      };
    case 'BOX':
      return {
        background:
          'linear-gradient(180deg, #121318 0%, #0a0b0f 100%)',
      };
    case 'IMAGE':
      return {
        background:
          'linear-gradient(180deg, #18191d 0%, #0d0e12 100%)',
      };
    case 'TEXT':
      return {
        background:
          'linear-gradient(180deg, #141519 0%, #090a0d 100%)',
      };
    default:
      return {
        background: 'linear-gradient(180deg, #15171c 0%, #0d0f14 100%)',
      };
  }
};

const getStageBlockStyle = (family: PrototypeTemplateFamily): React.CSSProperties => {
  switch (family) {
    case 'LIST':
      return {
        width: '84%',
        marginTop: '118px',
      };
    case 'BOX':
      return {
        width: '86%',
        marginTop: '118px',
      };
    case 'IMAGE':
      return {
        width: '86%',
        marginTop: '110px',
      };
    case 'TEXT':
      return {
        width: '78%',
        marginTop: '140px',
      };
    default:
      return {
        width: '82%',
        marginTop: '120px',
      };
  }
};

const renderTemplate = (template: PrototypeTemplateCard) => {
  switch (template.id) {
    case 'list-numbered-rows':
      return (
        <ListNumberedRows
          title="Como funciona"
          subtitle="Lista editorial com progressão clara"
          items={[
            { title: 'Diagnóstico', text: 'Entender o cenário e o contexto.' },
            { title: 'Direção', text: 'Definir a mensagem principal.' },
            { title: 'Execução', text: 'Transformar isso em peça visual.' },
          ]}
          background="transparent"
        />
      );
    case 'list-pill-tags':
      return (
        <ListPillTags
          title="Canais que funcionam"
          subtitle="Pills com wrap e leitura rápida"
          items={[
            { title: 'SEO orgânico' },
            { title: 'Parcerias B2B' },
            { title: 'Comunidade' },
            { title: 'Conteúdo técnico' },
          ]}
          background="transparent"
        />
      );
    case 'list-stacked-cards':
      return (
        <ListStackedCards
          title="Benefícios principais"
          subtitle="Cada item vira um mini-card"
          items={[
            { icon: '✦', title: 'Ativa lembrança', text: 'Mais presença visual.' },
            { icon: '✦', title: 'Organiza leitura', text: 'Mais ritmo e clareza.' },
            { icon: '✦', title: 'Valoriza a mensagem', text: 'Mais corpo para o argumento.' },
          ]}
          background="transparent"
        />
      );
    case 'box-grid-cards':
      return (
        <BoxGridCards
          title="Pilares"
          subtitle="Grid visual para features"
          items={[
            { icon: '✦', title: 'Clareza' },
            { icon: '✦', title: 'Ritmo' },
            { icon: '✦', title: 'Conversão' },
            { icon: '✦', title: 'Consistência' },
          ]}
          background="transparent"
        />
      );
    case 'box-feature-rows':
      return (
        <BoxFeatureRows
          title="O que isso entrega"
          subtitle="Rows horizontais com foco em benefício"
          items={[
            { icon: '◆', title: 'Mais foco', text: 'A leitura entende rápido.' },
            { icon: '◆', title: 'Mais clareza', text: 'A composição respira melhor.' },
            { icon: '◆', title: 'Mais intenção', text: 'O item ganha direção visual.' },
          ]}
          background="transparent"
        />
      );
    case 'box-accent-bar':
      return (
        <BoxAccentBar
          title="Razões para agir"
          subtitle="Acento lateral em cada item"
          items={[
            { icon: '✓', title: 'Direção', text: 'A mensagem fica mais orientada.' },
            { icon: '✓', title: 'Agilidade', text: 'Fica mais fácil escanear.' },
            { icon: '✓', title: 'Presença', text: 'O bloco ganha assinatura visual.' },
          ]}
          background="transparent"
        />
      );
    case 'image-caption':
      return (
        <ImageCaption
          title="Imagem com legenda"
          subtitle="Legenda ajuda a fechar a leitura"
          src={MOCK_IMAGE}
          caption="Legenda curta e funcional"
          background="transparent"
        />
      );
    case 'image-overlay':
      return (
        <ImageOverlay
          title="Texto sobre a imagem"
          subtitle="Overlay escuro protege a leitura"
          src={MOCK_IMAGE}
          caption="Overlay"
        />
      );
    case 'image-side-content':
      return (
        <ImageSideContent
          title="Imagem ao lado"
          subtitle="Boa para argumento + suporte visual"
          src={MOCK_IMAGE}
          items={[
            { icon: '✓', title: 'Mais contexto' },
            { icon: '✓', title: 'Mais leitura' },
            { icon: '✓', title: 'Mais equilíbrio' },
          ]}
          background="transparent"
        />
      );
    case 'text-quote':
      return (
        <TextQuote
          title="Quote"
          subtitle="Bom para argumento ou depoimento"
          body="Uma boa estrutura visual ajuda a mensagem a ser percebida com mais clareza e valor."
          author="Nome da fonte"
          background="transparent"
        />
      );
    case 'text-big-statement':
      return (
        <TextBigStatement
          title="Statement"
          subtitle="Template para headline central"
          body="Design bom não faz milagre, mas muda totalmente a percepção."
          tag="Headline"
          background="rgba(255,255,255,0.04)"
        />
      );
    case 'text-stat-highlight':
      return (
        <TextStatHighlight
          title="Estatística"
          subtitle="Número grande em destaque"
          body="Números fortes pedem uma estrutura específica para sustentar a leitura."
          number="247%"
          label="Crescimento"
          background="rgba(255,255,255,0.04)"
        />
      );
    default:
      return null;
  }
};

const renderTemplateOnStage = (template: PrototypeTemplateCard) => (
  <div className="relative w-full aspect-[4/5] rounded-[36px] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.35)] border border-white/5" style={getStageStyle(template.family)}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_34%)]" />
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
    <div className="absolute left-[8%] right-[8%] top-[8%] bottom-[8%] rounded-[34px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_35px_90px_rgba(0,0,0,0.28)]" />
    <div className="absolute inset-0 px-[7%] flex justify-center" style={{ alignItems: 'flex-start' }}>
      <div style={getStageBlockStyle(template)}>
        {renderTemplate(template)}
      </div>
    </div>
  </div>
);

export function TemplateAreaLab() {
  const initialFamily = PROTOTYPE_TEMPLATE_LAB_FAMILIES[0];
  const [activeFamily, setActiveFamily] = useState<PrototypeTemplateFamily>(initialFamily);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    getPrototypeTemplateLabTemplatesByFamily(initialFamily)[0]?.id ?? '',
  );

  const templates = useMemo(
    () => getPrototypeTemplateLabTemplatesByFamily(activeFamily),
    [activeFamily],
  );

  useEffect(() => {
    setSelectedTemplateId(getPrototypeTemplateLabTemplatesByFamily(activeFamily)[0]?.id ?? '');
  }, [activeFamily]);

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5 min-h-[620px]">
      <section className="rounded-[32px] border border-white/5 bg-white/[0.03] p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-brand">
            Block Lab
          </p>
          <h3 className="text-[16px] font-black text-white leading-tight">
            Biblioteca de blocos visuais
          </h3>
          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
            Aqui você avalia só o bloco, isolado, sem slide inteiro e sem interferência de layout global.
          </p>
        </div>

        <div className="space-y-2.5">
          {PROTOTYPE_TEMPLATE_LAB_FAMILIES.map((family) => {
            const meta = FAMILY_META[family];
            const Icon = meta.icon;
            const isActive = family === activeFamily;
            return (
              <button
                key={family}
                onClick={() => setActiveFamily(family)}
                className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                  isActive
                    ? 'border-brand/35 bg-brand/10'
                    : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    isActive ? 'bg-brand text-black' : 'bg-white/5 text-zinc-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-[12px] font-black ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                      {meta.title}
                    </p>
                    <p className="text-[10px] leading-snug text-zinc-500 font-medium">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-white/5 bg-black/20 p-4 space-y-3">
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-brand">
            Modelos desta família
          </p>
          <div className="space-y-2">
            {templates.map((template) => {
              const isSelected = template.id === selectedTemplate?.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-brand/35 bg-brand/10'
                      : 'border-white/5 bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <p className={`text-[11px] font-black ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                    {template.name}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-zinc-500 font-medium">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selectedTemplate && (
        <section className="rounded-[36px] border border-white/5 bg-black/30 p-5 space-y-5 overflow-hidden">
          <div className="rounded-[30px] border border-white/5 bg-zinc-950/60 p-5 space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-brand">
              Preview do bloco
            </p>
            <h3 className="text-[18px] font-black text-white">{selectedTemplate.name}</h3>
            <p className="text-[11px] leading-relaxed text-zinc-400 font-medium max-w-[720px]">
              {selectedTemplate.description}
            </p>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
            <div className="rounded-[32px] border border-white/5 bg-zinc-950/70 p-6">
              {renderTemplateOnStage(selectedTemplate)}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 space-y-3">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-brand">
                  Compatível com
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.compatibleBlocks.map((block) => (
                    <span
                      key={`${selectedTemplate.id}-${block}`}
                      className="rounded-full bg-black/30 px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-300 border border-white/5"
                    >
                      {block}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 space-y-3">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-brand">
                  Estrutura interna
                </p>
                <div className="space-y-2">
                  {selectedTemplate.areas.map((area) => (
                    <div key={`${selectedTemplate.id}-${area.id}`} className="rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5">
                      <p className="text-[10px] font-black text-white">{area.label}</p>
                      <p className="mt-1 text-[9px] leading-snug text-zinc-500 font-medium">
                        {area.type} • {area.position.w}% x {area.position.h}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
