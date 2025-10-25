import { CheckCircle, PlayCircle, Terminal, ThumbsUp, XCircle } from 'lucide-react';
import { TestResult } from '../types/challengeEditor';

interface TestResultsProps {
  testResults: TestResult[];
  isRunning: boolean;
  getPassingTestsCount: () => number;
  onRunCode: () => void;
  onSubmitSolution: () => void;
  onOpenRetire: () => void;
}

export function TestResults({ 
  testResults, 
  isRunning, 
  getPassingTestsCount, 
  onRunCode, 
  onSubmitSolution, 
  onOpenRetire 
}: TestResultsProps) {
  return (
    <div className="bg-white border-l border-slate-300 flex flex-col">
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-400" />
          <span className="text-slate-200 font-bold">🧪 テスト結果</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRunCode}
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
            onClick={onOpenRetire}
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
          onClick={onSubmitSolution}
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
        </button>
      </div>
    </div>
  );
}
