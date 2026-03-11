import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, Mic, SkipBack, SkipForward } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const LESSON_CONTENT = [
    { id: 1, text: "Welcome to Voice Navigator. I am your guide. Say 'Next' to continue." },
    { id: 2, text: "Great. You can navigate this application entirely by voice." },
    { id: 3, text: "Say 'Back' to repeat the previous instruction." },
    { id: 4, text: "You can also access specialized modes for different needs." },
    { id: 5, text: "This concludes the tutorial. Happy navigating!" }
];

const BlindMode = () => {
    const [currentSection, setCurrentSection] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastCommand, setLastCommand] = useState(null);

    // Voice Recognition Hook
    const {
        isListening,
        transcript,
        resetTranscript,
        startListening
    } = useSpeechRecognition();

    // Initialize voice on mount
    useEffect(() => {
        startListening(true); // Continuous listening
        // Speak the first lesson on mount
        setTimeout(() => speak(LESSON_CONTENT[0].text), 1000);
    }, [startListening]);

    // Handle Voice Commands
    useEffect(() => {
        if (!transcript) return;

        const command = transcript.toLowerCase();

        if (command.includes('next') || command.includes('continue') || command.includes('go')) {
            handleNavigation('NEXT');
        } else if (command.includes('back') || command.includes('previous')) {
            handleNavigation('BACK');
        } else if (command.includes('replay') || command.includes('repeat')) {
            speak(LESSON_CONTENT[currentSection].text);
            resetTranscript();
        }
    }, [transcript, currentSection]);

    const handleNavigation = (direction) => {
        let nextSection = currentSection;

        if (direction === 'NEXT') {
            nextSection = Math.min(LESSON_CONTENT.length - 1, currentSection + 1);
        } else if (direction === 'BACK') {
            nextSection = Math.max(0, currentSection - 1);
        }

        if (nextSection !== currentSection) {
            setLastCommand(direction);
            setCurrentSection(nextSection);
            speak(LESSON_CONTENT[nextSection].text);
            resetTranscript();
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 flex flex-col font-mono">
            {/* Header - High Contrast */}
            <header className="flex items-center justify-between mb-8 border-b-2 border-black/10 pb-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-black hover:text-gray-600 transition uppercase font-bold tracking-widest"
                >
                    <ArrowLeft size={32} />
                    Back
                </Link>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Voice Navigator</h1>
                <div className="w-10"></div>
            </header>

            {/* Main Content Area - Large Typography */}
            <main className="flex-1 flex flex-col justify-center items-center text-center gap-12">

                {/* Audio Status Visualizer */}
                <div className={`
                    w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500
                    ${isListening ? 'border-red-600 shadow-red-200 shadow-2xl animate-pulse' : 'border-black/20'}
                    ${isPlaying ? 'scale-110' : 'scale-100'}
                `}>
                    {isPlaying ? <Volume2 size={80} className="animate-bounce" /> : <Mic size={80} className={isListening ? "text-red-600" : "text-gray-400"} />}
                </div>

                {/* Text Display (for sighted assistants/debug) */}
                <div className="max-w-2xl">
                    <h2 className="text-xl text-gray-500 mb-4 uppercase">Current Section ({currentSection + 1}/{LESSON_CONTENT.length})</h2>
                    <p className="text-4xl md:text-5xl font-bold text-black leading-relaxed">
                        {LESSON_CONTENT[currentSection].text}
                    </p>
                </div>

                {/* Feedback Log */}
                <div className="h-16 flex items-center justify-center">
                    {lastCommand && (
                        <span className="px-4 py-2 bg-black/5 border border-black/10 text-black rounded text-xl font-bold animate-in fade-in slide-in-from-bottom-4">
                            COMMAND RECOGNIZED: "{lastCommand}"
                        </span>
                    )}
                </div>
            </main>

            {/* Footer Controls (Large Touch Targets for Mouse Backup) */}
            <footer className="grid grid-cols-2 gap-4 mt-8">
                <button
                    onClick={() => {
                        const prev = Math.max(0, currentSection - 1);
                        setLastCommand("BACK");
                        setCurrentSection(prev);
                        speak(LESSON_CONTENT[prev].text);
                    }}
                    className="h-24 bg-gray-50 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 active:bg-black active:text-white border border-black/10 transition"
                    aria-label="Previous Section"
                >
                    <SkipBack size={32} />
                    <span className="mt-2 font-bold">BACK</span>
                </button>

                <button
                    onClick={() => {
                        const next = Math.min(LESSON_CONTENT.length - 1, currentSection + 1);
                        setLastCommand("NEXT");
                        setCurrentSection(next);
                        speak(LESSON_CONTENT[next].text);
                    }}
                    className="h-24 bg-gray-50 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 active:bg-black active:text-white border border-black/10 transition"
                    aria-label="Next Section"
                >
                    <SkipForward size={32} />
                    <span className="mt-2 font-bold">NEXT</span>
                </button>
            </footer>
        </div>
    );
};

export default BlindMode;
