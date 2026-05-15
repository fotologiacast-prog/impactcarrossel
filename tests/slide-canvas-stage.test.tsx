import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlideCanvas } from '../renderers/SlideCanvas.tsx';

const renderStageMarkup = (
  imageLayout: 'IMAGE_STAGE_LEFT' | 'IMAGE_STAGE_RIGHT' | 'IMAGE_STAGE_TOP' | 'IMAGE_STAGE_BOTTOM',
  format: 'png' | 'jpg' = 'png',
) => renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout,
      image: {
        type: 'IMAGE_BOX',
        url: format === 'png' ? 'https://example.com/cutout.png' : 'https://example.com/photo.jpg',
        format,
        isCutout: format === 'png',
        position:
          imageLayout === 'IMAGE_STAGE_LEFT' ? 'left'
          : imageLayout === 'IMAGE_STAGE_TOP' ? 'top'
          : imageLayout === 'IMAGE_STAGE_BOTTOM' ? 'bottom'
          : 'right',
      },
      blocks: [
        { type: 'TITLE', content: 'Nem toda dor na bexiga vem da bexiga.' },
        { type: 'PARAGRAPH', content: 'O texto precisa respeitar a área livre e não invadir a área do PNG.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const renderBoxMarkup = (format: 'png' | 'jpg' = 'png') => renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_BOX_RIGHT',
      image: {
        type: 'IMAGE_BOX',
        url: format === 'png' ? 'https://example.com/cutout.png' : 'https://example.com/photo.jpg',
        format,
        isCutout: format === 'png',
        position: 'right',
      },
      blocks: [
        { type: 'TITLE', content: 'Texto editorial' },
        { type: 'PARAGRAPH', content: 'O PNG precisa poder atravessar a área visual quando for necessário.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const stageRightMarkup = renderStageMarkup('IMAGE_STAGE_RIGHT');
const stageLeftMarkup = renderStageMarkup('IMAGE_STAGE_LEFT');
const stageTopMarkup = renderStageMarkup('IMAGE_STAGE_TOP');
const stageBottomMarkup = renderStageMarkup('IMAGE_STAGE_BOTTOM');
const stageRightJpgMarkup = renderStageMarkup('IMAGE_STAGE_RIGHT', 'jpg');
const stageRightOptimizedPhotoMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_STAGE_RIGHT',
      image: {
        type: 'IMAGE_BOX',
        url: 'data:image/webp;base64,optimized-png-keeps-alpha',
        format: 'png',
        position: 'right',
      },
      blocks: [
        { type: 'TITLE', content: 'Foto otimizada não pode vazar.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);
const stageRightOptimizedCutoutMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_STAGE_RIGHT',
      image: {
        type: 'IMAGE_BOX',
        url: 'data:image/webp;base64,optimized-png-keeps-alpha',
        format: 'png',
        isCutout: true,
        position: 'right',
      },
      blocks: [
        { type: 'TITLE', content: 'Cutout explícito continua livre.' },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);
const boxPngMarkup = renderBoxMarkup('png');
const boxJpgMarkup = renderBoxMarkup('jpg');
const stageListMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'CHECKLIST',
      contentTemplate: 'CHECKLIST',
      imageLayout: 'IMAGE_STAGE_LEFT',
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Os pilares fatais' },
        {
          type: 'LIST',
          content: ['segurança', 'tecnologia', 'tempo'],
          options: {
            variant: 'box',
            itemIcons: ['Shield', 'Laptop', 'Clock3'],
          },
        },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);

const stageBoxGridMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_STAGE_LEFT',
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Azul & Branco Escultural' },
        { type: 'PARAGRAPH', content: 'Elegância que impressiona' },
        { type: 'BOX', content: 'Composição simétrica', options: { icon: 'BarChart3' } },
        { type: 'BOX', content: 'Flores em abundância', options: { icon: 'Brain' } },
        { type: 'BOX', content: 'Tons frios sofisticados', options: { icon: 'CircleDot' } },
        { type: 'BOX', content: 'Cenário arquitetônico', options: { icon: 'CircleDot' } },
      ],
    } as any,
    index: 0,
    canvasRef: { current: null },
  }),
);
const stageDebugMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'BOX_GRID',
      contentTemplate: 'BOX_GRID',
      imageLayout: 'IMAGE_STAGE_LEFT',
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'left',
      },
      blocks: [
        { type: 'TITLE', content: 'Debug title', options: { fontSize: 84 } },
        { type: 'BOX', content: 'Debug box', options: { fontSize: 28, icon: 'CircleDot', variant: 'default' } },
      ],
    } as any,
    index: 1,
    canvasRef: { current: null },
    debugMode: true,
  }),
);
const stageRightCenteredMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_STAGE_RIGHT',
      options: {
        contentHorizontalAlign: 'center',
      },
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/photo.jpg',
        format: 'jpg',
        position: 'right',
      },
      blocks: [
        { type: 'TITLE', content: 'Central precisa ficar central' },
        { type: 'PARAGRAPH', content: 'O texto interno também precisa obedecer.' },
      ],
    } as any,
    index: 2,
    canvasRef: { current: null },
  }),
);
const stageRightRotatedMarkup = renderToStaticMarkup(
  React.createElement(SlideCanvas, {
    slide: {
      template: 'HERO',
      contentTemplate: 'HERO',
      imageLayout: 'IMAGE_STAGE_RIGHT',
      image: {
        type: 'IMAGE_BOX',
        url: 'https://example.com/cutout.png',
        format: 'png',
        isCutout: true,
        position: 'right',
        imageRotation: 38,
      },
      blocks: [
        { type: 'TITLE', content: 'Rotacionar PNG não deve reduzir fonte' },
        { type: 'PARAGRAPH', content: 'A tipografia do Stage já foi resolvida pela área de texto.' },
      ],
    } as any,
    index: 3,
    canvasRef: { current: null },
  }),
);

