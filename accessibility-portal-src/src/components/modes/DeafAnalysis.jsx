import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Target, Clock, Zap, TrendingUp, UserCheck, Award, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

const DeafAnalysis = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    const metrics = [
        { label: 'Sign Accuracy', value: 92, unit: '%', progress: 92, icon: <Target className="text-blue-600" size={16} />, trend: '+3%' },
        { label: 'Translation Speed', value: 1.2, unit: 's', progress: 85, icon: <Clock className="text-emerald-600" size={16} />, trend: '-0.3s' },
        { label: 'Engagement Score', value: 88, unit: '%', progress: 88, icon: <Zap className="text-amber-600" size={16} />, trend: '+5%' },
        { label: 'Vocabulary Mastered', value: 42, unit: 'words', progress: 60, icon: <UserCheck className="text-purple-600" size={16} />, trend: '+8' },
    ];

    const weeklyProgress = [
        { day: 'Mon', signs: 12, accuracy: 85 },
        { day: 'Tue', signs: 18, accuracy: 88 },
        { day: 'Wed', signs: 15, accuracy: 90 },
        { day: 'Thu', signs: 22, accuracy: 92 },
        { day: 'Fri', signs: 20, accuracy: 91 },
        { day: 'Sat', signs: 25, accuracy: 94 },
        { day: 'Sun', signs: 10, accuracy: 89 },
    ];

    const maxSigns = Math.max(...weeklyProgress.map(d => d.signs));

    const achievements = [
        { title: 'First 10 Signs', description: 'Learned your first 10 signs', earned: true, icon: '🎯' },
        { title: 'Speed Demon', description: 'Translate under 1 second', earned: true, icon: '⚡' },
        { title: '7-Day Streak', description: 'Practice 7 days in a row', earned: false, icon: '🔥' },
        { title: 'Perfect Score', description: '100% accuracy in a session', earned: false, icon: '💎' },
    ];

    const recentSessions = [
        { date: 'Today', signs: 25, accuracy: 94, duration: '12 min' },
        { date: 'Yesterday', signs: 20, accuracy: 91, duration: '15 min' },
        { date: '2 days ago', signs: 22, accuracy: 92, duration: '10 min' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <Link
                        to="/deaf/menu"
                        className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors group"
                    >
                        <span className="p-2 rounded-xl bg-gray-100 group-hover:bg-black/5 transition-colors">
                            <ArrowLeft size={20} />
                        </span>
                        <span className="text-sm font-semibold hidden sm:inline">Back</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2 justify-center">
                            <BarChart3 className="text-emerald-600" size={24} />
                            Performance Analysis
                        </h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Sign Language Learning Metrics</p>
                    </div>
                    <div className="w-[88px]"></div>
                </header>

                {/* Period Selector */}
                <div className="flex gap-2 mb-8 justify-center">
                    {['day', 'week', 'month'].map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${selectedPeriod === period
                                    ? 'bg-black text-white shadow-lg shadow-black/20'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className="bg-gray-50 rounded-2xl p-5 border border-black/5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {m.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{m.label}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${m.trend.startsWith('+') || m.trend.startsWith('-0') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {m.trend.startsWith('+') || m.trend.startsWith('-0') ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                    {m.trend}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-black">{m.value}</span>
                                <span className="text-xs font-bold text-gray-400">{m.unit}</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-black to-gray-700 rounded-full transition-all duration-1000"
                                    style={{ width: m.progress + '%', transitionDelay: `${i * 150}ms` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Weekly Progress Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-black/10 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Calendar size={18} className="text-blue-600" />
                                Weekly Activity
                            </h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Signs Practiced</span>
                        </div>
                        <div className="flex items-end gap-3 h-40">
                            {weeklyProgress.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-500">{d.signs}</span>
                                    <div className="w-full bg-gray-100 rounded-xl relative overflow-hidden" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-xl transition-all duration-700"
                                            style={{ height: `${(d.signs / maxSigns) * 100}%`, transitionDelay: `${i * 80}ms` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Award size={18} className="text-amber-500" />
                            Achievements
                        </h3>
                        <div className="flex flex-col gap-3">
                            {achievements.map((a, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${a.earned ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100 opacity-50'}`}
                                >
                                    <span className="text-2xl">{a.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-black truncate">{a.title}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{a.description}</p>
                                    </div>
                                    {a.earned && <span className="text-green-500 text-xs font-bold">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-emerald-600" />
                        Recent Sessions
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-black/5">
                                    <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Signs</th>
                                    <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</th>
                                    <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSessions.map((s, i) => (
                                    <tr key={i} className="border-b border-black/5 last:border-0">
                                        <td className="py-4 text-sm font-bold text-black">{s.date}</td>
                                        <td className="py-4 text-sm font-semibold text-gray-700">{s.signs} signs</td>
                                        <td className="py-4">
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${s.accuracy >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {s.accuracy}%
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-gray-500 font-medium">{s.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-black mb-1">AI Learning Recommendation</p>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Your accuracy has improved by 3% this week — excellent progress! Focus on complex multi-sign phrases 
                                to push your translation speed below 1 second. Consider practicing "Numbers & Expressions" module 
                                to expand your vocabulary from 42 to 60+ words.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeafAnalysis;
