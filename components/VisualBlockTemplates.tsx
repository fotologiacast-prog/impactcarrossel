import React from 'react';

export type TemplateItem = {
  id?: string;
  icon?: string;
  title: string;
  text?: string;
};

export interface BlockTemplateProps {
  title?: string;
  subtitle?: string;
  items: TemplateItem[];
  accent?: string;
  background?: string;
  textColor?: string;
  align?: 'left' | 'center';
  density?: 'compact' | 'medium' | 'airy';
}

export interface ImageBlockProps {
  title?: string;
  subtitle?: string;
  src: string;
  caption?: string;
  accent?: string;
  background?: string;
  textColor?: string;
  align?: 'left' | 'center';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  overlayPosition?: 'bottom' | 'center';
  imagePosition?: 'left' | 'right';
  imageWidth?: number;
  items?: TemplateItem[];
}

export interface TextBlockProps {
  title?: string;
  subtitle?: string;
  body: string;
  accent?: string;
  background?: string;
  textColor?: string;
  align?: 'left' | 'center';
  author?: string;
  tag?: string;
  number?: string;
  label?: string;
}

const getGap = (density: BlockTemplateProps['density']) =>
  density === 'compact' ? 8 : density === 'airy' ? 18 : 12;

const getTitleStyle = (align: BlockTemplateProps['align']): React.CSSProperties => ({
  margin: 0,
  fontSize: 46,
  lineHeight: 0.92,
  fontWeight: 900,
  letterSpacing: -1.6,
  textAlign: align,
  textTransform: 'uppercase',
});

const getSubtitleStyle = (align: BlockTemplateProps['align']): React.CSSProperties => ({
  margin: 0,
  maxWidth: '84%',
  fontSize: 15,
  lineHeight: 1.35,
  opacity: 0.66,
  textAlign: align,
});

const getShellStyle = (
  background: string,
  textColor: string,
  extra?: React.CSSProperties,
): React.CSSProperties => ({
  width: '100%',
  background,
  color: textColor,
  display: 'flex',
  flexDirection: 'column',
  ...extra,
});

