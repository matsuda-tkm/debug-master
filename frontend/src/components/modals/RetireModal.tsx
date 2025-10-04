import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, PartyPopper, SettingsIcon as Confetti } from 'lucide-react';

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
  explanation,
  onClose,
  challenge,
  userAnswer,
  lastFailingCode,
  aiGeneratedCode,
  testResults,
}: RetireModalProps) {
  const navigate = useNavigate();
  const [generatedExplanation, setGeneratedExplanation] = useState(explanation || '');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState('');
  const [hasFetchedExplanation, setHasFetchedExplanation] = useState(false);

  // Retire flow also triggers a fresh explanation just like the success modal.
  useEffect(() => {
    let isCancelled = false;

    const hasContext = Boolean(
      (challenge?.instructions && challenge.instructions.trim()) ||
      (challenge?.examples && challenge.examples.trim()) ||
      (aiGeneratedCode && aiGeneratedCode.trim()) ||
      (lastFailingCode && lastFailingCode.trim()) ||
      (userAnswer && userAnswer.trim())
    );

    if (hasFetchedExplanation || !hasContext) {
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
        if (typeof data?.reason === 'string' && data.reason.trim()) {
          parts.push(`修正理由:\n${data.reason.trim()}`);
        }
        if (typeof data?.explain_diff === 'string' && data.explain_diff.trim()) {
          parts.push(`変更点:\n${data.explain_diff.trim()}`);
        }

        if (!isCancelled) {
          const merged = parts.join('\n\n');
          setGeneratedExplanation((prev) => {
            if (merged) {
              return merged;
            }
            if (prev) {
              return prev;
            }
            return explanation || '';
          });
        }
      } catch (error: unknown) {
        if (!isCancelled) {
          setExplanationError(
            error instanceof Error ? error.message : '解説の生成に失敗しました。'
          );
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
  }, [
    aiGeneratedCode,
    challenge,
    explanation,
    hasFetchedExplanation,
    lastFailingCode,
    testResults,
    userAnswer,
  ]);

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

          {(generatedExplanation || explanation) && (
            <div className="mt-4 bg-slate-50 p-4 rounded-lg text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">バグの説明:</h3>
              <div className="text-slate-700 whitespace-pre-wrap text-sm">
                {generatedExplanation || explanation}
              </div>
            </div>
          )}

          {isLoadingExplanation && (
            <div className="mt-4 text-sm text-slate-600">解説を生成しています...</div>
          )}

          {explanationError && (
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
