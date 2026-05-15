import * as Icons from 'lucide-react';

export type LucideLibraryIcon = {
  id: string;
  label: string;
  searchText: string;
};

const formatLucideLabel = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();

const buildLucideLibrary = (): LucideLibraryIcon[] => {
  const rawEntries = Object.entries(Icons)
    .filter(([key, value]) => {
      if (key.endsWith('Icon')) return false;
      return Boolean(value && typeof value === 'object' && typeof (value as { displayName?: string }).displayName === 'string');
    })
    .map(([key, value]) => ({
      exportName: key,
      displayName: (value as { displayName: string }).displayName,
    }));

  const groupedByDisplayName = new Map<string, string[]>();

  rawEntries.forEach(({ exportName, displayName }) => {
    const bucket = groupedByDisplayName.get(displayName) || [];
    bucket.push(exportName);
    groupedByDisplayName.set(displayName, bucket);
  });

  return [...groupedByDisplayName.entries()]
    .map(([displayName, exportNames]) => {
      const preferredId = exportNames.includes(displayName)
        ? displayName
        : [...exportNames].sort((left, right) => left.length - right.length || left.localeCompare(right))[0];

      const label = formatLucideLabel(preferredId);
      return {
        id: preferredId,
        label,
        searchText: `${preferredId} ${displayName} ${label}`.toLowerCase(),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
};

const ALL_LUCIDE_ICONS = buildLucideLibrary();

export const getAllLucideIcons = () => ALL_LUCIDE_ICONS;

export const searchLucideIcons = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return ALL_LUCIDE_ICONS;
  return ALL_LUCIDE_ICONS.filter((icon) => icon.searchText.includes(normalized));
};
