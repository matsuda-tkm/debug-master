import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import { Code2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export function CodeEditor({ code, onCodeChange }: CodeEditorProps) {
  return (
    <div className="flex flex-col">
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
        <Code2 className="w-5 h-5 text-slate-400" />
        <span className="text-slate-200 font-bold">💻 コードエディタ</span>
      </div>
      <div className="flex-1 bg-slate-900">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[python(), oneDark, indentUnit.of('    ')]}
          onChange={(value) => onCodeChange(value)}
          className="w-full h-full font-mono text-sm"
        />
      </div>
    </div>
  );
}
