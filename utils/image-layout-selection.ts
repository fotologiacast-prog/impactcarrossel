import {
  getDefaultImageLayoutIdForFamily,
  getImageLayoutIdForFamilyDirection,
  type ImageLayoutDirection,
  type ImageLayoutFamilyId,
} from '../domain/templates/ImageLayoutRegistry.ts';

type ImageLayoutFamilySelectionInput = {
  familyId: ImageLayoutFamilyId;
  directionOptions: ImageLayoutDirection[];
  defaultLayoutId: string;
};

export const resolveImageLayoutIdForFamilySelection = (
  family: ImageLayoutFamilySelectionInput,
  requestedDirection?: ImageLayoutDirection,
  currentDirection?: ImageLayoutDirection,
) => {
  const fallbackDirection = family.directionOptions.includes((currentDirection || 'center') as ImageLayoutDirection)
    ? currentDirection
    : family.directionOptions.find((direction) => direction !== 'center') || 'center';

  const resolvedDirection = requestedDirection || fallbackDirection || 'center';

  if (family.directionOptions.length <= 1) {
    return getDefaultImageLayoutIdForFamily(family.familyId) || family.defaultLayoutId;
  }

  return getImageLayoutIdForFamilyDirection(family.familyId, resolvedDirection as ImageLayoutDirection) || family.defaultLayoutId;
};
