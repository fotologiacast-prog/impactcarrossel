const hexToRgba = (value: string | undefined, alpha: number) => {
  if (!value || !value.startsWith('#')) {
    return `rgba(245, 243, 238, ${alpha})`;
  }

  const raw = value.replace('#', '');
  const normalized = raw.length === 3
    ? raw.split('').map((char) => `${char}${char}`).join('')
    : raw;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getProfileFocusVisualStyles = ({
  white,
  strength,
  blur,
}: {
  white?: string;
  strength: number;
  blur: number;
}) => ({
  shell: {
    background: hexToRgba(white, Math.min(0.2, 0.1 + strength * 0.12)),
    border: '1px solid rgba(255,255,255,0.24)',
    backdropFilter: `blur(${14 + blur * 0.7}px) saturate(142%)`,
    WebkitBackdropFilter: `blur(${14 + blur * 0.7}px) saturate(142%)`,
  },
  shadow: {
    background: 'transparent',
    boxShadow: `0 ${Math.round(24 + blur * 0.7)}px ${Math.round(72 + blur * 1.5)}px rgba(0,0,0,0.34), 0 ${Math.round(12 + blur * 0.35)}px ${Math.round(30 + blur * 0.7)}px rgba(0,0,0,0.22)`,
    opacity: 0.34,
    transform: 'translateY(24px) scale(0.94)',
  },
});
