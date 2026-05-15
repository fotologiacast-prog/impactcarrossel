import type { SlideLayout } from '../../utils/area-layout.ts';

const makeArea = (
  id: string,
  role: 'image' | 'content' | 'accent' | 'decoration',
  bounds: SlideLayout['areas'][number]['bounds'],
  acceptsBlocks: string[],
  extra?: Partial<SlideLayout['areas'][number]>,
): SlideLayout['areas'][number] => ({
  id,
  role,
  bounds,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  direction: 'column',
  justify: 'start',
  align: 'center',
  gap: 0,
  overflow: 'hidden',
  acceptsBlocks,
  ...extra,
});

const INITIAL_LAYOUTS: SlideLayout[] = [
  {
    id: 'IMAGE_STAGE_LEFT',
    name: 'Stage esquerda',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'image-area',
        'image',
        { x: 6, y: 4.5, width: 40, height: 90 },
        ['IMAGE'],
        {
          overflow: 'visible',
        },
      ),
      makeArea(
        'content-area',
        'content',
        { x: 48, y: 8.5, width: 46, height: 83 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 16,
          minContentHeight: 360,
          padding: { top: 56, right: 4, bottom: 56, left: 20 },
          justify: 'center',
          align: 'start',
        },
      ),
    ],
  },
  {
    id: 'IMAGE_STAGE_RIGHT',
    name: 'Stage direita',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'content-area',
        'content',
        { x: 6, y: 8.5, width: 46, height: 83 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 16,
          minContentHeight: 360,
          padding: { top: 56, right: 20, bottom: 56, left: 4 },
          justify: 'center',
          align: 'start',
        },
      ),
      makeArea(
        'image-area',
        'image',
        { x: 54, y: 4.5, width: 40, height: 90 },
        ['IMAGE'],
        {
          overflow: 'visible',
        },
      ),
    ],
  },
  {
    id: 'IMAGE_STAGE_TOP',
    name: 'Stage topo',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'image-area',
        'image',
        { x: 10, y: 4.5, width: 80, height: 38 },
        ['IMAGE'],
        {
          overflow: 'visible',
        },
      ),
      makeArea(
        'content-area',
        'content',
        { x: 8, y: 44, width: 84, height: 47 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 18,
          minContentHeight: 360,
          padding: { top: 42, right: 24, bottom: 42, left: 24 },
          justify: 'center',
          align: 'center',
        },
      ),
    ],
  },
  {
    id: 'IMAGE_STAGE_BOTTOM',
    name: 'Stage base',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'content-area',
        'content',
        { x: 8, y: 8.5, width: 84, height: 46 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 18,
          minContentHeight: 360,
          padding: { top: 42, right: 24, bottom: 36, left: 24 },
          justify: 'center',
          align: 'center',
        },
      ),
      makeArea(
        'image-area',
        'image',
        { x: 10, y: 57, width: 80, height: 37 },
        ['IMAGE'],
        {
          overflow: 'visible',
        },
      ),
    ],
  },
  {
    id: 'IMAGE_STACK_BOX_TOP',
    name: 'Boxes empilhadas topo',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'image-area',
        'image',
        { x: 5, y: 8.2, width: 90, height: 40.8 },
        ['IMAGE'],
      ),
      makeArea(
        'content-area',
        'content',
        { x: 5, y: 50.45, width: 90, height: 40.8 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 14,
          minContentHeight: 320,
          padding: { top: 72, right: 72, bottom: 64, left: 72 },
          justify: 'center',
          align: 'center',
        },
      ),
    ],
  },
  {
    id: 'IMAGE_STACK_BOX_BOTTOM',
    name: 'Boxes empilhadas base',
    slideWidth: 1080,
    slideHeight: 1350,
    areas: [
      makeArea(
        'content-area',
        'content',
        { x: 5, y: 8.2, width: 90, height: 40.8 },
        ['TITLE', 'PARAGRAPH', 'LIST', 'BOX', 'BADGE', 'CTA'],
        {
          gap: 14,
          minContentHeight: 320,
          padding: { top: 72, right: 72, bottom: 64, left: 72 },
          justify: 'center',
          align: 'center',
        },
      ),
      makeArea(
        'image-area',
        'image',
        { x: 5, y: 50.45, width: 90, height: 40.8 },
        ['IMAGE'],
      ),
    ],
  },
];

class AreaLayoutRegistry {
  private layouts = new Map<string, SlideLayout>();

  constructor() {
    INITIAL_LAYOUTS.forEach((layout) => this.layouts.set(layout.id, layout));
  }

  get(id: string) {
    return this.layouts.get(id);
  }

  getAll() {
    return Array.from(this.layouts.values());
  }
}

export const areaLayoutRegistry = new AreaLayoutRegistry();
