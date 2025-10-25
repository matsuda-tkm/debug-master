import { ChevronRight, SettingsIcon as Confetti, PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import { SuccessModalProps } from '../../types/challengeEditor';
import Markdown from '../Markdown';

export default function SuccessModal({
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
        const resp = await fetch(API_ENDPOINTS.GENERATE_EXPLANATION, {
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