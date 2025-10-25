import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Challenge } from '../types/challenge';
import { DEFAULT_HINT_TITLES, HINT_LEVEL_COUNT, HintLevel, TestResult } from '../types/challengeEditor';

export function useHints(challenge: Challenge | null, code: string, testResults: TestResult[]) {
  const [hintLevels, setHintLevels] = useState<HintLevel[]>([]);
  const [unlockedHintLevel, setUnlockedHintLevel] = useState(0);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [hintError, setHintError] = useState('');
  const [isFinalHintConfirmVisible, setIsFinalHintConfirmVisible] = useState(false);
  const [visibleHintLevel, setVisibleHintLevel] = useState<number | null>(null);
  const [isHintContentVisible, setIsHintContentVisible] = useState(false);
  
  const hintDialogRef = useRef<HTMLDivElement | null>(null);
  const hintHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const prevFocusedElementRef = useRef<HTMLElement | null>(null);
  const finalHintConfirmButtonRef = useRef<HTMLButtonElement | null>(null);

  const hintStorageKey = useMemo(
    () => (challenge ? `hint-progress-${challenge.id}` : null),
    [challenge?.id]
  );

  const sortedHintLevels = useMemo(() => {
    if (!hintLevels.length) {
      return [];
    }
    return [...hintLevels].sort((a, b) => a.level - b.level);
  }, [hintLevels]);

  const highestHintLevelEntry =
    sortedHintLevels.length > 0
      ? sortedHintLevels[sortedHintLevels.length - 1]
      : undefined;
  const highestHintLevel = highestHintLevelEntry
    ? highestHintLevelEntry.level
    : HINT_LEVEL_COUNT;
  const displayedHintLevelCount = Math.min(highestHintLevel, HINT_LEVEL_COUNT);

  const normalizedUnlockedLevel = useMemo(() => {
    if (!sortedHintLevels.length) {
      return 0;
    }
    if (unlockedHintLevel <= 0) {
      return sortedHintLevels[0].level;
    }
    return Math.min(unlockedHintLevel, highestHintLevel);
  }, [sortedHintLevels, unlockedHintLevel, highestHintLevel]);

  const unlockedHintLevels = useMemo(() => {
    if (!sortedHintLevels.length) {
      return [];
    }
    return sortedHintLevels.filter((item) => item.level <= normalizedUnlockedLevel);
  }, [sortedHintLevels, normalizedUnlockedLevel]);

  const activeHint = useMemo(() => {
    if (!sortedHintLevels.length) {
      return undefined;
    }
    const targetLevel = visibleHintLevel ?? normalizedUnlockedLevel;
    const found = sortedHintLevels.find((item) => item.level === targetLevel);
    if (found) {
      return found;
    }
    return sortedHintLevels[0];
  }, [sortedHintLevels, normalizedUnlockedLevel, visibleHintLevel]);

  const nextHintLevel = useMemo(() => {
    if (!sortedHintLevels.length) {
      return null;
    }
    const next = sortedHintLevels.find((item) => item.level > normalizedUnlockedLevel);
    return next ? next.level : null;
  }, [sortedHintLevels, normalizedUnlockedLevel]);

  const normalizedHintTitle = useMemo(() => {
    if (!activeHint?.title) {
      return '';
    }

    const trimmed = activeHint.title.trim();
    if (!trimmed) {
      return '';
    }

    const cleaned = trimmed
      .replace(/^(?:ヒント|hint)\s*\d+\s*[:：-]?\s*/i, '')
      .trim();

    return cleaned.length > 0 ? cleaned : '';
  }, [activeHint?.title]);

  const activeHintTitle = activeHint
    ? normalizedHintTitle || DEFAULT_HINT_TITLES[activeHint.level] || 'ヒント'
    : 'ヒント';
  const hintButtonLabel = isHintOpen ? 'ヒントを閉じる' : 'ヒントを開く';

  const loadHints = useCallback(
    async (
      options: {
        force?: boolean;
        resetProgress?: boolean;
        targetLevel?: number;
      } = {}
    ) => {
      const { force = false, resetProgress = false, targetLevel } = options;

      if (!challenge) {
        return false;
      }
      if (!force && hintLevels.length) {
        return true;
      }

      setIsLoadingHints(true);
      setHintError('');

      try {
        const response = await fetch('http://localhost:8000/api/generate-hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            instructions: challenge.instructions,
            examples: challenge.examples,
            testResults,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const message =
          typeof data?.error === 'string'
          ? data.error
          : typeof data?.detail === 'string'
          ? data.detail
          : 'ヒントの生成中にエラーが発生しました。';
          setHintError(message);
          return false;
        }

        const rawHints = Array.isArray(data?.hints) ? data.hints : [];
        const sanitizedHints = rawHints
          .map((item: any) => {
            const levelValue = Number(item?.level);
            if (!Number.isFinite(levelValue)) {
              return null;
            }
            const contentValue =
              typeof item?.content === 'string' ? item.content.trim() : '';
            if (!contentValue) {
              return null;
            }
            const titleValue =
              typeof item?.title === 'string' && item.title.trim().length > 0
                ? item.title.trim()
                : undefined;
            return {
              level: levelValue,
              title: titleValue,
              content: contentValue,
            } as HintLevel;
          })
          .filter((item: HintLevel | null): item is HintLevel => Boolean(item));

        const seen = new Set<number>();
        const uniqueHints: HintLevel[] = sanitizedHints.filter((item: HintLevel) => {
          if (seen.has(item.level)) {
            return false;
          }
          seen.add(item.level);
          return item.level >= 1 && item.level <= HINT_LEVEL_COUNT;
        });

        const preparedHints = uniqueHints.sort((a: HintLevel, b: HintLevel) => a.level - b.level);

        if (!preparedHints.length) {
          setHintError('ヒントが取得できませんでした。');
          return false;
        }

        if (
          typeof targetLevel === 'number' &&
          hintLevels.length > 0 &&
          !resetProgress
        ) {
          const targetHint = preparedHints.find(
            (item: HintLevel) => item.level === targetLevel
          );

          if (!targetHint) {
            setHintError('指定レベルのヒントが取得できませんでした。');
            return false;
          }

          setHintLevels((prev) => {
            const filtered = prev.filter((item: HintLevel) => item.level !== targetLevel);
            return [...filtered, targetHint].sort((a: HintLevel, b: HintLevel) => a.level - b.level);
          });
          setUnlockedHintLevel((prev) =>
            prev < targetLevel ? targetLevel : prev
          );
          setVisibleHintLevel(targetLevel);

          return true;
        }

        const firstLevel = preparedHints[0]?.level ?? 1;

        setHintLevels(preparedHints);
        setUnlockedHintLevel((prev) => {
          if (!resetProgress && prev > 0) {
            return prev;
          }
          return firstLevel;
        });
        setVisibleHintLevel((prev) => {
          const canKeepCurrent =
            !resetProgress &&
            prev !== null &&
            preparedHints.some((item: HintLevel) => item.level === prev);

          if (canKeepCurrent) {
            return prev;
          }
          return firstLevel;
        });

        return true;
      } catch (error) {
        console.error('Error generating hint:', error);
        setHintError('ヒント生成サービスへの接続に失敗しました。');
        return false;
      } finally {
        setIsLoadingHints(false);
      }
    },
    [challenge, hintLevels.length, code, testResults]
  );

  const closeHint = useCallback(() => {
    setIsHintOpen(false);
    setIsFinalHintConfirmVisible(false);
  }, []);

  const handleHintButtonClick = async () => {
    if (!challenge) {
      return;
    }

    if (isHintOpen) {
      closeHint();
      return;
    }

    setHintError('');

    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      prevFocusedElementRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
    }

    const hintsLoaded = await loadHints();

    if (!hintsLoaded) {
      prevFocusedElementRef.current = null;
      return;
    }

    if (unlockedHintLevel <= 0 && sortedHintLevels.length) {
      setUnlockedHintLevel(sortedHintLevels[0].level);
    }

    setIsFinalHintConfirmVisible(false);
    setIsHintOpen(true);
  };

  const handleResetHints = useCallback(async () => {
    if (!challenge) {
      return;
    }

    setHintError('');
    setIsFinalHintConfirmVisible(false);

    const lowestLevel = sortedHintLevels[0]?.level ?? 1;
    const firstHint = sortedHintLevels.find((item) => item.level === lowestLevel);

    setHintLevels(firstHint ? [firstHint] : []);
    setUnlockedHintLevel(firstHint ? lowestLevel : 1);
    setVisibleHintLevel(firstHint ? lowestLevel : 1);

    if (hintStorageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(hintStorageKey);
      } catch (error) {
        console.error('Failed to clear hint cache:', error);
      }
    }

    const hintsLoaded = await loadHints({
      force: true,
      resetProgress: true,
    });

    if (!hintsLoaded) {
      return;
    }

    setIsHintOpen(true);
  }, [challenge, hintStorageKey, loadHints, sortedHintLevels]);

  const handleRequestAdditionalHint = () => {
    if (!nextHintLevel) {
      return;
    }

    if (
      nextHintLevel === highestHintLevel &&
      nextHintLevel >= HINT_LEVEL_COUNT
    ) {
      setIsFinalHintConfirmVisible(true);
      return;
    }

    setUnlockedHintLevel((prev) =>
      nextHintLevel > prev ? nextHintLevel : prev
    );
    setVisibleHintLevel(nextHintLevel);
  };

  const handleConfirmFinalHint = () => {
    if (!nextHintLevel) {
      setIsFinalHintConfirmVisible(false);
      return;
    }

    setUnlockedHintLevel((prev) =>
      nextHintLevel > prev ? nextHintLevel : prev
    );
    setVisibleHintLevel(nextHintLevel);
    setIsFinalHintConfirmVisible(false);
  };

  const handleCancelFinalHint = () => {
    setIsFinalHintConfirmVisible(false);
    if (hintHeadingRef.current) {
      hintHeadingRef.current.focus();
    }
  };

  // ローカルストレージの保存・復元
  useEffect(() => {
    if (!hintStorageKey) {
      setHintLevels([]);
      setUnlockedHintLevel(0);
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(hintStorageKey);
      if (!stored) {
        setHintLevels([]);
        setUnlockedHintLevel(0);
        return;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed?.hints)) {
        setHintLevels(parsed.hints as HintLevel[]);
      } else {
        setHintLevels([]);
      }
      setUnlockedHintLevel(
        typeof parsed?.unlockedLevel === 'number' ? parsed.unlockedLevel : 0
      );
    } catch (error) {
      console.error('Failed to restore hint progress:', error);
      setHintLevels([]);
      setUnlockedHintLevel(0);
    }
  }, [hintStorageKey]);

  useEffect(() => {
    if (!hintStorageKey || typeof window === 'undefined') {
      return;
    }
    try {
      const payload = JSON.stringify({
        unlockedLevel: unlockedHintLevel,
        hints: hintLevels,
      });
      window.localStorage.setItem(hintStorageKey, payload);
    } catch (error) {
      console.error('Failed to persist hint progress:', error);
    }
  }, [hintStorageKey, hintLevels, unlockedHintLevel]);

  return {
    // State
    hintLevels,
    unlockedHintLevel,
    isHintOpen,
    isLoadingHints,
    hintError,
    isFinalHintConfirmVisible,
    setIsFinalHintConfirmVisible,
    visibleHintLevel,
    isHintContentVisible,
    setIsHintContentVisible,
    
    // Computed values
    sortedHintLevels,
    highestHintLevel,
    displayedHintLevelCount,
    normalizedUnlockedLevel,
    unlockedHintLevels,
    activeHint,
    nextHintLevel,
    activeHintTitle,
    hintButtonLabel,
    
    // Refs
    hintDialogRef,
    hintHeadingRef,
    prevFocusedElementRef,
    finalHintConfirmButtonRef,
    
    // Actions
    loadHints,
    closeHint,
    handleHintButtonClick,
    handleResetHints,
    handleRequestAdditionalHint,
    handleConfirmFinalHint,
    handleCancelFinalHint,
    setVisibleHintLevel,
  };
}