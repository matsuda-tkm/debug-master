import { useState } from 'react';

export function useCodeGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [explanation, setExplanation] = useState('');

  return {
    isGenerating,
    setIsGenerating,
    generationError,
    setGenerationError,
    explanation,
    setExplanation,
  };
}