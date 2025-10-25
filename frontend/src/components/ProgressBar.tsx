import { Challenge } from '../types/challenge';

interface ProgressBarProps {
  challenge: Challenge;
  currentStep: number;
}

export function ProgressBar({ challenge, currentStep }: ProgressBarProps) {
  return (
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
  );
}
