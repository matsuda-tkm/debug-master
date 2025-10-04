import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2,
  Bug,
  BookOpen,
  ChevronRight,
  ThumbsUp,
  Terminal,
  PlayCircle,
  XCircle,
  CheckCircle,
  PartyPopper,
  SettingsIcon as Confetti,
  Wand2,
  Lightbulb,
  X
} from 'lucide-react';
import { challengeService } from './services/challengeService';
import Markdown from './components/Markdown';
import { Challenge } from './types/challenge';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';
import RetireModal from './components/modals/RetireModal';


type HintLevel = {
  level: number;
  title?: string;
  content: string;
};

const DEFAULT_HINT_TITLES: Record<number, string> = {
  1: '方向性のヒント',
  2: 'キーワードのヒント',
  3: '解法の骨子',
  4: '最終ヒント',
};

const HINT_LEVEL_COUNT = 4;

interface SuccessModalProps {
  message: string;
  explanation: string;
  onClose: () => void;
  challenge: Challenge;
  userAnswer: string;
  lastFailingCode: string;
  aiGeneratedCode: string;
  testResults: any;
}

function SuccessModal({
  message,
  explanation,
  onClose,
  challenge,
  userAnswer,
  lastFailingCode,
  aiGeneratedCode,
  testResults
}: SuccessModalProps) {
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailError, setDetailError] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    const generate = async () => {
      try {
        setLoadingDetail(true);
        setDetailError('');
        const resp = await fetch('http://localhost:8000/api/generate-explanation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beforeCode: aiGeneratedCode || lastFailingCode || '',
            afterCode: userAnswer || '',
            instructions: challenge?.instructions || '',
            examples: challenge?.examples || '',
            testResults: testResults || [],
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data?.detail || '詳細解説の生成に失敗しました');
        }
        setDetail(data);
      } catch (e: any) {
        setDetailError(e?.message || '詳細解説の生成に失敗しました');
      } finally {
        setLoadingDetail(false);
      }
    };
    generate();
  }, [challenge, lastFailingCode, aiGeneratedCode, testResults, userAnswer]);

  // 全体コードを表示しつつ、差分をハイライトするための簡易LCS。
  const diffWithIndex = (before: string, after: string) => {
    const a = before.split('\n');
    const b = after.split('\n');
    const n = a.length, m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    type Op = { type: 'unchanged' | 'removed' | 'added'; text: string; aIndex?: number; bIndex?: number };
    const res: Op[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        res.push({ type: 'unchanged', text: a[i], aIndex: i, bIndex: j }); i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        res.push({ type: 'removed', text: a[i], aIndex: i }); i++;
      } else {
        res.push({ type: 'added', text: b[j], bIndex: j }); j++;
      }
    }
    while (i < n) { res.push({ type: 'removed', text: a[i], aIndex: i }); i++; }
    while (j < m) { res.push({ type: 'added', text: b[j], bIndex: j }); j++; }
    return { ops: res, a, b };
  };
  const keyPoint1 = detail?.reason || '...';
  const keyPoint2 = detail?.explain_diff || '...';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full mx-4 my-6 relative animate-success max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <Confetti className="w-12 h-12 text-yellow-400 animate-bounce animate-rainbow" />
            <PartyPopper
              className="w-12 h-12 text-pink-500 absolute top-0 left-0 animate-sparkle"
            />
          </div>
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-wiggle">🎉 {message} 🎉</h2>

          {explanation && (
            <div className="mt-4 bg-slate-50 p-4 rounded-lg text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">バグの説明（AI生成の要約）</h3>
              <Markdown content={explanation} className="text-slate-700 text-sm space-y-2" />
            </div>
          )}

          {/* 詳細解説（シンプル版） */}
          <div className="mt-6 text-left">
            <button
              onClick={() => setOpenDetail((v) => !v)}
              className="w-full flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 px-4 py-3 rounded-lg border border-indigo-200 transition"
            >
              <span className="text-indigo-800 font-semibold">🔍 詳細解説</span>
              <ChevronRight className={`w-5 h-5 text-indigo-600 transition-transform ${openDetail ? 'rotate-90' : ''}`} />
            </button>
            {openDetail && (
              <div className="mt-3 space-y-4">
                {/* 3つでわかるポイント */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">なにが問題？</h4>
                  <Markdown content={keyPoint1} className="text-slate-800 text-sm" />
                  <br/>
                  <h4 className="font-semibold text-slate-800 mb-2">どう直した？</h4>
                  <Markdown content={keyPoint2} className="text-slate-800 text-sm" />
                  <br/>
                </div>

                {loadingDetail && (
                  <div className="text-slate-600 text-sm">生成中...</div>
                )}
                {detailError && (
                  <div className="text-pink-700 bg-pink-50 border border-pink-200 rounded px-3 py-2 text-sm">{detailError}</div>
                )}
                {detail && (
                  <>
                    {/* コード（全体 + 差分ハイライト） */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-800 px-4 py-2 text-slate-200 text-sm font-bold flex items-center justify-between">
                        <span>コード（全体 + 差分）</span>
                        <button className="text-slate-200 text-xs underline" onClick={() => setShowDiff((v) => !v)}>
                          {showDiff ? 'とじる' : 'ひらく'}
                        </button>
                      </div>
                      {showDiff && (
                        <div className="max-h-56 overflow-auto text-xs font-mono leading-5 bg-slate-50">
                          {(() => {
                            const baseForDiff = (aiGeneratedCode || lastFailingCode || '').toString();
                            const after = (userAnswer || '').toString();
                            if (!after) {
                              return <div className="p-3 text-slate-600">コードがありません。</div>;
                            }
                            if (!baseForDiff) {
                              return (
                                <>
                                  <div className="px-3 py-2 text-[11px] text-slate-600 border-b border-slate-200">
                                    比較対象がありません（AI生成/失敗コードが未取得）。全体コードのみ表示します。
                                  </div>
                                  <pre className="p-3 text-slate-800">
                                    {after.split('\n').map((line: string, i: number) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </pre>
                                </>
                              );
                            }
                            const { ops, b } = diffWithIndex(baseForDiff, after);
                            const afterStatuses: ('unchanged' | 'added')[] = Array.from({ length: b.length }, () => 'unchanged');
                            ops.forEach(op => {
                              if (op.type === 'added' && op.bIndex !== undefined) afterStatuses[op.bIndex] = 'added';
                            });
                            return (
                              <>
                                <div className="px-3 py-2 text-[11px] text-slate-600 border-b border-slate-200">
                                  緑色でハイライトされた行は、比較対象（AI生成 または 失敗コード）からの差分です。
                                </div>
                                <pre className="p-3 text-slate-800">
                                  {b.map((line: string, i: number) => (
                                    <div
                                      key={i}
                                      className={afterStatuses[i] === 'added' ? 'bg-emerald-50 text-emerald-700' : ''}
                                    >
                                      {line || '\u00A0'}
                                    </div>
                                  ))}
                                </pre>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              他の課題にチャレンジする
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800 transition"
            >
              現在の課題を続ける
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function HintModal({ hint, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full mx-4 my-6 relative animate-pop-in max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col">
          <div className="flex items-start gap-4">
            {/* Character image */}
            <div className="w-40 h-63 flex-shrink-0">
              <img 
                src="/images/character.png" 
                alt="Debug Master Character" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Speech bubble */}
            <div className="flex-1 bg-indigo-50 rounded-2xl p-5 relative">
              {/* Speech bubble tail */}
              <div className="absolute top-1/2 left-0 w-4 h-4 bg-indigo-50 transform translate-y-[-50%] translate-x-[-50%] rotate-45"></div>
              
              <h2 className="text-xl font-bold text-indigo-800 mb-3">ヒント</h2>
              <div className="text-slate-700 whitespace-pre-wrap mb-4">
                {hint}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ videoSrc, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full mx-4 my-6 relative animate-pop-in max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-indigo-800 mb-3">問題の意味を動画で理解</h2>
          <div className="relative">
            <video
              className="w-full rounded shadow"
              controls
              autoPlay
            >
              <source src={videoSrc} type="video/mp4" />
              お使いのブラウザは動画タグに対応していません。
            </video>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function ChallengeEditor() {
  const navigate = useNavigate();
  const { themeId } = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`def main(numbers):
    # Write your solution here
    pass
    `);
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [explanation, setExplanation] = useState('');
    const [aiGeneratedCode, setAiGeneratedCode] = useState<string | null>(null);
    const [lastFailingCode, setLastFailingCode] = useState<string | null>(null);
    const [hintLevels, setHintLevels] = useState<HintLevel[]>([]);
    const [unlockedHintLevel, setUnlockedHintLevel] = useState(0);
    const [isHintOpen, setIsHintOpen] = useState(false);
    const [isLoadingHints, setIsLoadingHints] = useState(false);
    const [hintError, setHintError] = useState('');
    const [isFinalHintConfirmVisible, setIsFinalHintConfirmVisible] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);  
    const [currentVideo, setCurrentVideo] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [visibleHintLevel, setVisibleHintLevel] = useState<number | null>(null);
    const [isHintContentVisible, setIsHintContentVisible] = useState(false);
    const [showRetireModal, setShowRetireModal] = useState(false);
    
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

  useEffect(() => {
    if (isLoadingHints || !activeHint?.content) {
      setIsHintContentVisible(false);
      return;
    }

    setIsHintContentVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsHintContentVisible(true);
    }, 10);

    return () => {
      window.clearTimeout(timeoutId);
      setIsHintContentVisible(false);
    };
  }, [activeHint?.content, activeHint?.level, isLoadingHints]);

  const closeHint = useCallback(() => {
    setIsHintOpen(false);
    setIsFinalHintConfirmVisible(false);
  }, []);

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
          .filter((item): item is HintLevel => Boolean(item));

        const seen = new Set<number>();
        const uniqueHints = sanitizedHints.filter((item) => {
          if (seen.has(item.level)) {
            return false;
          }
          seen.add(item.level);
          return item.level >= 1 && item.level <= HINT_LEVEL_COUNT;
        });

        const preparedHints = uniqueHints.sort((a, b) => a.level - b.level);

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
            (item) => item.level === targetLevel
          );

          if (!targetHint) {
            setHintError('指定レベルのヒントが取得できませんでした。');
            return false;
          }

          setHintLevels((prev) => {
            const filtered = prev.filter((item) => item.level !== targetLevel);
            return [...filtered, targetHint].sort((a, b) => a.level - b.level);
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
            preparedHints.some((item) => item.level === prev);

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

  useEffect(() => {
    if (!sortedHintLevels.length) {
      setVisibleHintLevel(null);
      return;
    }

    if (normalizedUnlockedLevel > 0) {
      setVisibleHintLevel((prev) => {
        if (
          prev &&
          prev <= normalizedUnlockedLevel &&
          sortedHintLevels.some((item) => item.level === prev)
        ) {
          return prev;
        }
        return normalizedUnlockedLevel;
      });
    }
  }, [sortedHintLevels, normalizedUnlockedLevel]);

  useEffect(() => {
    const loadChallengeData = async () => {
      if (!themeId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const challengeData = await challengeService.getChallengeById(themeId);
        setChallenge(challengeData);
      } catch (error) {
        console.error('Failed to load challenge:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadChallengeData();
  }, [themeId, navigate]);

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

  useEffect(() => {
    if (!isHintOpen && prevFocusedElementRef.current) {
      prevFocusedElementRef.current.focus();
      prevFocusedElementRef.current = null;
    }
  }, [isHintOpen]);

  useEffect(() => {
    if (!isHintOpen) {
      return;
    }

    const dialogEl = hintDialogRef.current;
    if (!dialogEl) {
      return;
    }

    if (isFinalHintConfirmVisible) {
      finalHintConfirmButtonRef.current?.focus();
    } else if (hintHeadingRef.current) {
      hintHeadingRef.current.focus();
    }

    const focusableSelectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeHint();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!current || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHintOpen, closeHint, normalizedUnlockedLevel, visibleHintLevel, isFinalHintConfirmVisible]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (!isHintOpen) {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isHintOpen]);

  useEffect(() => {
    if (!nextHintLevel) {
      setIsFinalHintConfirmVisible(false);
    }
  }, [nextHintLevel]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setCurrentStep(2);

    try {
      const response = await fetch('http://localhost:8000/api/generate-code', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          challenge: challenge?.instructions,
          testCases: challenge?.testCases,
          }),
      });

      const data = await response.json();
      console.log('Generated code response:', data);

      if (!response.ok || data.error) {
        setGenerationError(data.error || 'An unknown error occurred.');
        return;
      }

      if (data.code) {
        setCode(data.code);
        setAiGeneratedCode(data.code);
      }
      if (data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error generating code: ', error);
      setGenerationError('Failed to connect to code generation service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(3);

    try {
      const response = await fetch('http://localhost:8000/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          testCases: challenge.testCases,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let anyFailure = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.status && data.status !== 'success') {
                anyFailure = true;
              }
              setTestResults((prev) => [...prev, data]);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
        buffer = lines[lines.length - 1];
      }
      // After stream ends, remember the current code as failing snapshot if any test failed
      if (anyFailure) {
        setLastFailingCode(code);
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults([
        {
          testCase: 1,
          status: 'error',
          message:
            'Failed to connect to Python server. Please make sure the server is running.',
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = () => {
    const allTestsPassed = testResults.every(
      (result) => result.status === 'success'
    );
    if (allTestsPassed) {
      setCurrentStep(4);
      setShowSuccessModal(true);
    }
  };

  const getPassingTestsCount = () => {
    return testResults.filter((result) => result.status === 'success').length;
  };
  
  const handleShowVideo = (videoSrc) => {
    setCurrentVideo(videoSrc);
    setShowVideoModal(true);
  };

  const handleOpenRetire = () => setShowRetireModal(true);
  const handleCloseRetire = () => setShowRetireModal(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700 font-medium">問題を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const handleGoHome = () => {
    const confirmed = window.confirm('本当にホーム画面に戻りますか？\n現在の進行状況は保存されません。');
    if (confirmed) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex flex-col relative overflow-hidden">
      {showSuccessModal && (
        <SuccessModal
          message="おめでとう！バグ修正に成功 🎉"
          explanation={explanation}
          challenge={challenge}
          userAnswer={code}
          lastFailingCode={lastFailingCode}
          aiGeneratedCode={aiGeneratedCode}
          testResults={testResults}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
      {isHintOpen && activeHint && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={closeHint}
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
                onClick={closeHint}
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
                        onClick={handleResetHints}
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
                            onClick={() => setVisibleHintLevel(hintLevel.level)}
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

                  {isFinalHintConfirmVisible ? (
                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-semibold mb-2">最終ヒントはほぼ答えです。</p>
                      <p className="mb-3">本当に表示しますか？</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={handleCancelFinalHint}
                          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          やめる
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmFinalHint}
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
                            onClick={handleRequestAdditionalHint}
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
      )}
      {/* Floating character */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleHintButtonClick}
          disabled={isLoadingHints}
          aria-expanded={isHintOpen}
          aria-controls="hint-popover"
          aria-label={hintButtonLabel}
          className="group relative w-24 h-24 rounded-full outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed"
        >
          <span className="sr-only">{hintButtonLabel}</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400/50 via-purple-400/40 to-indigo-400/20 opacity-0 blur-md transition duration-200 group-hover:opacity-100" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-pink-300 transition duration-200" />
          <img
            src="/images/character.png"
            alt="プログラミング助手"
            className={`relative z-10 w-full h-full object-contain animate-float group-hover:animate-wiggle group-hover:scale-110 transition-transform duration-300 drop-shadow-lg ${
              isLoadingHints ? 'opacity-60 blur-sm' : ''
            }`}
          />
          {isLoadingHints && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-full bg-slate-900/40">
              <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-white drop-shadow">生成中...</span>
            </div>
          )}
          <div className="absolute -top-1 -right-1 z-30">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-sparkle"></div>
          </div>
        </button>
      </div>
      {showVideoModal && (
        <VideoModal
          videoSrc={currentVideo}
          onClose={() => setShowVideoModal(false)}
        />
      )}
      {showRetireModal && (
        <RetireModal
          message="リタイアしますか？"
          explanation={explanation}
          challenge={challenge}
          userAnswer={code}
          lastFailingCode={lastFailingCode}
          aiGeneratedCode={aiGeneratedCode}
          testResults={testResults}
          onClose={handleCloseRetire}
        />
      )}

      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="relative cursor-pointer transform hover:scale-105 transition-transform duration-200"
              onClick={handleGoHome}
            >
              <Bug className="w-8 h-8 text-purple-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
            </div>
            <span 
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={handleGoHome}
            >
              DebugMaster
            </span>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-sm font-medium text-purple-600">君ならできる！</span> 
            </div>
          </div>
        </div>
      </header>

      {/* プログレスバー */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-purple-800">📋 {challenge.title}</h1>
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <span className="bg-purple-100 px-3 py-1 rounded-full font-bold">⭐ {challenge.difficulty}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 ${currentStep >= 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-200'} rounded-full flex items-center justify-center text-white font-bold text-xs`}>1</div>
              <span className={`font-medium ${currentStep >= 1 ? 'text-purple-700' : 'text-purple-500'}`}>問題を理解</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-purple-500' : 'bg-purple-200'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 ${currentStep >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-200'} rounded-full flex items-center justify-center text-white font-bold text-xs`}>2</div>
              <span className={`font-medium ${currentStep >= 2 ? 'text-purple-700' : 'text-purple-500'}`}>コード作成</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-purple-500' : 'bg-purple-200'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 ${currentStep >= 3 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-200'} rounded-full flex items-center justify-center text-white font-bold text-xs`}>3</div>
              <span className={`font-medium ${currentStep >= 3 ? 'text-purple-700' : 'text-purple-500'}`}>テスト実行</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 4 ? 'bg-purple-500' : 'bg-purple-200'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 ${currentStep >= 4 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-purple-200'} rounded-full flex items-center justify-center text-white font-bold text-xs`}>4</div>
              <span className={`font-medium ${currentStep >= 4 ? 'text-purple-700' : 'text-purple-500'}`}>提出</span>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col">
        {/* 上部：問題エリア */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200 p-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 問題説明 */}
            <div className="lg:col-span-2">
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  今日のミッション
                </h2>

                <div className="mt-4 text-blue-900 font-medium leading-relaxed">
                  <pre className="font-sans whitespace-pre-wrap">{challenge.instructions}</pre>
                </div>
                
                {/* 例の表示 */}
                <div className="mt-6 bg-white/80 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                    💡 例を見てみよう
                  </h3>
                  <pre className="bg-slate-100 p-3 rounded text-sm font-mono whitespace-pre-wrap text-slate-700">
                    {challenge.examples}
                  </pre>
                </div>

              </div>
            </div>
            
            {/* 右側：動画とヒント */}
            <div className="space-y-4">
              {/* 動画ボタン */}
              {challenge.video && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">📺 動画で理解しよう</h3>
                  <button
                    onClick={() => handleShowVideo(challenge.video)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg font-bold"
                  >
                    <PlayCircle className="w-5 h-5" />
                    動画を見る
                  </button>
                </div>
              )}
              
              {/* ヒント活用ガイド */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-800 mb-2">🧭 ヒントの使い方</h3>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  右下のキャラクターをクリックするとレベル1〜{displayedHintLevelCount}まで段階的にヒントを確認できます。
                </p>
                <p className="mt-2 text-indigo-600 text-xs leading-relaxed">
                  最終ヒントはほぼ答えなので、表示前に確認ダイアログが出ます。
                </p>
                <p className="mt-2 text-indigo-600 text-xs leading-relaxed">
                  内容が合わないときはリセットボタンからヒントを再生成してみましょう。
                </p>
                {hintError && (
                  <p className="mt-3 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600">
                    😅 {hintError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* AIコード生成ボタン */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg font-bold"
              >
                <Wand2 className="w-5 h-5" />
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AIがコード生成中...
                  </>
                ) : (
                  '🤖 AIコード生成'
                )}
              </button>
              {generationError && (
                <div className="text-pink-600 font-bold bg-pink-50 px-4 py-2 rounded-lg border border-pink-200 animate-wiggle">
                  😅 うまくいかなかったね...もう一度チャレンジしてみよう！
                </div>
              )}
            </div>
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              💡 AIにコードを生成してもらってから、エディタで編集してテストを実行しよう！
            </div>
          </div>
        </div>
        
        {/* 下部：コーディングエリア */}
        <div className="flex-1 bg-slate-100">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* コードエディタ */}
            <div className="flex flex-col">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                <Code2 className="w-5 h-5 text-slate-400" />
                <span className="text-slate-200 font-bold">💻 コードエディタ</span>
              </div>
              <div className="flex-1 bg-slate-900">
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[python(), oneDark, indentUnit.of('    ')]}
                  onChange={(value) => setCode(value)}
                  className="w-full h-full font-mono text-sm"
                />
              </div>
            </div>

            {/* テスト結果 */}
            <div className="bg-white border-l border-slate-300 flex flex-col">
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200 font-bold">🧪 テスト結果</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${
                      isRunning
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transform hover:scale-105'
                    } text-sm transition-all`}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        実行中...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        テスト実行
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleOpenRetire}
                    className="flex items-center gap-2 px-4 py-2 rounded font-bold bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white text-sm transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    リタイア
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`mb-3 p-3 rounded-lg border-2 ${
                      result.status === 'success' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className={`font-bold mb-1 ${
                          result.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          テスト {result.testCase} {result.status === 'success' ? '✅' : '❌'}
                        </div>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap">
                          {result.status === 'forbidden'
                            ? 'APIキーを抜き取ろうとするコードは許可されていません！'
                            : result.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-center text-slate-500 py-8">
                    <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">まだテストを実行していません</p>
                    <p className="text-sm">「テスト実行」ボタンを押してみよう！</p>
                  </div>
                )}
              </div>
              
              {/* 提出ボタン */}
              <div className="p-4 border-t border-slate-200">
                {testResults.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm mb-3">
                    <ThumbsUp className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-purple-700">
                      {getPassingTestsCount()}/{testResults.length} テスト成功
                    </span>
                  </div>
                )}
                <button
                  onClick={handleSubmitSolution}
                  disabled={
                    testResults.length === 0 ||
                    getPassingTestsCount() !== testResults.length
                  }
                  className={`w-full px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-bold ${
                    testResults.length === 0 ||
                    getPassingTestsCount() !== testResults.length
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 shadow-lg animate-success'
                  } transition-all`}
                >
                  🎉 回答を提出する
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeEditor;
