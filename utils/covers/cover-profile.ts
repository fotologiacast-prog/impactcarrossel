import type { CoverProfileBadge } from '../../types.ts';

type CoverProfileSource = {
  name?: string | null;
  instagram?: string | null;
  profilePicture?: string | null;
  crm?: string | null;
  rqe?: string | null;
};

const toNonEmpty = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const formatHandle = (instagram?: string | null) => {
  const normalized = toNonEmpty(instagram)?.replace(/^@+/, '');
  return normalized ? `@${normalized}` : undefined;
};

const formatMeta = (crm?: string | null, rqe?: string | null) => {
  const crmValue = toNonEmpty(crm);
  const rqeValue = toNonEmpty(rqe);

  if (crmValue && rqeValue) return `CRM ${crmValue} | RQE ${rqeValue}`;
  if (crmValue) return `CRM ${crmValue}`;
  if (rqeValue) return `RQE ${rqeValue}`;
  return undefined;
};

export function buildCoverProfileBadge(source: CoverProfileSource): CoverProfileBadge {
  return {
    displayName: toNonEmpty(source.name),
    handle: formatHandle(source.instagram),
    avatar: toNonEmpty(source.profilePicture),
    meta: formatMeta(source.crm, source.rqe),
  };
}
