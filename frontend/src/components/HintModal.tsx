import { Lightbulb, X } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';
import { HintLevel } from '../../types/challengeEditor';

interface HintContentRendererProps {
  activeHint: HintLevel | undefined;
  isLoadingHints: boolean;
  isHintContentVisible: boolean;
}

export default function HintContentRenderer({ activeHint, isLoadingHints, isHintContentVisible }: HintContentRendererProps) {
  const renderInlineSegments = useCallback(
    (text: string, keyPrefix = 'inline'): ReactNode[] => {
      if (!text) {
        return [];
      }

      const segments = text.split(/(``[^`]+``|`[^`]+`)/g);
      const nodes: ReactNode[] = [];

      segments.forEach((segment, index) => {
        if (!segment) {
          return;
        }

        const isDoubleTick = segment.startsWith('``') && segment.endsWith('``') && segment.length > 4;
        const isSingleTick = segment.startsWith('`') && segment.endsWith('`') && segment.length > 2;

        if (isDoubleTick || isSingleTick) {
          const trimLength = isDoubleTick ? 2 : 1;
          nodes.push(
            <code
              key={`${keyPrefix}-code-${index}`}
              className="mx-1 rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs text-white break-words"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {segment.slice(trimLength, -trimLength)}
            </code>
          );
        } else {
          nodes.push(
            <span key={`${keyPrefix}-text-${index}`}>{segment}</span>
          );
        }
      });

      return nodes;
    },
    []
  );

  const renderedHintContent = useMemo(() => {
    if (!activeHint?.content) {
      return null;
    }

    const content = activeHint.content;
    const nodes: ReactNode[] = [];
    const blockRegex = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g;

    let lastIndex = 0;
    let blockIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(content)) !== null) {
      const [fullMatch, language = '', codeBody = ''] = match;
      const matchStart = match.index;

      if (matchStart > lastIndex) {
        const precedingText = content.slice(lastIndex, matchStart);
        nodes.push(...renderInlineSegments(precedingText, `pre-${blockIndex}`));
      }

      const trimmedCode = codeBody.startsWith('\n') ? codeBody.slice(1) : codeBody;
      const normalizedCode = trimmedCode.replace(/\s+$/, '');

      nodes.push(
        <pre
          key={`block-${blockIndex}`}
          className="my-3 max-h-48 overflow-y-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100 whitespace-pre-wrap break-words"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          <code
            className={language ? `language-${language.toLowerCase()}` : undefined}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {normalizedCode}
          </code>
        </pre>
      );

      lastIndex = matchStart + fullMatch.length;
      blockIndex += 1;
    }

    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      nodes.push(...renderInlineSegments(remainingText, `post-${blockIndex}`));
    }

    return nodes.length ? nodes : null;
  }, [activeHint?.content, renderInlineSegments]);

  return (
    <div
      id="hint-popover-description"
      className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto overflow-x-hidden"
      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
    >
      {isLoadingHints ? (
        <div className="space-y-3">
          <div className="h-3 w-3/4 rounded bg-slate-200/80 animate-pulse" />
          <div className="h-3 w-full rounded bg-slate-200/70 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-slate-200/60 animate-pulse" />
        </div>
      ) : (
        <div
          key={activeHint ? `${activeHint.level}-${activeHint.content}` : 'empty'}
          className="break-words w-full"
          style={{
            opacity: isHintContentVisible ? 1 : 0,
            transition: 'opacity 150ms ease-out',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {renderedHintContent ?? activeHint?.content}
        </div>
      )}
    </div>
  );
}

interface HintModalProps {
  isHintOpen: boolean;
  activeHint: HintLevel | undefined;
  activeHintTitle: string;
  highestHintLevel: number;
  unlockedHintLevels: HintLevel[];
  visibleHintLevel: number | null;
  isLoadingHints: boolean;
  hintError: string;
  isFinalHintConfirmVisible: boolean;
  nextHintLevel: number | null;
  hintDialogRef: React.RefObject<HTMLDivElement>;
  hintHeadingRef: React.RefObject<HTMLHeadingElement>;
  finalHintConfirmButtonRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onResetHints: () => void;
  onSetVisibleHintLevel: (level: number) => void;
  onRequestAdditionalHint: () => void;
  onConfirmFinalHint: () => void;
  onCancelFinalHint: () => void;
  setIsHintContentVisible: (visible: boolean) => void;
  isHintContentVisible: boolean;
}

export function HintModal({
  isHintOpen,
  activeHint,
  activeHintTitle,
  highestHintLevel,
  unlockedHintLevels,
  visibleHintLevel,
  isLoadingHints,
  hintError,
  isFinalHintConfirmVisible,
  nextHintLevel,
  hintDialogRef,
  hintHeadingRef,
  finalHintConfirmButtonRef,
  onClose,
  onResetHints,
  onSetVisibleHintLevel,
  onRequestAdditionalHint,
  onConfirmFinalHint,
  onCancelFinalHint,
  setIsHintContentVisible,
  isHintContentVisible,
}: HintModalProps) {
  if (!isHintOpen || !activeHint) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={hintDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-popover-title"
        aria-describedby="hint-popover-description"
        id="hint-popover"
        className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl md:p-8 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white shadow transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            aria-label="ヒントを閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-6 md:mt-4 md:flex-row">
          <div className="mx-auto w-40 flex-shrink-0 md:mx-0 md:w-48">
            <img
              src="/images/character.png"
              alt="プログラミング助手"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="relative flex-1 rounded-2xl bg-indigo-50 p-5 md:p-6">
            <div className="absolute -left-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rotate-45 bg-indigo-50 md:block" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                  <Lightbulb className="h-5 w-5 flex-shrink-0" />
                  <h2
                    id="hint-popover-title"
                    ref={hintHeadingRef}
                    tabIndex={-1}
                    className="text-lg font-bold whitespace-normal break-words leading-snug"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    レベル {activeHint.level}: {activeHintTitle}
                  </h2>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-500 whitespace-nowrap">
                    レベル {activeHint.level} / {highestHintLevel}
                  </span>
                  <button
                    type="button"
                    onClick={onResetHints}
                    disabled={isLoadingHints}
                    className={`inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition whitespace-nowrap ${
                      isLoadingHints
                        ? 'cursor-not-allowed opacity-70'
                        : 'hover:bg-indigo-100'
                    }`}
                  >
                    {isLoadingHints ? (
                      <>
                        <span className="inline-flex h-3 w-3 items-center justify-center">
                          <span className="h-3 w-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        </span>
                        生成中...
                      </>
                    ) : (
                      'ヒントを再生成'
                    )}
                  </button>
                </div>
              </div>
              {unlockedHintLevels.length > 1 && (
                <div className="flex flex-wrap gap-2" role="list">
                  {unlockedHintLevels.map((hintLevel) => {
                    const isActive = hintLevel.level === activeHint.level;
                    return (
                      <button
                        key={hintLevel.level}
                        type="button"
                        onClick={() => onSetVisibleHintLevel(hintLevel.level)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? 'border-indigo-500 bg-white text-indigo-700 shadow'
                            : 'border-transparent bg-indigo-200/70 text-indigo-700 hover:bg-indigo-200'
                        }`}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        レベル {hintLevel.level}
                      </button>
                    );
                  })}
                </div>
              )}
              
              <HintContentRenderer
                activeHint={activeHint}
                isLoadingHints={isLoadingHints}
                isHintContentVisible={isHintContentVisible}
              />

              {isFinalHintConfirmVisible ? (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-2">最終ヒントはほぼ答えです。</p>
                  <p className="mb-3">本当に表示しますか？</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={onCancelFinalHint}
                      className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      やめる
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmFinalHint}
                      ref={finalHintConfirmButtonRef}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 whitespace-nowrap"
                    >
                      最終ヒントを表示
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-indigo-700 sm:max-w-[240px] sm:flex-shrink-0">
                    {nextHintLevel
                      ? `さらに詳しいヒントがレベル${nextHintLevel}で利用できます。`
                      : 'これ以上のヒントはありません。'}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {nextHintLevel && (
                      <button
                        type="button"
                        onClick={onRequestAdditionalHint}
                        className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 whitespace-nowrap"
                      >
                        {nextHintLevel === highestHintLevel ? '最終ヒントを表示' : 'さらにヒント'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
