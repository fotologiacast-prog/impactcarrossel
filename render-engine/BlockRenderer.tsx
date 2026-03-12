
import React from 'react'
import { Block } from '../types'
import { TOKENS } from '../design-tokens/tokens'

/**
 * HighlightedText
 * Apenas aplica destaque visual.
 */
const HighlightedText: React.FC<{
  text: string
  highlight?: string
  className: string
}> = ({ text, highlight, className }) => {
  if (!highlight) {
    return <h2 className={className}>{text}</h2>
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))

  return (
    <h2 className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} style={{ color: TOKENS.colors.accent }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </h2>
  )
}

export const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'TITLE':
      return (
        <div className="mb-10">
          <HighlightedText
            text={block.content as string}
            highlight={block.options?.highlight}
            className={TOKENS.typography.title}
          />
        </div>
      )

    case 'PARAGRAPH':
      return (
        <p className={`${TOKENS.typography.body} max-w-[80%]`}>
          {block.content as string}
        </p>
      )

    case 'LIST':
      return (
        <div className="flex flex-col gap-5 mt-6">
          {(block.content as string[]).map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <span
                className="mt-[0.65em] h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: TOKENS.colors.accent }}
              />
              <p className={TOKENS.typography.body}>{item}</p>
            </div>
          ))}
        </div>
      )

    case 'IMAGE':
      return (
        <div className="w-full overflow-hidden rounded-3xl">
          <img
            src={block.content as string}
            alt=""
            className="w-full h-auto object-cover"
          />
        </div>
      )

    case 'SPACER': {
      const sizeMap = {
        sm: 'h-4',
        md: 'h-8',
        lg: 'h-16'
      }

      return <div className={sizeMap[block.options?.size || 'md']} />
    }

    default:
      return null
  }
}