assert.match(stageRightMarkup, /data-stage-layout="right"/);
assert.match(stageLeftMarkup, /data-stage-layout="left"/);
assert.match(stageTopMarkup, /data-stage-layout="top"/);
assert.match(stageRightMarkup, /data-stage-image-area="true"/);
assert.match(stageRightMarkup, /data-stage-content-area="true"/);
assert.match(stageRightMarkup, /data-area-id="content-area"/);
assert.match(stageRightMarkup, /data-area-justify="center"/);
assert.match(stageRightMarkup, /data-area-align="start"/);
assert.match(stageTopMarkup, /data-area-align="center"/);
assert.match(stageBottomMarkup, /data-area-align="center"/);
assert.match(stageRightMarkup, /data-stage-image-fit="contain"/);
assert.match(stageRightMarkup, /data-image-fit="contain"/);
assert.match(stageRightMarkup, /data-image-frame-transparent="true"/);
assert.match(stageRightJpgMarkup, /data-image-frame-transparent="true"/);
assert.match(stageRightMarkup, /data-image-frame-rounded="false"/);
assert.match(stageRightJpgMarkup, /data-image-frame-rounded="true"/);
assert.match(stageRightMarkup, /data-image-rendering="cutout-free"/);
assert.doesNotMatch(stageRightMarkup, /data-stage-image-fit="contain"[^>]*bg-zinc-800/);
assert.doesNotMatch(stageRightJpgMarkup, /data-stage-image-fit="contain"[^>]*bg-zinc-800/);
assert.doesNotMatch(stageRightMarkup, /class="[^"]*rounded-\[86px\][^"]*"[^>]*data-image-cutout="true"/);
assert.match(stageRightMarkup, /data-image-cutout="true"/);
assert.match(stageRightMarkup, /data-image-overflow="visible"/);
assert.match(stageRightJpgMarkup, /data-image-cutout="false"/);
assert.match(stageRightJpgMarkup, /data-image-overflow="hidden"/);
assert.match(stageRightJpgMarkup, /!rounded-\[86px\]/);
assert.match(stageRightOptimizedPhotoMarkup, /data-image-cutout="false"/);
assert.match(stageRightOptimizedPhotoMarkup, /data-image-overflow="hidden"/);
assert.match(stageRightOptimizedCutoutMarkup, /data-image-cutout="true"/);
assert.match(stageRightOptimizedCutoutMarkup, /data-image-overflow="visible"/);
assert.match(stageRightOptimizedCutoutMarkup, /data-image-fit="contain"/);
assert.match(boxPngMarkup, /data-image-cutout="true"/);
assert.match(boxPngMarkup, /data-image-overflow="visible"/);
assert.match(boxPngMarkup, /data-image-fit="contain"/);
assert.match(boxPngMarkup, /data-image-frame-transparent="true"/);
assert.match(boxPngMarkup, /data-image-frame-rounded="false"/);
assert.match(boxPngMarkup, /data-image-rendering="cutout-free"/);
assert.doesNotMatch(boxPngMarkup, /class="[^"]*rounded-\[86px\][^"]*"[^>]*data-image-cutout="true"/);
assert.doesNotMatch(boxPngMarkup, /class="[^"]*bg-zinc-800[^"]*"[^>]*data-image-cutout="true"/);
assert.doesNotMatch(boxPngMarkup, /object-contain/);
assert.match(boxJpgMarkup, /data-image-overflow="hidden"/);
assert.match(boxJpgMarkup, /rounded-\[86px\]/);
assert.match(stageListMarkup, /data-list-compact="true"/);
assert.match(stageBoxGridMarkup, /grid grid-cols-2/);
assert.equal((stageBoxGridMarkup.match(/data-box-compact="true"/g) || []).length, 4);
assert.equal((stageBoxGridMarkup.match(/data-box-micro-card="true"/g) || []).length, 4);
assert.doesNotMatch(stageBoxGridMarkup, /width:min\(100%, 940px\)/);
assert.match(stageBoxGridMarkup, /Composição\nsimétrica/);
assert.match(stageBoxGridMarkup, /Flores em\nabundância/);
assert.match(stageBoxGridMarkup, /Tons frios\nsofisticados/);
assert.match(stageBoxGridMarkup, /Cenário\narquitetônico/);
assert.match(stageDebugMarkup, /Canvas Debug/);
assert.match(stageDebugMarkup, /imageLayout<\/span>: IMAGE_STAGE_LEFT/);
assert.match(stageDebugMarkup, /#0 TITLE saved@84/);
assert.match(stageDebugMarkup, /#1 BOX \(default\) saved@28/);
assert.match(stageDebugMarkup, /image-area/);
assert.match(stageDebugMarkup, /content-area/);
assert.match(stageRightCenteredMarkup, /data-stage-text-align="center"/);
assert.match(stageRightCenteredMarkup, /data-area-align="center"/);
assert.match(stageRightCenteredMarkup, /text-align:center/);
assert.match(stageRightRotatedMarkup, /rotate\(38deg\)/);
assert.match(stageRightRotatedMarkup, /data-text-fit-disabled="true"/);

console.log('slide-canvas-stage.test.tsx passed');
