export interface AreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AreaPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type AreaRole = 'image' | 'content' | 'accent' | 'decoration';
export type ContentDirection = 'column' | 'row';
export type ContentJustify = 'start' | 'center' | 'end' | 'between';
export type ContentAlign = 'start' | 'center' | 'end' | 'stretch';

export interface SlideArea {
  id: string;
  role: AreaRole;
  bounds: AreaBounds;
  padding: AreaPadding;
  direction: ContentDirection;
  justify: ContentJustify;
  align: ContentAlign;
  gap: number;
  overflow: 'hidden' | 'visible';
  minContentHeight?: number;
  maxBlocks?: number;
  acceptsBlocks: string[];
}

export interface SlideLayout {
  id: string;
  name: string;
  areas: SlideArea[];
  slideWidth: number;
  slideHeight: number;
}

export interface SlideComposition {
  layout: SlideLayout;
  areaContents: Record<string, { type: string; data: any; variant?: string }[]>;
}

export interface AreaFramePx {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const resolveAreaFramePx = (
  area: SlideArea,
  slideWidth: number,
  slideHeight: number,
): AreaFramePx => ({
  left: Math.round((area.bounds.x / 100) * slideWidth),
  top: Math.round((area.bounds.y / 100) * slideHeight),
  width: Math.round((area.bounds.width / 100) * slideWidth),
  height: Math.round((area.bounds.height / 100) * slideHeight),
});

export const resolveAreaInnerFramePx = (
  area: SlideArea,
  slideWidth: number,
  slideHeight: number,
): AreaFramePx => {
  const outer = resolveAreaFramePx(area, slideWidth, slideHeight);

  return {
    left: outer.left + area.padding.left,
    top: outer.top + area.padding.top,
    width: Math.max(0, outer.width - area.padding.left - area.padding.right),
    height: Math.max(0, outer.height - area.padding.top - area.padding.bottom),
  };
};

export const findSlideArea = (layout: SlideLayout, areaId: string) =>
  layout.areas.find((area) => area.id === areaId);
