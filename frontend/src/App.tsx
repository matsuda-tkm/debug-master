import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Bug, Trophy, Code2, BookOpen, MessageSquareWarning, ChevronRight, Timer, ThumbsUp, Send, Sparkles, Layout, Eye, Files, ChevronDown, FolderOpen, Terminal, PlayCircle, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import ChallengeEditor from './ChallengeEditor';

function ThemeSelection() {
    const navigate = useNavigate();
    const themes = [
        {
            id: 'array-manipulation',
            title: 'Array Manipulation',
            description: 'Fix common bugs in array operations like sorting, filtering, and mapping.',
            difficulty: 'Easy',
            image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=2728&ixlib=rb-4.0.3',
            languages: ['JavaScript', 'Python', 'Java']
        },
        {
            id: 'react-hooks',
            title: 'React Hooks',
            description: 'Debug issues with useEffect, useState, and other React hooks.',
            difficulty: 'Medium',
            image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
            languages: ['React', 'TypeScript']
        },
        {
            id: 'api-integration',
            title: 'API Integration',
            description: 'Fix bugs in API calls, error handling, and data processing.',
            difficulty: 'Hard',
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=2668&ixlib=rb-4.0.3',
            languages: ['Node.js', 'Python']
        },
        {
            id: 'state-management',
            title: 'State Management',
            description: 'Debug complex state management issues in frontend applications.',
            difficulty: 'Medium',
            image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=2667&ixlib=rb-4.0.3',
            languages: ['React', 'Vue.js']
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
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
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Choose Your Challenge</h1>
                    <p className="text-slate-600 mb-8">Select a theme to start debugging and improve your skills.</p>

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