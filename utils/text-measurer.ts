export type MeasureTypography = {
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: number;
};

type CustomMeasureWidth = (input: {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: number;
}) => number;

export class TextMeasurer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cache = new Map<string, number>();

  constructor(private customMeasureWidth?: CustomMeasureWidth) {
    if (!customMeasureWidth && typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  measureWidth(text: string, typography: MeasureTypography): number {
    const { fontSize, fontFamily, fontWeight = 400, letterSpacing = 0 } = typography;
    const key = `${text}|${fontSize}|${fontFamily}|${fontWeight}|${letterSpacing}`;

    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    let width = 0;

    if (this.customMeasureWidth) {
      width = this.customMeasureWidth({ text, fontSize, fontFamily, fontWeight, letterSpacing });
    } else if (this.ctx) {
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      width = this.ctx.measureText(text).width;
      if (letterSpacing && text.length > 1) {
        width += (text.length - 1) * letterSpacing;
      }
    } else {
      const glyphWidth = text.replace(/\s/g, '').length * fontSize * 0.56;
      const spaceWidth = (text.match(/\s/g) || []).length * fontSize * 0.28;
      const spacingWidth = text.length > 1 ? (text.length - 1) * letterSpacing : 0;
      width = glyphWidth + spaceWidth + spacingWidth;
    }

    this.cache.set(key, width);
    return width;
  }

  measureLines(text: string, maxWidth: number, typography: MeasureTypography): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];

    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (this.measureWidth(candidate, typography) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  measureHeight(lines: string[], fontSize: number, lineHeight: number): number {
    if (lines.length === 0) return 0;
    return Math.round(lines.length * fontSize * lineHeight);
  }

  clearCache() {
    this.cache.clear();
  }
}

export const textMeasurer = new TextMeasurer();
