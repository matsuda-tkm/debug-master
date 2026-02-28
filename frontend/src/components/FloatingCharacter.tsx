interface FloatingCharacterProps {
  isLoadingHints: boolean;
  isHintOpen: boolean;
  hintButtonLabel: string;
  onHintButtonClick: () => void;
}

export function FloatingCharacter({ 
  isLoadingHints, 
  isHintOpen, 
  hintButtonLabel, 
  onHintButtonClick 
}: FloatingCharacterProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={onHintButtonClick}
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
  );
}
