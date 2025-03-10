import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, Bug, Trophy, BookOpen, MessageSquareWarning, ChevronRight, Timer, ThumbsUp, Send, Sparkles, Eye, Files, ChevronDown, FolderOpen, Terminal, PlayCircle, XCircle, CheckCircle, PartyPopper, SettingsIcon as Confetti } from 'lucide-react';

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
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
  const [code, setCode] = useState(`def solution(numbers):
    # Write your solution here
    # Calculate the sum of all numbers in the list
    pass`);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    testCase: number;
    status: string;
    message: string;
  }>>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const response = await fetch('http://localhost:8000/api/run-python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
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
              setTestResults(prev => [...prev, data]);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
        
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults([{
        testCase: 1,
        status: 'error',
        message: 'Failed to connect to Python server. Please make sure the server is running.'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = () => {
    const allTestsPassed = testResults.every(result => result.status === 'success');
    if (allTestsPassed) {
      setShowSuccessModal(true);
    }
  };

  const getPassingTestsCount = () => {
    return testResults.filter(result => result.status === 'success').length;
  };

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
            <span className="text-xl font-bold text-slate-800">Python Challenge</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <Trophy className="w-5 h-5" />
              <span>Score: 2,450</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Challenge Info
            </h2>
            <div className="prose prose-sm text-slate-600">
              <p>Write a function that calculates the sum of all numbers in a list.</p>
              <ul className="list-disc list-inside">
                <li>Input: List of integers</li>
                <li>Output: Sum of all numbers</li>
                <li>Empty list should return 0</li>
              </ul>
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Example:</h3>
            <pre className="bg-slate-100 p-3 rounded text-sm font-mono">
{`Input: [1, 2, 3]
Output: 6

Input: []
Output: 0`}
            </pre>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-0">
            <div className="h-full flex flex-col">
              <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">solution.py</span>
                </div>
              </div>
              <div className="flex-1 p-4 bg-slate-900">
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full font-mono text-sm bg-transparent text-slate-200 outline-none resize-none"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="h-full flex flex-col border-l border-slate-700">
              <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-200">Test Results</span>
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
                      Run Tests
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
                        <div className={`font-medium ${
                          result.status === 'success' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          Test Case {result.testCase}
                        </div>
                        <div className="text-slate-300 mt-1">
                          {result.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-slate-400">
                    Click "Run Tests" to check your solution
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5" />
                Get Hint
              </button>
              <div className="flex items-center gap-4">
                {testResults.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{getPassingTestsCount()}/{testResults.length} Tests Passing</span>
                  </div>
                )}
                <button 
                  onClick={handleSubmitSolution}
                  disabled={testResults.length === 0 || getPassingTestsCount() !== testResults.length}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                    testResults.length === 0 || getPassingTestsCount() !== testResults.length
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } transition`}
                >
                  Submit Solution
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