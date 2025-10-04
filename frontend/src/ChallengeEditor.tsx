import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { challengeService } from './services/challengeService';
import Markdown from './components/Markdown';
import { Challenge } from './types/challenge';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentUnit } from '@codemirror/language';

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
              <div className="text-slate-700 whitespace-pre-wrap text-sm">
                {explanation}
              </div>
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

  useEffect(() => {
    const loadChallenge = async () => {
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

    loadChallenge();
  }, [themeId, navigate]);

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
  const [lastFailingCode, setLastFailingCode] = useState<string | null>(null);
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hint, setHint] = useState('');
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

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
  
  const handleShowHint = async () => {
    setIsLoadingHint(true);
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
      console.log('Generated hint response:', response);
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        setHintError(data.error || 'ヒントの生成中にエラーが発生しました。');
        return;
      }
      
      setHint(data.hint);
      setShowHintModal(true);
    } catch (error) {
      console.error('Error generating hint:', error);
      setHintError('ヒント生成サービスへの接続に失敗しました。');
    } finally {
      setIsLoadingHint(false);
    }
  };
  
  const handleShowVideo = (videoSrc) => {
    setCurrentVideo(videoSrc);
    setShowVideoModal(true);
  };

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
      {/* Floating character */}
      <div className="fixed bottom-6 right-6 z-40">
        <div 
          className="relative w-24 h-24 group cursor-pointer"
          onClick={handleShowHint}
          style={{ pointerEvents: isLoadingHint ? 'none' : 'auto' }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400/50 via-purple-400/40 to-indigo-400/20 opacity-0 blur-md transition duration-200 group-hover:opacity-100" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-pink-300 transition duration-200" />
          <img 
            src="/images/character.png" 
            alt="プログラミング助手" 
            className="relative z-10 w-full h-full object-contain animate-float group-hover:animate-wiggle group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
          />
          {isLoadingHint && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute -top-1 -right-1 z-30">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-sparkle"></div>
          </div>
        </div>
      </div>
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
      {showHintModal && (
        <HintModal
          hint={hint}
          onClose={() => setShowHintModal(false)}
        />
      )}
      {showVideoModal && (
        <VideoModal
          videoSrc={currentVideo}
          onClose={() => setShowVideoModal(false)}
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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  今日のミッション
                </h2>
                <div className="text-blue-900 font-medium leading-relaxed">
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
              
              {/* ヒントキャラクター */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                <h3 className="text-lg font-bold text-orange-800 mb-3">🤔 困ったときは...</h3>
                <p className="text-orange-700 font-medium mt-2">右下のキャラクターをクリックしてヒントをもらおう！</p>
                {hintError && (
                  <div className="mt-2 text-pink-600 text-sm font-bold bg-pink-50 px-3 py-1 rounded-lg border border-pink-200">
                    😅 {hintError}
                  </div>
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
