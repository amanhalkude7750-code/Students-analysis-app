import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, BarChart3, Hand, Video, ArrowRight, Sparkles, Zap } from 'lucide-react';

const menuItems = [
    {
        id: 'lesson',
        title: 'Lesson',
        subtitle: 'Practice real-time sign-to-text translation with your camera and AI-powered detection.',
        icon: BookOpen,
        path: '/deaf',
        colorClass: 'bg-blue-500',
        gradient: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        tag: 'Core',
    },
    {
        id: 'analysis',
        title: 'Analysis',
        subtitle: 'View your performance metrics, accuracy trends, and AI-driven learning recommendations.',
        icon: BarChart3,
        path: '/deaf/analysis',
        colorClass: 'bg-emerald-500',
        gradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        tag: 'Insights',
    },
    {
        id: 'learn-signs',
        title: 'Learn Signs',
        subtitle: 'Interactive guided lessons to master essential signs step-by-step with instant AI feedback.',
        icon: Hand,
        path: '/deaf/learn',
        colorClass: 'bg-purple-500',
        gradient: 'from-purple-50 to-fuchsia-50',
        borderColor: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        tag: 'Learn',
    },
    {
        id: 'meeting',
        title: 'Meeting with Teacher',
        subtitle: 'Join a live video session with your teacher for real-time sign language practice and guidance.',
        icon: Video,
        path: '/deaf/meeting',
        colorClass: 'bg-rose-500',
        gradient: 'from-rose-50 to-pink-50',
        borderColor: 'border-rose-200',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        tag: 'Live',
    },
];

const SignLanguageMenu = () => {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden font-sans">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-400/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-400/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-300/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-6 py-8 max-w-5xl">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors duration-300 group"
                    >
                        <span className="p-2 rounded-xl bg-gray-100 group-hover:bg-black/5 transition-colors">
                            <ArrowLeft size={20} />
                        </span>
                        <span className="text-sm font-semibold hidden sm:inline">Back to Home</span>
                    </Link>

                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <Sparkles size={12} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sign Language Mode</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                            Choose Your Path
                        </h1>
                    </div>

                    <div className="w-[88px]"></div> {/* Spacer for centering */}
                </header>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`
                                    group relative overflow-hidden rounded-3xl p-7 
                                    bg-gradient-to-br ${item.gradient}
                                    border ${item.borderColor}
                                    hover:shadow-2xl hover:shadow-black/5 hover:scale-[1.02]
                                    transition-all duration-500 ease-out
                                    flex flex-col justify-between min-h-[220px]
                                    animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
                                `}
                                style={{ animationDelay: `${index * 100 + 100}ms`, animationDuration: '600ms' }}
                            >
                                {/* Background Gradient Blob */}
                                <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30 ${item.colorClass}`}></div>

                                {/* Tag Badge */}
                                <div className="absolute top-5 right-5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.iconBg} ${item.iconColor}`}>
                                        {item.tag}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${item.iconBg} group-hover:scale-110 transition-transform duration-500`}>
                                        <Icon size={26} className={item.iconColor} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-black mb-2 tracking-tight group-hover:translate-x-0.5 transition-transform">
                                        {item.title}
                                    </h2>
                                    <p className="text-gray-500 text-sm font-medium leading-relaxed pr-4">
                                        {item.subtitle}
                                    </p>
                                </div>

                                {/* Footer Arrow */}
                                <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-black/5">
                                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase group-hover:text-black transition-colors duration-300">
                                        Open
                                    </span>
                                    <span className={`p-2.5 rounded-full bg-white/80 group-hover:bg-black ${item.iconColor} group-hover:text-white transition-all duration-300 shadow-sm`}>
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center">
                    <p className="text-gray-400 text-xs font-medium flex items-center justify-center gap-2">
                        <Zap size={12} className="text-yellow-500" />
                        Powered by Access AI · Sign Language Module
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default SignLanguageMenu;
