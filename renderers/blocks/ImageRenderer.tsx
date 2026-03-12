
import React from 'react';
import { Block } from '../../types';

interface ImageRendererProps {
  block: Block;
}

export function ImageRenderer({ block }: ImageRendererProps) {
  // Mapping 'content' from our internal Block interface to 'src' as per requested logic
  const src = block.content as string;

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <img
        src={src}
        alt=""
        className="w-full h-auto object-cover"
      />
    </div>
  );
}
