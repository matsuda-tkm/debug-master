interface HintModalProps {
  hint: string;
  onClose: () => void;
}

function HintModal({ hint, onClose }: HintModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full mx-4 relative animate-pop-in">
        <div className="flex flex-col">
          <div className="flex items-start gap-4">
            <div className="w-40 h-63 flex-shrink-0">
              <img 
                src="/images/character.png" 
                alt="Debug Master Character" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex-1 bg-indigo-50 rounded-2xl p-5 relative">
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

export default HintModal;