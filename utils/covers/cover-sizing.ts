export function getCoverMainTitleSize(text = ''): number {
  const len = text.trim().length;

  if (len <= 8) return 178;
  if (len <= 12) return 166;
  if (len <= 16) return 154;
  if (len <= 22) return 140;
  if (len <= 28) return 126;
  return 114;
}
