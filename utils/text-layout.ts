export const applyWidowProtection = (value: string): string =>
  value
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) return line;

      return trimmed.replace(/\s+(\S+)$/, '\u00A0$1');
    })
    .join('\n');

export const resolveLineBreakMode = (value?: string | null): 'auto' | 'manual' =>
  value === 'manual' ? 'manual' : 'auto';

export const formatTextForRender = (value: string, mode?: string | null): string =>
  resolveLineBreakMode(mode) === 'manual' ? value : applyWidowProtection(value);
