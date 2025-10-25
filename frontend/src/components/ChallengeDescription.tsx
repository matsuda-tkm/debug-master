import { BookOpen, PlayCircle } from 'lucide-react';
import { Challenge } from '../types/challenge';

interface ChallengeDescriptionProps {
  challenge: Challenge;
  displayedHintLevelCount: number;
  hintError: string | null;
  onShowVideo: (videoSrc: string) => void;
}

export function ChallengeDescription({ 
  challenge, 
  displayedHintLevelCount, 
  hintError, 
  onShowVideo 
}: ChallengeDescriptionProps) {
  return (
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
                onClick={() => onShowVideo(challenge.video)}
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
  );
}
