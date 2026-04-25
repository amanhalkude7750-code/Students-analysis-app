import React from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from useMode
import { MODES } from '../../constants/modes';
import { Ear, Eye, Activity, ArrowRight, Zap, Shield, Heart } from 'lucide-react';

const HomeMode = () => {
    const navigate = useNavigate(); // Replaces switchMode

    const goToMode = React.useCallback((mode) => {
        switch (mode) {
            case MODES.DEAF: navigate('/deaf/menu'); break;
            case MODES.BLIND: navigate('/blind'); break;
            case MODES.MOTOR: navigate('/motor'); break;
            default: navigate('/');
        }
    }, [navigate]);

    // AUDIO & KEYBOARD & VOICE ENTRY LOGIC
    React.useEffect(() => {
        const welcomeMessage = "Hello. I am Access AI. Tell me what you need, or press Space for Blind Mode.";

        const speak = (text) => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        };

        // Speak intro after a short delay to ensure browser allows it
        const introTimer = setTimeout(() => {
            speak(welcomeMessage);
        }, 800);

        const handleInteraction = () => {
            // Placeholder for any interaction-based audio unlocks if needed
        };

        const handleKeyDown = (e) => {
            handleInteraction();
            // Global Shortcuts
            switch (e.key) {
                case ' ': // Spacebar
                case 'Enter':
                    e.preventDefault();
                    speak("Starting Blind Mode.");
                    goToMode(MODES.BLIND);
                    break;
                case '1':
                case 'd': // Fallback shorthand
                case 'D':
                    speak("Starting Sign Language Mode.");
                    goToMode(MODES.DEAF);
                    break;
                case '2':
                case 'm':
                case 'M':
                    speak("Starting Motor Control.");
                    goToMode(MODES.MOTOR);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleInteraction);

        return () => {
            clearTimeout(introTimer);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleInteraction);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Stop talking if we leave the page
            }
        };
    }, [goToMode]);



    const ModeCard = ({ mode, title, subtitle, icon: Icon, colorClass, delay }) => (
        <button
            onClick={() => goToMode(mode)}
            className={`
                group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-500 hover:scale-105
                bg-black/5 backdrop-blur-lg border border-black/10 hover:border-black/20 hover:shadow-2xl
                flex flex-col justify-between h-[320px] w-full
                animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards
            `}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Background Gradient Blob */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20 ${colorClass}`}></div>

            <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-black/5 border border-black/10 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={32} className="text-black" />
                </div>
                <h2 className="text-3xl font-bold text-black mb-2 tracking-tight group-hover:translate-x-1 transition-transform">{title}</h2>
                <p className="text-gray-600 font-medium leading-relaxed">{subtitle}</p>
            </div>

            <div className="relative z-10 flex items-center justify-between mt-8 pt-6 border-t border-black/5">
                <span className="text-sm font-bold tracking-widest text-gray-400 uppercase group-hover:text-black transition-colors">Launch Mode</span>
                <span className="p-3 rounded-full bg-black/5 group-hover:bg-black text-black group-hover:text-white transition-all duration-300">
                    <ArrowRight size={20} />
                </span>
            </div>
        </button>
    );

    return (
        <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col min-h-screen justify-center">
                {/* Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 mb-8 animate-in fade-in zoom-in duration-700">
                        <Zap size={16} className="text-yellow-600 fill-yellow-600" />
                        <span className="text-sm font-bold text-gray-700 tracking-wide">ACCESS AI · HACKATHON BUILD</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-black mb-8 tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-600">
                        Bridge the gap.<br />
                        <span className="text-black">Empower everyone.</span>
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        An adaptive AI interface designed to break communication barriers.
                        Select your preferred mode to experience accessibility reimagined.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full px-4">
                    <ModeCard
                        mode={MODES.DEAF}
                        title="Sign Translate"
                        subtitle="Real-time two-way communication using AI hand tracking and gesture recognition."
                        icon={Ear}
                        colorClass="bg-blue-500"
                        delay={100}
                    />
                    <ModeCard
                        mode={MODES.BLIND}
                        title="Voice Navigator"
                        subtitle="Complete auditory interface with neuro-voice feedback and sonic spatial awareness."
                        icon={Eye}
                        colorClass="bg-green-500"
                        delay={200}
                    />
                    <ModeCard
                        mode={MODES.MOTOR}
                        title="Pilot Control"
                        subtitle="Hands-free navigation via head tracking and gaze interaction."
                        icon={Activity}
                        colorClass="bg-rose-500"
                        delay={300}
                    />
                </div>

                {/* Footer */}
                <footer className="mt-24 text-center border-t border-black/5 pt-8">
                    <p className="text-gray-500 flex items-center justify-center gap-2 text-sm font-medium">
                        Built with <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" /> for a More Inclusive World
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default HomeMode;
