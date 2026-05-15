export const MAX_RECENT_ICON_IDS = 10;

export const normalizeRecentIconIds = (iconIds: string[], max = MAX_RECENT_ICON_IDS) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  iconIds.forEach((iconId) => {
    const trimmed = iconId.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    normalized.push(trimmed);
  });

  return normalized.slice(0, max);
};

export const pushRecentIconId = (currentIconIds: string[], iconId: string, max = MAX_RECENT_ICON_IDS) => {
  const trimmed = iconId.trim();
  if (!trimmed) return normalizeRecentIconIds(currentIconIds, max);
  return normalizeRecentIconIds([trimmed, ...currentIconIds], max);
};
