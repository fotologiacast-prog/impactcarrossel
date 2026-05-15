export interface CompactLayoutContext {
  isCompact: boolean;
  availableWidth?: number;
  availableHeight?: number;
  sourceLayoutId?: string;
}

export interface BlockRenderLayoutContext {
  defaultWidthPercent?: number;
  defaultTextAlign?: 'left' | 'center' | 'right';
  compactLayout?: CompactLayoutContext;
  resolvedBoxFontSizeByIndex?: Record<number, number>;
}
