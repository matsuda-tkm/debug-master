import { Bug } from 'lucide-react';

interface ChallengeHeaderProps {
  onGoHome: () => void;
}

export function ChallengeHeader({ onGoHome }: ChallengeHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="relative cursor-pointer transform hover:scale-105 transition-transform duration-200"
            onClick={onGoHome}
          >
            <Bug className="w-8 h-8 text-purple-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
          </div>
          <span 
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={onGoHome}
          >
            DebugMaster
          </span>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-sm font-medium text-purple-600">君ならできる！</span> 
          </div>
        </div>
      </div>
    </header>
  );
}
