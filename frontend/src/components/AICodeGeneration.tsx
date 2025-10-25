import { Wand2 } from 'lucide-react';

interface AICodeGenerationProps {
  isGenerating: boolean;
  generationError: string | null;
  onGenerateCode: () => void;
}

export function AICodeGeneration({ 
  isGenerating, 
  generationError, 
  onGenerateCode 
}: AICodeGenerationProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200 p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onGenerateCode}
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
  );
}
