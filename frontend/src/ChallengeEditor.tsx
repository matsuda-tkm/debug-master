import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Code2, Bug, Trophy, BookOpen, MessageSquareWarning, ChevronRight, 
  Timer, ThumbsUp, Send, Sparkles, Eye, Files, ChevronDown, FolderOpen, 
  Terminal, PlayCircle, XCircle, CheckCircle, PartyPopper, SettingsIcon as Confetti 
} from 'lucide-react';
import { challengesData } from './challengesData';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';


function SuccessModal({ message, onClose }) {
  const navigate = useNavigate();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 relative overflow-hidden">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <Confetti className="w-12 h-12 text-yellow-400 animate-bounce" />
            <PartyPopper className="w-12 h-12 text-pink-500 absolute top-0 left-0 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>
        
        <div className="text-center mt-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">{message}</h2>
          
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={() => navigate('/')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium"
            >
              Choose Next Challenge
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800 transition"
            >
              Continue Current Challenge
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <div className="font-medium">Achievement Unlocked!</div>
                <div className="text-sm opacity-90">Python Master Level 1</div>
              </div>
            </div>
            <div className="text-2xl font-bold">+100 XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeEditor() {
  const navigate = useNavigate();
  const { themeId } = useParams();
  const challenge = challengesData.find((c) => c.id === themeId);

  useEffect(() => {
    if (!challenge) {
      navigate('/');
    }
  }, [challenge, navigate]);

  const [code, setCode] = useState(`def main(numbers):
    # Write your solution here
    pass
  `);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-code', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      console.log('Generated code response:', data);
      if (data.code) {
        setCode(data.code);
      }
    } catch (error) {
      console.error('Error generating code: ', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setTestResults([]);

    try {
      const response = await fetch('http://localhost:8000/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          testCases: challenge.testCases,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setTestResults((prev) => [...prev, data]);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults([
        {
          testCase: 1,
          status: 'error',
          message:
            'Failed to connect to Python server. Please make sure the server is running.',
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = () => {
    const allTestsPassed = testResults.every(
      (result) => result.status === 'success'
    );
    if (allTestsPassed) {
      setShowSuccessModal(true);
    }
  };

  const getPassingTestsCount = () => {
    return testResults.filter((result) => result.status === 'success').length;
  };

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {showSuccessModal && (
        <SuccessModal
          message="Congratulations! All tests passed! 🎉"
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-slate-800">Debug Master</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <Trophy className="w-5 h-5" />
              <span>スコア: 2,450</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* サイドバー */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              課題
            </h2>
            <div className="prose prose-sm text-slate-600">
              <p>{challenge.instructions}</p>
              <ul className="list-disc list-inside">
                <li>入力: 整数のリスト</li>
                <li>出力: 合計</li>
                <li>空のリストは0を返す</li>
              </ul>
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">テストケース例：</h3>
            <pre className="bg-slate-100 p-3 rounded text-sm font-mono whitespace-pre-wrap">
              {challenge.examples}
            </pre>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* プロンプト入力欄 */}
          <div className="p-4 bg-white border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              Step1：まずは、プロンプトを使ってAIにコードを書かせよう
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="AIへの指示を入力..."
              className="w-full p-2 border border-slate-300 rounded mt-2"
              rows={3}
            />
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                'コードを生成'
              )}
            </button>
          </div>

          {/* エディタ & テスト結果 */}
          <div className="flex-1 grid grid-cols-2 gap-0">
            {/* コードエディタ */}
            <div className="h-full flex flex-col">
              <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">main.py</span>
                </div>
              </div>
              <div className="flex-1 p-4 bg-slate-900">
                {/* ここでCodeMirrorを利用してPythonのシンタックスハイライトを実装 */}
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[python(), oneDark]}
                  onChange={(value) => setCode(value)}
                  className="w-full h-full font-mono text-sm bg-transparent text-slate-200 outline-none resize-none"
                />
              </div>
            </div>

            {/* テスト結果 */}
            <div className="h-full flex flex-col border-l border-slate-700">
              <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">テスト結果</span>
                </div>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-3 py-1 rounded ${
                    isRunning
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } text-sm transition`}
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      テスト実行
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1 p-4 bg-slate-900 font-mono text-sm overflow-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`mb-4 p-3 rounded ${
                      result.status === 'success' ? 'bg-green-950' : 'bg-red-950'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mt-1" />
                      )}
                      <div>
                        <div
                          className={`font-medium ${
                            result.status === 'success'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}
                        >
                          Test Case {result.testCase}
                        </div>
                        <div className="text-slate-300 mt-1">{result.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-slate-400">
                    コードが正しいかを確認するには「テスト実行」ボタンをクリックしてください。
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* フッターの提出ボタンなど */}
          <div className="bg-white border-t border-slate-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5" />
                ヒントを表示
              </button>
              <div className="flex items-center gap-4">
                {testResults.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span>
                      {getPassingTestsCount()}/{testResults.length} Tests Passing
                    </span>
                  </div>
                )}
                <button
                  onClick={handleSubmitSolution}
                  disabled={
                    testResults.length === 0 ||
                    getPassingTestsCount() !== testResults.length
                  }
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                    testResults.length === 0 ||
                    getPassingTestsCount() !== testResults.length
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } transition`}
                >
                  回答を提出する
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeEditor;
