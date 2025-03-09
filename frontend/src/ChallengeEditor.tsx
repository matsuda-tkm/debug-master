import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, Bug, Trophy, BookOpen, MessageSquareWarning, ChevronRight, Timer, ThumbsUp, Sparkles, Eye, Files, FolderOpen, Terminal, PlayCircle, XCircle, CheckCircle, PartyPopper, SettingsIcon as Confetti } from 'lucide-react';

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 relative overflow-hidden">
                {/* Confetti Animation */}
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

                {/* Achievement Banner */}
                <div className="mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8" />
                            <div>
                                <div className="font-medium">Achievement Unlocked!</div>
                                <div className="text-sm opacity-90">Bug Squasher Level 1</div>
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
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
    const [selectedLanguage, setSelectedLanguage] = useState('nodejs');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [selectedFile, setSelectedFile] = useState('index.js');
    const [consoleOutput, setConsoleOutput] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [testResults, setTestResults] = useState([
        { name: 'Test empty array', status: 'success', message: 'Expected: 0, Received: 0' },
        { name: 'Test single element', status: 'success', message: 'Expected: 5, Received: 5' },
        { name: 'Test multiple elements', status: 'error', message: 'Expected: 15, Received: 20' },
    ]);

    const languages = {
        nodejs: { type: 'backend', label: 'Node.js' },
        python: { type: 'backend', label: 'Python' },
        react: { type: 'frontend', label: 'React' },
        html: { type: 'frontend', label: 'HTML/CSS' },
        vue: { type: 'frontend', label: 'Vue.js' },
    };

    const [files, setFiles] = useState({
        'index.js': `function calculateSum(numbers) {
  // Bug: Incorrect initialization of sum variable
  let sum;
  
  for (const num of numbers) {
    sum += num;
  }
  
  return sum;
}

module.exports = { calculateSum };`,
        'test.js': `const { calculateSum } = require('./index.js');

describe('calculateSum', () => {
  test('should handle empty array', () => {
    expect(calculateSum([])).toBe(0);
  });

  test('should handle single element', () => {
    expect(calculateSum([5])).toBe(5);
  });

  test('should handle multiple elements', () => {
    expect(calculateSum([2, 5, 8])).toBe(15);
  });
});`,
    });

    const handleGenerateCode = async () => {
        setIsGenerating(true);
        setGeneratedCode('');
        setShowSuccess(false);

        try {
            const response = await fetch('http://localhost:8000/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    language: selectedLanguage,
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
                            setGeneratedCode(prev => prev + data.content);
                        } catch (e) {
                            console.error('Failed to parse SSE data:', e);
                        }
                    }
                }

                buffer = lines[lines.length - 1];
            }

            setShowSuccess(true);
            setSuccessMessage('Code generated successfully! 🎉');
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error generating code:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRunCode = () => {
        setConsoleOutput('> Running tests...\n✓ Test empty array passed\n✓ Test single element passed\n× Test multiple elements failed\n  Expected: 15\n  Received: 20');
    };

    const handleSubmitSolution = () => {
        setShowSuccessModal(true);
    };

    useEffect(() => {
        if (languages[selectedLanguage].type === 'frontend') {
            const combinedHtml = files['index.html']?.replace(
                '</head>',
                `<style>${files['styles.css'] || ''}</style></head>`
            );
            setPreviewHtml(combinedHtml);
        }
    }, [files, selectedLanguage]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down z-50">
                    <PartyPopper className="w-5 h-5" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <SuccessModal
                    message="Congratulations! 🎉"
                    onClose={() => setShowSuccessModal(false)}
                />
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bug className="w-6 h-6 text-indigo-600" />
                        <span className="text-xl font-bold text-slate-800">BugFix Challenge</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-slate-600">
                            <Trophy className="w-5 h-5" />
                            <span>Score: 2,450</span>
                        </div>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                            Sign In
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    {/* Challenge Info */}
                    <div className="p-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Challenge Settings
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-slate-600">Language</label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full bg-slate-100 px-3 py-2 rounded-lg text-sm"
                                >
                                    {Object.entries(languages).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-600">Difficulty</label>
                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="w-full bg-slate-100 px-3 py-2 rounded-lg text-sm"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* File Explorer */}
                    <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <Files className="w-4 h-4 text-indigo-600" />
                                Files
                            </h2>
                            <button className="text-xs text-slate-500 hover:text-slate-700">
                                <FolderOpen className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {Object.keys(files).map((filename) => (
                                <button
                                    key={filename}
                                    onClick={() => setSelectedFile(filename)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${selectedFile === filename
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <Code2 className="w-4 h-4" />
                                    {filename}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-medium text-slate-800">24/50</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '48%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col">
                    {/* Challenge Description */}
                    <div className="bg-white border-b border-slate-200 p-6">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
                                {languages[selectedLanguage].type === 'frontend' ? 'Fix React Component Bug' : 'Array Sum Calculator'}
                            </h1>
                            <p className="text-slate-600 mb-4">
                                {languages[selectedLanguage].type === 'frontend'
                                    ? 'Fix the bug in the React component that causes incorrect rendering behavior.'
                                    : 'Fix the bug in the function that calculates the sum of all numbers in an array.'}
                            </p>

                            {/* AI Prompt Interface */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder={`Write a ${languages[selectedLanguage].label} function...`}
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleGenerateCode}
                                    disabled={isGenerating}
                                    className={`px-6 py-2 rounded-lg flex items-center gap-2 ${isGenerating
                                            ? 'bg-slate-100 text-slate-400'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        } transition`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Code
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Editor and Console/Preview */}
                    <div className="flex-1 grid grid-cols-2 gap-0 bg-slate-100">
                        {/* Code Editor */}
                        <div className="h-full flex flex-col">
                            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Code2 className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-200">{selectedFile}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Timer className="w-5 h-5 text-slate-400" />
                                    <span className="text-slate-200">29:45</span>
                                </div>
                            </div>
                            <div className="flex-1 p-4 bg-white">
                                <textarea
                                    value={generatedCode || files[selectedFile]}
                                    onChange={(e) => setFiles({ ...files, [selectedFile]: e.target.value })}
                                    className="w-full h-full font-mono text-sm bg-transparent outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Console/Preview Panel */}
                        <div className="h-full flex flex-col border-l border-slate-200">
                            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {languages[selectedLanguage].type === 'frontend' ? (
                                        <>
                                            <Eye className="w-5 h-5 text-slate-400" />
                                            <span className="text-slate-200">Preview</span>
                                        </>
                                    ) : (
                                        <>
                                            <Terminal className="w-5 h-5 text-slate-400" />
                                            <span className="text-slate-200">Console Output</span>
                                        </>
                                    )}
                                </div>
                                {languages[selectedLanguage].type === 'backend' && (
                                    <button
                                        onClick={handleRunCode}
                                        className="flex items-center gap-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm transition"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        Run
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                {languages[selectedLanguage].type === 'frontend' ? (
                                    <div className="h-full bg-white">
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-full border-0"
                                            title="Preview"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 p-4 bg-slate-900 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-auto">
                                            {consoleOutput}
                                        </div>
                                        <div className="border-t border-slate-700">
                                            <div className="p-4 bg-slate-800">
                                                <h3 className="text-sm font-medium text-slate-200 mb-3">Test Results</h3>
                                                <div className="space-y-2">
                                                    {testResults.map((test, index) => (
                                                        <div key={index} className="flex items-start gap-2 text-sm">
                                                            {test.status === 'success' ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500 mt-1" />
                                                            )}
                                                            <div>
                                                                <div className={`font-medium ${test.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {test.name}
                                                                </div>
                                                                <div className="text-slate-400 text-xs">
                                                                    {test.message}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="bg-white border-t border-slate-200 p-4">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition flex items-center gap-2">
                                <MessageSquareWarning className="w-5 h-5" />
                                Get Hint
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>2/3 Tests Passing</span>
                                </div>
                                <button
                                    onClick={handleSubmitSolution}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
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