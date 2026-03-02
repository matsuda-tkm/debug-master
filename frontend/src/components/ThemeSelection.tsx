import { ArrowRight, Bug, Heart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challengeService';
import { Challenge } from '../types/challenge';

function ThemeSelection() {
    const navigate = useNavigate();
    const [themes, setThemes] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChallenges = async () => {
            try {
                const data = await challengeService.getAllChallenges();
                setThemes(data);
            } catch (error) {
                console.error('Failed to load challenges:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChallenges();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative overflow-hidden">
            {/* Floating character */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="relative">
                    <img 
                        src="/images/fight-character.png" 
                        alt="プログラミング助手" 
                        className="w-20 h-20 object-contain animate-bounce transition-transform duration-300"
                        style={{animationDuration: '3s'}}
                    />
                    <div className="absolute -top-2 -right-2">
                        <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white px-3 py-1 rounded-full shadow-lg border-2 border-pink-200 text-xs font-bold text-pink-600 whitespace-nowrap animate-pulse">
                            一緒にがんばろう！
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="fixed top-20 left-10 animate-pulse">
                <Star className="w-8 h-8 text-yellow-400 opacity-60" />
            </div>
            <div className="fixed top-40 right-20 animate-pulse" style={{animationDelay: '1s'}}>
                <Star className="w-6 h-6 text-pink-400 opacity-60" />
            </div>
            <div className="fixed bottom-40 left-20 animate-pulse" style={{animationDelay: '2s'}}>
                <Star className="w-10 h-10 text-purple-400 opacity-60" />
            </div>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Bug className="w-8 h-8 text-purple-600" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">DebugMaster</span>
                        <div className="flex items-center gap-1 ml-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium text-purple-600">みんなで楽しく学ぼう！</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-purple-700 font-medium">ミッションを読み込み中...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">🕵️‍♀️ ミッションを選ぼう！ 🕵️‍♂️</h1>
                                <p className="text-lg text-purple-700 font-medium">君の挑戦したいプログラミングミッションを選んでね！</p>
                                <div className="flex justify-center items-center gap-2 mt-2">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    <span className="text-purple-600 font-medium">レベルアップして探偵マスターを目指そう</span>
                                    <Star className="w-5 h-5 text-yellow-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden hover:shadow-xl hover:border-pink-300 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                                        onClick={() => navigate(`/challenge/${theme.id}`)}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={theme.image}
                                                alt={theme.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform group-hover:scale-110 transition-transform">
                                                ⭐ {theme.difficulty}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-purple-800 mb-2 flex items-center justify-between">
                                                {theme.title}
                                                <ArrowRight className="w-6 h-6 text-pink-500 group-hover:text-purple-600 group-hover:translate-x-2 transition-all duration-300" />
                                            </h3>
                                            <p className="text-purple-700 mb-4 font-medium">{theme.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {theme.languages.map((lang) => (
                                                    <span
                                                        key={lang}
                                                        className="px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm"
                                                    >
                                                        {lang}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ThemeSelection;
