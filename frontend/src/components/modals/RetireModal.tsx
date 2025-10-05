import { ChevronRight} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from '../Markdown';

interface RetireModalProps {
  message: string;
  explanation?: string;
  onClose: () => void;
  challenge: any;
  userAnswer: string;
  lastFailingCode?: string | null;
  aiGeneratedCode?: string | null;
  testResults?: any[];
}

function RetireModal({
  message,
  onClose,
  challenge,
  userAnswer,
  lastFailingCode,
  aiGeneratedCode,
  testResults,
}: RetireModalProps) {
  const navigate = useNavigate();
  const [generatedExplanation, setGeneratedExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(true);
  const [explanationError, setExplanationError] = useState('');
  const [hasFetchedExplanation, setHasFetchedExplanation] = useState(false);

  // Fetch retire-specific explanation; ignore any pre-fetched summary to avoid flicker.
  useEffect(() => {
    let isCancelled = false;

    if (hasFetchedExplanation) {
      return () => {
        isCancelled = true;
      };
    }

    const hasContext = Boolean(
      (challenge?.instructions && challenge.instructions.trim()) ||
        (challenge?.examples && challenge.examples.trim()) ||
        (aiGeneratedCode && aiGeneratedCode.trim()) ||
        (lastFailingCode && lastFailingCode.trim()) ||
        (userAnswer && userAnswer.trim())
    );

    if (!hasContext) {
      if (!isCancelled) {
        setExplanationError('解説に必要な情報が不足しています。');
        setIsLoadingExplanation(false);
        setHasFetchedExplanation(true);
      }
      return () => {
        isCancelled = true;
      };
    }

    const fetchExplanation = async () => {
      try {
        setIsLoadingExplanation(true);
        setExplanationError('');

        const response = await fetch('http://localhost:8000/api/generate-retire-explanation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beforeCode: (aiGeneratedCode || lastFailingCode || '').toString(),
            afterCode: (userAnswer || '').toString(),
            instructions: (challenge?.instructions || '').toString(),
            examples: (challenge?.examples || '').toString(),
            testResults: testResults || [],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || '解説の生成に失敗しました。');
        }

        const parts: string[] = [];
        if (typeof data?.answer_code === 'string' && data.answer_code.trim()) {
          parts.push(`## 正解コード\n\`\`\`python\n${data.answer_code.trim()}\n\`\`\``);
        }
        if (typeof data?.explanation === 'string' && data.explanation.trim()) {
          parts.push(`## 解説\n${data.explanation.trim()}`);
        }
        if (typeof data?.advice === 'string' && data.advice.trim()) {
          parts.push(`## アドバイス\n${data.advice.trim()}`);
        }

        if (!isCancelled) {
          if (parts.length > 0) {
            setGeneratedExplanation(parts.join('\n\n'));
          } else {
            setGeneratedExplanation('');
            setExplanationError('解説の生成に失敗しました。');
          }
        }
      } catch (error: unknown) {
        if (!isCancelled) {
          setGeneratedExplanation('');
          setExplanationError(error instanceof Error ? error.message : '解説の生成に失敗しました。');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingExplanation(false);
          setHasFetchedExplanation(true);
        }
      }
    };

    fetchExplanation();

    return () => {
      isCancelled = true;
    };
  }, [aiGeneratedCode, challenge, hasFetchedExplanation, lastFailingCode, testResults, userAnswer]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full mx-4 my-6 relative animate-success max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mt-6 sm:mt-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent mb-4">☕️ {message} ☕️</h2>

          {isLoadingExplanation && (
            <div className="mt-4 text-sm text-slate-600">解説を生成しています...</div>
          )}

          {!isLoadingExplanation && generatedExplanation && (
            <div className="mt-4 bg-slate-50 p-4 rounded-lg text-left">
              <Markdown content={generatedExplanation} className="text-slate-700 text-sm space-y-2" />
            </div>
          )}

          {!isLoadingExplanation && explanationError && (
            <div className="mt-4 text-sm text-pink-700 bg-pink-50 border border-pink-200 rounded px-3 py-2">
              {explanationError}
            </div>
          )}

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

export default RetireModal;
