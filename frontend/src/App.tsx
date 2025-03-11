import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Bug, Trophy, Code2, BookOpen, MessageSquareWarning, ChevronRight, Timer, ThumbsUp, Send, Sparkles, Layout, Eye, Files, ChevronDown, FolderOpen, Terminal, PlayCircle, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import ChallengeEditor from './ChallengeEditor';

function ThemeSelection() {
    const navigate = useNavigate();
    const themes = [
        {
            'id': 'list-manipulation',
            'title': 'リスト操作',
            'description': 'ソート、フィルタリング、内包表記などのリスト操作における一般的なバグを修正します。',
            'difficulty': '簡単',
            'image': 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=2728&ixlib=rb-4.0.3',
            'languages': ['Python']
        },
        {
            'id': 'dictionary-handling',
            'title': '辞書操作',
            'description': 'キーの存在確認、値の更新、辞書の反復処理など、辞書操作に関する問題をデバッグします。',
            'difficulty': '中級',
            'image': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
            'languages': ['Python']
        },
        {
            'id': 'api-integration-python',
            'title': 'API統合 (Python)',
            'description': 'requestsライブラリを使用したAPI呼び出し、エラー処理、JSONデータの処理のバグを修正します。',
            'difficulty': '難しい',
            'image': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2668&ixlib=rb-4.0.3',
            'languages': ['Python']
        },
        {
            'id': 'file-handling',
            'title': 'ファイル操作',
            'description': 'ファイルの読み書き、例外処理、with文の使い方など、ファイル操作に関する問題をデバッグします。',
            'difficulty': '中級',
            'image': 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=2667&ixlib=rb-4.0.3',
            'languages': ['Python']
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
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
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                            Sign In
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">課題を選択</h1>
                    <p className="text-slate-600 mb-8">取り組みたい課題テーマを選択してください。</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {themes.map((theme) => (
                            <div
                                key={theme.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition group cursor-pointer"
                                onClick={() => navigate(`/challenge/${theme.id}`)}
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={theme.image}
                                        alt={theme.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                                        {theme.difficulty}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2 flex items-center justify-between">
                                        {theme.title}
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </h3>
                                    <p className="text-slate-600 mb-4">{theme.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {theme.languages.map((lang) => (
                                            <span
                                                key={lang}
                                                className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
                                            >
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function App() {

    useEffect(() => {
        (async () => {
            const res = await fetch('http://localhost:8000/api/health');
            const data = await res.json();
            console.log(data);
        })();
    }, []);

    return (
        <Routes>
            <Route path="/" element={<ThemeSelection />} />
            <Route path="/challenge/:themeId" element={<ChallengeEditor />} />
        </Routes>
    );
}

export default App;