export function ListNumberedRows({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = getGap(density);
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 6 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'grid',
              gridTemplateColumns: '84px minmax(0,1fr)',
              alignItems: 'start',
              gap: 16,
              padding: '18px 0 22px',
              borderTop: `1px solid ${index === 0 ? `${accent}55` : `${textColor}12`}`,
            }}
          >
            <span
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: index === 0 ? accent : `${textColor}40`,
                minWidth: 32,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: -2,
                lineHeight: 0.86,
                marginTop: -2,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.02, letterSpacing: -0.6 }}>{item.title}</div>
              {item.text ? <div style={{ fontSize: 14, lineHeight: 1.42, opacity: 0.62, maxWidth: '90%' }}>{item.text}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPillTags({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = getGap(density);
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 8 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'flex-start', marginTop: 6 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: index % 2 === 0 ? '14px 20px 15px 18px' : '12px 24px 13px 18px',
              borderRadius: 999,
              background: index === 0 ? `${accent}22` : `${textColor}08`,
              border: `1px solid ${index === 0 ? `${accent}55` : `${textColor}16`}`,
              boxShadow: index === 0 ? `inset 0 0 0 1px ${accent}15` : 'none',
            }}
          >
            {item.icon ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            ) : (
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: index === 0 ? accent : `${textColor}66`,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: index === 0 ? 18 : 16,
                fontWeight: 800,
                lineHeight: 1.05,
                whiteSpace: 'nowrap',
                letterSpacing: -0.3,
              }}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListStackedCards({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = density === 'compact' ? 8 : density === 'airy' ? 16 : 10;
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 6 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap + 2, marginTop: 10 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: index === 0 ? '22px 24px 24px' : '18px 22px 20px',
              borderRadius: index === 0 ? 28 : 18,
              background: index === 0 ? `${accent}18` : `${textColor}06`,
              border: `1px solid ${index === 0 ? `${accent}44` : `${textColor}12`}`,
              transform: index === 1 ? 'translateX(18px)' : index === 2 ? 'translateX(34px)' : 'none',
            }}
          >
            <div
              style={{
                width: index === 0 ? 54 : 46,
                height: index === 0 ? 54 : 46,
                borderRadius: index === 0 ? 18 : 14,
                background: index === 0 ? accent : `${accent}16`,
                color: index === 0 ? '#081018' : textColor,
                display: 'grid',
                placeItems: 'center',
                fontSize: index === 0 ? 24 : 20,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {item.icon || '→'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 2 }}>
              <div style={{ fontSize: index === 0 ? 24 : 19, fontWeight: 800, lineHeight: 1.04, letterSpacing: -0.5 }}>{item.title}</div>
              {item.text ? <div style={{ fontSize: 14, lineHeight: 1.42, opacity: 0.62, maxWidth: '92%' }}>{item.text}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoxGridCards({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = getGap(density);
  const columns = items.length <= 2 ? items.length : items.length === 3 ? 3 : 2;
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 8 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap, marginTop: 10 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: index === 0 ? 'flex-start' : 'center',
              textAlign: index === 0 ? 'left' : 'center',
              justifyContent: 'space-between',
              gap: 18,
              padding: index === 0 ? '28px 22px 24px' : '22px 18px 20px',
              minHeight: index === 0 && columns > 1 ? 200 : 164,
              borderRadius: index === 0 ? 28 : 16,
              background: index === 0 ? `${accent}18` : `${textColor}05`,
              border: `1px solid ${index === 0 ? `${accent}42` : `${textColor}12`}`,
              gridColumn: index === 0 && items.length >= 3 && columns === 2 ? 'span 2' : 'auto',
            }}
          >
            <div
              style={{
                width: index === 0 ? 60 : 48,
                height: index === 0 ? 60 : 48,
                borderRadius: index === 0 ? 20 : 14,
                background: index === 0 ? accent : `${accent}16`,
                color: index === 0 ? '#081018' : textColor,
                display: 'grid',
                placeItems: 'center',
                fontSize: index === 0 ? 28 : 22,
                fontWeight: 800,
              }}
            >
              {item.icon || '✦'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontSize: index === 0 ? 22 : 16, fontWeight: 800, lineHeight: 1.05, letterSpacing: -0.4 }}>{item.title}</div>
              {item.text ? <div style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.62 }}>{item.text}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoxFeatureRows({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = density === 'compact' ? 10 : density === 'airy' ? 22 : 16;
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 6 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap + 2, marginTop: 8 }}>
        {items.map((item, index) => (
          <div key={item.id || index} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr)', alignItems: 'start', gap: 18 }}>
            <div
              style={{
                width: 72,
                minHeight: 78,
                borderRadius: 22,
                background: index === 0 ? accent : `${accent}14`,
                color: index === 0 ? '#081018' : textColor,
                border: `1px solid ${index === 0 ? `${accent}66` : `${accent}22`}`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 28,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {item.icon || '◆'}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingTop: 8,
                paddingBottom: 18,
                borderBottom: `1px solid ${index === items.length - 1 ? 'transparent' : `${textColor}12`}`,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.02, letterSpacing: -0.5 }}>{item.title}</div>
              {item.text ? <div style={{ fontSize: 14, lineHeight: 1.42, opacity: 0.58, maxWidth: '88%' }}>{item.text}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoxAccentBar({
  title,
  subtitle,
  items,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  density = 'medium',
}: BlockTemplateProps) {
  const gap = getGap(density);
  return (
    <div style={getShellStyle(background, textColor, { gap: gap + 6 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap + 2, marginTop: 8 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              display: 'grid',
              gridTemplateColumns: '10px minmax(0,1fr)',
              alignItems: 'stretch',
              gap: 16,
              padding: index === 0 ? '18px 0 22px' : '14px 0 18px',
              borderBottom: `1px solid ${index === items.length - 1 ? 'transparent' : `${textColor}10`}`,
            }}
          >
            <div
              style={{
                width: 10,
                borderRadius: 999,
                background: index === 0 ? accent : `${accent}55`,
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.icon ? <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span> : null}
                <span style={{ fontSize: index === 0 ? 26 : 19, fontWeight: 800, lineHeight: 1.03, letterSpacing: -0.5 }}>{item.title}</span>
              </div>
              {item.text ? <div style={{ fontSize: 14, lineHeight: 1.42, opacity: 0.58, maxWidth: '86%' }}>{item.text}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImageCaption({
  title,
  subtitle,
  src,
  caption,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  aspectRatio = 'landscape',
}: ImageBlockProps) {
  const ratioMap = { square: '1 / 1', landscape: '16 / 10', portrait: '3 / 4' };
  return (
    <div style={{ width: '100%', borderRadius: 28, background, color: textColor, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {title ? <h3 style={{ margin: 0, fontSize: 40, lineHeight: 0.95, fontWeight: 800, textAlign: align }}>{title}</h3> : null}
      {subtitle ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.35, opacity: 0.7, textAlign: align }}>{subtitle}</p> : null}
      <div style={{ width: '100%', aspectRatio: ratioMap[aspectRatio], borderRadius: 20, overflow: 'hidden', border: `1px solid ${textColor}12`, background: '#202028' }}>
        <img src={src} alt={caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      {caption ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: 0.6, textAlign: align }}><div style={{ width: 20, height: 2, background: accent, borderRadius: 1, flexShrink: 0 }} />{caption}</div> : null}
    </div>
  );
}

export function ImageOverlay({
  title,
  subtitle,
  src,
  caption,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  overlayPosition = 'bottom',
}: ImageBlockProps) {
  return (
    <div style={{ width: '100%', borderRadius: 28, background, color: textColor, padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 28, overflow: 'hidden', position: 'relative', background: '#202028' }}>
        <img src={src} alt={title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: overlayPosition === 'bottom' ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' : 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: overlayPosition === 'bottom' ? 'flex-end' : 'center', padding: 28, gap: 8 }}>
          {title ? <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: '#ffffff', textAlign: align }}>{title}</h3> : null}
          {subtitle ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.35, color: 'rgba(255,255,255,0.8)', textAlign: align }}>{subtitle}</p> : null}
          {caption ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '5px 14px', borderRadius: 100, background: `${accent}cc`, color: '#000', fontSize: 12, fontWeight: 700, alignSelf: align === 'center' ? 'center' : 'flex-start' }}>{caption}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function ImageSideContent({
  title,
  subtitle,
  src,
  items = [],
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  imagePosition = 'left',
  imageWidth = 40,
}: ImageBlockProps) {
  const contentWidth = 100 - imageWidth;
  const imageBlock = (
    <div style={{ width: `${imageWidth}%`, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: '#202028' }}>
      <img src={src} alt={title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 200 }} />
    </div>
  );
  const contentBlock = (
    <div style={{ width: `${contentWidth}%`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '8px 4px' }}>
      {title ? <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: textColor }}>{title}</h3> : null}
      {subtitle ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, opacity: 0.65, color: textColor }}>{subtitle}</p> : null}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {items.map((item, index) => (
            <div key={item.id || index} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: textColor }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: `${accent}22`, display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{item.icon || '✓'}</div>
              <span style={{ fontWeight: 600, lineHeight: 1.2 }}>{item.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
  return (
    <div style={{ width: '100%', borderRadius: 28, background, color: textColor, padding: 20, display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'stretch' }}>
      {imagePosition === 'left' ? <>{imageBlock}{contentBlock}</> : <>{contentBlock}{imageBlock}</>}
    </div>
  );
}

export function TextQuote({
  title,
  subtitle,
  body,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'left',
  author,
}: TextBlockProps) {
  return (
    <div style={getShellStyle(background, textColor, { gap: 18 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      {subtitle ? <p style={getSubtitleStyle(align)}>{subtitle}</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', gap: 18, marginTop: 8 }}>
        <span style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.7, color: accent, opacity: 0.9, flexShrink: 0, marginTop: -6 }}>"</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 18, borderTop: `1px solid ${accent}55` }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, fontWeight: 500, fontStyle: 'italic' }}>{body}</p>
          {author ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, opacity: 0.6, letterSpacing: 0.8, textTransform: 'uppercase' }}><div style={{ width: 22, height: 2, background: accent, borderRadius: 1 }} />{author}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function TextBigStatement({
  title,
  subtitle,
  body,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'center',
  tag,
}: TextBlockProps) {
  const len = body.length;
  let fontSize = 44;
  if (len < 40) fontSize = 52;
  if (len < 20) fontSize = 64;
  if (len > 80) fontSize = 36;
  if (len > 140) fontSize = 28;
  return (
    <div style={getShellStyle(background, textColor, { alignItems: align === 'center' ? 'center' : 'flex-start', justifyContent: 'center', gap: 18, minHeight: 420 })}>
      {tag ? <div style={{ display: 'inline-flex', padding: '6px 14px 7px', borderRadius: 999, background: `${accent}18`, color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>{tag}</div> : null}
      {title ? <h3 style={{ margin: 0, fontSize: 14, lineHeight: 1.2, fontWeight: 700, textAlign: align, opacity: 0.48, textTransform: 'uppercase', letterSpacing: 2.4 }}>{title}</h3> : null}
      <p style={{ margin: 0, fontSize: fontSize + 12, lineHeight: 0.96, fontWeight: 900, textAlign: align, letterSpacing: -2.2, maxWidth: '92%' }}>{body}</p>
      {subtitle ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.42, opacity: 0.56, textAlign: align, maxWidth: align === 'center' ? '74%' : '62%' }}>{subtitle}</p> : null}
      <div style={{ width: align === 'center' ? 120 : 92, height: 6, borderRadius: 999, background: accent, marginTop: 2, alignSelf: align === 'center' ? 'center' : 'flex-start' }} />
    </div>
  );
}

export function TextStatHighlight({
  title,
  subtitle,
  body,
  accent = '#1fb2f7',
  background = 'transparent',
  textColor = '#ffffff',
  align = 'center',
  number = '247%',
  label,
}: TextBlockProps) {
  return (
    <div style={getShellStyle(background, textColor, { alignItems: align === 'center' ? 'center' : 'flex-start', gap: 18 })}>
      {title ? <h3 style={getTitleStyle(align)}>{title}</h3> : null}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 4, width: '100%', marginTop: 6 }}>
        {label ? <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.6, opacity: 0.5 }}>{label}</div> : null}
        <div style={{ fontSize: 144, fontWeight: 900, lineHeight: 0.88, color: accent, letterSpacing: -6, fontVariantNumeric: 'tabular-nums' }}>{number}</div>
        <div style={{ width: align === 'center' ? 160 : 120, height: 2, background: `${textColor}20`, marginTop: 8 }} />
        {subtitle ? <div style={{ fontSize: 15, lineHeight: 1.34, opacity: 0.6, textAlign: align, maxWidth: '68%', marginTop: 10 }}>{subtitle}</div> : null}
      </div>
      {body ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.48, opacity: 0.58, textAlign: align, maxWidth: align === 'center' ? '72%' : '58%' }}>{body}</p> : null}
    </div>
  );
}
