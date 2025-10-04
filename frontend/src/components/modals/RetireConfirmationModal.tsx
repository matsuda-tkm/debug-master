import { AlertTriangle } from 'lucide-react';

interface RetireConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function RetireConfirmationModal({ onConfirm, onCancel }: RetireConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full mx-4 my-6 relative animate-pop-in max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            リタイアの確認
          </h2>
          
          <p className="text-slate-600 mb-6 leading-relaxed">
            リタイアすると、課題の解答と解説が表示されます。<br />
            本当にリタイアしますか？
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 font-bold shadow-lg"
            >
              リタイアする
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetireConfirmationModal;
