
import React from 'react';
import { Block } from '../../types';

interface SpacerRendererProps {
  block: Block;
}

export function SpacerRenderer({ block }: SpacerRendererProps) {
  const sizeMap = {
    sm: "h-4",
    md: "h-6", // Reduzido de 8 para 6
    lg: "h-12" // Reduzido de 16 para 12
  };

  const size = block.options?.size || "md";

  return <div className={sizeMap[size as keyof typeof sizeMap]} />;
}
