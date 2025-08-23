import { useState } from 'react';

export function useHints() {
  const [hint, setHint] = useState('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState('');

  return {
    hint,
    setHint,
    isLoadingHint,
    setIsLoadingHint,
    hintError,
    setHintError,
  };
}