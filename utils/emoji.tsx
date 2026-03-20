import React from 'react';
import emojiRegex from 'emoji-regex/RGI_Emoji';

const FLUENT_EMOJI_BASE_URL = 'https://uwx.github.io/fluentui-twemoji-3d/export/3D_png/72x72';
const regex = emojiRegex();

const toEmojiCodepoint = (value: string) =>
  Array.from(value)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .filter((codepoint) => codepoint !== 'fe0f')
    .join('-');

const createEmojiUrl = (value: string) => `${FLUENT_EMOJI_BASE_URL}/${toEmojiCodepoint(value)}.png`;

const EmojiGlyph = ({
  emoji,
  size,
  imgKey,
}: {
  emoji: string;
  size: string;
  imgKey: string;
}) => {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span
        key={`${imgKey}-fallback`}
        className="inline-block select-none align-[-0.08em]"
        style={{
          fontSize: size,
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      key={imgKey}
      src={createEmojiUrl(emoji)}
      alt={emoji}
      draggable={false}
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      className="inline-block select-none align-[-0.16em]"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
      }}
    />
  );
};

export const renderEmojiText = (
  value: string,
  keyPrefix: string,
  size: string = '1.1em',
): React.ReactNode[] => {
  if (!value) return [value];

  regex.lastIndex = 0;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }

    const emoji = match[0];
    nodes.push(
      <EmojiGlyph
        key={`${keyPrefix}-emoji-${matchIndex}`}
        imgKey={`${keyPrefix}-emoji-${matchIndex}`}
        emoji={emoji}
        size={size}
      />,
    );

    lastIndex = match.index + emoji.length;
    matchIndex += 1;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [value];
};

export const renderEmojiNodes = (
  nodes: Array<string | React.ReactNode>,
  keyPrefix: string,
  size: string = '1.1em',
): React.ReactNode[] =>
  nodes.flatMap((node, index) => {
    if (typeof node !== 'string') return [node];
    return renderEmojiText(node, `${keyPrefix}-${index}`, size);
  });
