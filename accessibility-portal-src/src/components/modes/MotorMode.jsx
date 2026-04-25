import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crosshair, Move } from 'lucide-react';
import { useHeadTracking } from '../../hooks/useHeadTracking';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import ModeAnalysis from '../shared/ModeAnalysis';
import { Target, Zap, Clock, UserCheck } from 'lucide-react';

const MotorMode = () => {
    const { cursor, isTracking, setIsTracking, gesture } = useHeadTracking();
    const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();
    const webcamRef = useRef(null);

    const [pendingAction, setPendingAction] = useState(null); // { type: 'NEXT', label: 'Go to Next Section?' }
    const [hudState, setHudState] = useState({ command: "WAITING...", gesture: "--", action: "--" });

    useEffect(() => {
        setIsTracking(true);
        startListening(true);
        return () => {
            setIsTracking(false);
            stopListening();
        };
    }, [setIsTracking, startListening, stopListening]);

    // DWELL CLICK STATE
    const [dwellProgress, setDwellProgress] = useState(0);
    const lastHoveredEl = useRef(null);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1; // Slightly faster for efficiency
            window.speechSynthesis.speak(utterance);
        }
    };

    // DWELL LOOP
    useEffect(() => {
        if (!isTracking) {
            setDwellProgress(0);
            return;
        }

        const interval = setInterval(() => {
            // 1. Get Element at Cursor
            const clickX = (cursor.x / 100) * window.innerWidth;
            const clickY = (cursor.y / 100) * window.innerHeight;

            // Standardize: Hide cursor temporarily to get element UNDER it, or use elementFromPoint directly if pointer-events:none is set on cursor
            // (Our cursor div has pointer-events-none, so it's fine)
            const el = document.elementFromPoint(clickX, clickY);

            // 2. Check Interactive
            // Heuristic: Is it a button, link, input, or has onClick/role
            const isInteractive = el && (
                el.tagName === 'BUTTON' ||
                el.tagName === 'A' ||
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.onclick != null ||
                window.getComputedStyle(el).cursor === 'pointer'
            );

            if (isInteractive) {
                if (el === lastHoveredEl.current) {
                    // Still hovering same element -> Increment
                    setDwellProgress(prev => {
                        if (prev >= 100) {
                            // TRIGGER CLICK
                            el.click();
                            el.focus();
                            speak("Clicked.");
                            setHudState(s => ({ ...s, action: "DWELL CLICK" }));

                            // Visual Ripple
                            const ripple = document.createElement("div");
                            ripple.style.position = "fixed";
                            ripple.style.left = `${clickX}px`;
                            ripple.style.top = `${clickY}px`;
                            ripple.style.width = "20px";
                            ripple.style.height = "20px";
                            ripple.style.background = "rgba(255, 0, 0, 0.8)";
                            ripple.style.borderRadius = "50%";
                            ripple.style.transform = "translate(-50%, -50%) scale(1)";
                            ripple.style.transition = "transform 0.3s, opacity 0.3s";
                            ripple.style.zIndex = "9999";
                            document.body.appendChild(ripple);
                            setTimeout(() => {
                                ripple.style.transform = "translate(-50%, -50%) scale(5)";
                                ripple.style.opacity = "0";
                            }, 10);
                            setTimeout(() => document.body.removeChild(ripple), 350);

                            lastHoveredEl.current = null; // Reset to prevent double click immediately
                            return 0;
                        }
                        return prev + 5; // Fill in ~1 second (20 * 50ms)
                    });
                } else {
                    // New element
                    lastHoveredEl.current = el;
                    setDwellProgress(0);
                }
            } else {
                // Not interactive
                lastHoveredEl.current = null;
                setDwellProgress(0);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isTracking, cursor]);


    // COMMAND PARSER
    useEffect(() => {
        if (!transcript) return;

        // Get last command
        const commandParts = transcript.trim().toUpperCase().split(" ");
        // Check for specific phrases
        const fullTranscript = transcript.trim().toUpperCase();

        let commandAction = "";

        if (fullTranscript.endsWith("SCROLL DOWN")) commandAction = "SCROLL_DOWN";
        else if (fullTranscript.endsWith("SCROLL UP")) commandAction = "SCROLL_UP";
        else if (fullTranscript.endsWith("NEXT")) commandAction = "NEXT";
        else if (fullTranscript.endsWith("READ")) commandAction = "READ";
        else if (fullTranscript.endsWith("STOP")) commandAction = "STOP";
        else if (fullTranscript.endsWith("CLICK")) commandAction = "CLICK"; // specific for 5C.2, but useful to add now
        else if (fullTranscript.endsWith("SELECT")) commandAction = "CLICK";

        if (commandAction) {
            console.log("Motor Command:", commandAction);
            setHudState(prev => ({ ...prev, command: commandAction }));
            handleCommand(commandAction);
        }

    }, [transcript]);

    // HANDS-FREE CONFIRMATION LOGIC
    useEffect(() => {
        if (gesture) {
            setHudState(prev => ({ ...prev, gesture: gesture }));
        }

        if (pendingAction && gesture) {
            if (gesture === "YES") {
                executeAction(pendingAction.type);
                setPendingAction(null);
            } else if (gesture === "NO") {
                setHudState(prev => ({ ...prev, action: "CANCELLED" }));
                speak("Action cancelled.");
                setPendingAction(null); // Cancel
            }
        }
    }, [pendingAction, gesture]);

    const handleCommand = (cmd) => {
        if (pendingAction) return; // Block new commands while confirming

        switch (cmd) {
            case "SCROLL_DOWN":
                window.scrollBy({ top: 300, behavior: 'smooth' });
                setHudState(prev => ({ ...prev, action: "SCROLLING DOWN" }));
                speak("Scrolling down");
                break;
            case "SCROLL_UP":
                window.scrollBy({ top: -300, behavior: 'smooth' });
                setHudState(prev => ({ ...prev, action: "SCROLLING UP" }));
                speak("Scrolling up");
                break;
            case "NEXT":
                // Simulate navigation or section switch
                // alert("Navigating to NEXT section (Simulated)");
                // Trigger Confirmation
                setHudState(prev => ({ ...prev, action: "WAITING CONFIRMATION" }));
                speak("Do you want to move to the next section?");
                setPendingAction({ type: 'NEXT', label: 'Move to Next Section?' });
                break;
            case "READ":
                // Simulate reading
                setHudState(prev => ({ ...prev, action: "READING CONTENT" }));
                speak("Reading content.");
                alert("Reading Content (Simulated)");
                break;
            case "CLICK":
            case "SELECT":
                // Real Hands-Free Click Logic
                setHudState(prev => ({ ...prev, action: "CLICKING" }));
                speak("Clicking.");
                console.log("Attempting CLICK at", cursor);

                // 1. Convert percentage to viewport coordinates
                const clickX = (cursor.x / 100) * window.innerWidth;
                const clickY = (cursor.y / 100) * window.innerHeight;

                // 2. Find element
                const el = document.elementFromPoint(clickX, clickY);

                if (el) {
                    console.log("Clicked Element:", el);

                    // Visual Flair: Show Click Ripple (Optional, simplified here)
                    const ripple = document.createElement("div");
                    ripple.style.position = "fixed";
                    ripple.style.left = `${clickX}px`;
                    ripple.style.top = `${clickY}px`;
                    ripple.style.width = "20px";
                    ripple.style.height = "20px";
                    ripple.style.background = "rgba(0, 255, 255, 0.8)";
                    ripple.style.borderRadius = "50%";
                    ripple.style.transform = "translate(-50%, -50%) scale(1)";
                    ripple.style.transition = "transform 0.3s, opacity 0.3s";
                    ripple.style.zIndex = "9999";
                    document.body.appendChild(ripple);

                    setTimeout(() => {
                        ripple.style.transform = "translate(-50%, -50%) scale(5)";
                        ripple.style.opacity = "0";
                    }, 10);
                    setTimeout(() => document.body.removeChild(ripple), 350);

                    // 3. Dispatch Click
                    el.click();

                    // Fallback for non-clickable elements (e.g., focus input)
                    el.focus();
                }
                break;
            default:
                break;
        }
    };

    const executeAction = (type) => {
        switch (type) {
            case 'NEXT':
                setHudState(prev => ({ ...prev, action: "MOVING TO NEXT SECTION" }));
                speak("Moving to next section.");
                alert("Confirmed: Navigating to NEXT section.");
                break;
            default:
                break;
        }
    };

    return (
        <div className="min-h-screen bg-white text-cyan-700 font-mono relative overflow-hidden cursor-none">
            {/* Background Grid - Pilot Aesthetic */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 180, 255, .1) 25%, rgba(0, 180, 255, .1) 26%, transparent 27%, transparent 74%, rgba(0, 180, 255, .1) 75%, rgba(0, 180, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 180, 255, .1) 25%, rgba(0, 180, 255, .1) 26%, transparent 27%, transparent 74%, rgba(0, 180, 255, .1) 75%, rgba(0, 180, 255, .1) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-white/80 backdrop-blur border-b border-cyan-100">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-cyan-600 hover:text-cyan-800 transition"
                >
                    <ArrowLeft size={24} />
                    <span className="uppercase tracking-widest text-sm font-bold">Abort / Back</span>
                </Link>
                <h1 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2 text-black">
                    <Move className="animate-pulse text-cyan-600" />
                    Pilot Interface
                </h1>
                <div className="flex gap-4 text-xs font-bold tracking-widest">
                    <span className={isTracking ? "text-cyan-600" : "text-gray-400"}>HEAD_TRACK: {isTracking ? "ON" : "OFF"}</span>
                    <span className={isListening ? "text-red-600" : "text-gray-400"}>VOICE_CMD: {isListening ? "ON" : "OFF"}</span>
                </div>
            </header>

            {/* Webcam Feed (HUD Style) */}
            <div className="fixed top-24 right-6 w-48 h-36 bg-gray-100 border-2 border-cyan-200 rounded-lg overflow-hidden z-40">
                <Webcam
                    ref={webcamRef}
                    className="w-full h-full object-cover grayscale"
                    mirrored={true}
                />
                <div className="absolute bottom-1 left-1 text-[10px] text-cyan-700 bg-white/50 px-1 font-bold">CAM_01</div>
            </div>

            {/* LIVE HUD FEEDBACK (Bottom Center) */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl z-40">
                <div className="bg-white/95 border-4 border-cyan-600 rounded-xl p-6 shadow-2xl flex justify-between items-center">
                    <div className="flex-1 text-center border-r border-cyan-100">
                        <h4 className="text-cyan-700 text-xs font-bold tracking-widest mb-2">VOICE COMMAND</h4>
                        <span className="text-2xl text-black font-black uppercase">{hudState.command}</span>
                    </div>
                    <div className="flex-1 text-center border-r border-cyan-100">
                        <h4 className="text-cyan-700 text-xs font-bold tracking-widest mb-2">GESTURE</h4>
                        <span className={`text-2xl font-black uppercase ${hudState.gesture === 'YES' ? 'text-green-600' : hudState.gesture === 'NO' ? 'text-red-600' : 'text-gray-400'}`}>
                            {hudState.gesture}
                        </span>
                    </div>
                    <div className="flex-[2] text-center pl-4">
                        <h4 className="text-cyan-700 text-xs font-bold tracking-widest mb-2">SYSTEM ACTION</h4>
                        <span className="text-3xl text-cyan-600 font-black uppercase">
                            {hudState.action}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Area (Scrollable to demonstrate control) */}
            <main className="pt-32 px-20 pb-40 max-w-4xl mx-auto z-10 relative">
                <h2 className="text-4xl font-bold mb-8 text-black">Hands-Free Control</h2>
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                    <p className="p-6 border border-cyan-100 rounded-lg bg-cyan-50/50 hover:bg-cyan-50 transition duration-300">
                        1. <strong className="text-cyan-700">Head Tracking:</strong> Build a "virtual cursor" that follows your head movement (simulated via mouse/face).
                    </p>
                    <p className="p-6 border border-cyan-100 rounded-lg bg-cyan-50/50 hover:bg-cyan-50 transition duration-300">
                        2. <strong className="text-cyan-700">Voice Clicking:</strong> Say "CLICK" or "SELECT" to activate the element under the cursor.
                    </p>
                    <p className="p-6 border border-cyan-100 rounded-lg bg-cyan-50/50 hover:bg-cyan-50 transition duration-300">
                        3. <strong className="text-cyan-700">Scroll Pilot:</strong> Move your head up/down to scroll content naturally.
                    </p>
                    <p className="p-6 border border-cyan-100 rounded-lg bg-cyan-50/50 hover:bg-cyan-50 transition duration-300">
                        This interface is designed for high-precision, hands-free operation. The HUD below confirms your every intent.
                    </p>
                </div>

                {/* Pilot Performance Analysis */}
                <div className="mt-12">
                    <ModeAnalysis 
                        modeName="Pilot Control Interface"
                        colorClass="border-cyan-500"
                        metrics={[
                            { label: "DWELL PRECISION", value: 88, unit: "%", progress: 88, icon: <Target className="text-cyan-600" size={14} /> },
                            { label: "GESTURE RELIABILITY", value: 94, unit: "%", progress: 94, icon: <Zap className="text-cyan-600" size={14} /> },
                            { label: "SYSTEM EFFICIENCY", value: 1.8, unit: "ops/m", progress: 70, icon: <Clock className="text-cyan-600" size={14} /> },
                            { label: "NEURAL SYNC", value: 76, unit: "%", progress: 76, icon: <UserCheck className="text-cyan-600" size={14} /> }
                        ]}
                    />
                </div>
            </main>

            {/* CONFIRMATION DIALOG (Head Gesture) */}
            {pendingAction && (
                <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white border-4 border-cyan-600 rounded-2xl p-12 text-center max-w-2xl transform scale-110 shadow-2xl">
                        <h3 className="text-3xl text-cyan-700 mb-6 uppercase tracking-widest font-black">Confirmation Required</h3>
                        <p className="text-5xl text-black font-bold mb-12 leading-tight">
                            {pendingAction.label}
                        </p>
                        <div className="flex justify-center gap-12">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-green-500 bg-green-900/50 flex items-center justify-center text-4xl animate-bounce">
                                    ↕️
                                </div>
                                <span className="text-green-400 font-bold tracking-widest uppercase">Nod to Confirm</span>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-red-500 bg-red-900/50 flex items-center justify-center text-4xl animate-pulse">
                                    ↔️
                                </div>
                                <span className="text-red-400 font-bold tracking-widest uppercase">Shake to Cancel</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GESTURE FEEDBACK OVERLAY */}
            {gesture && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                    <div className={`
                        px-12 py-6 rounded-2xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform scale-150 animate-in zoom-in duration-300
                        ${gesture === "YES" ? "bg-green-900/90 border-green-400 text-green-300" : "bg-red-900/90 border-red-400 text-red-300"}
                    `}>
                        <h2 className="text-6xl font-black uppercase tracking-widest">{gesture}</h2>
                        <p className="text-xl font-bold uppercase tracking-widest text-center mt-2">{gesture === "YES" ? "CONFIRMED" : "CANCELLED"}</p>
                    </div>
                </div>
            )}

            {/* THE PILOT CURSOR (The key Visual) */}
            <div
                className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
                style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            >
                <div className="relative">
                    {/* Dwell Progress Ring */}
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 -rotate-90">
                        <circle
                            cx="40" cy="40" r="36"
                            fill="transparent"
                            stroke="#00bcd4"
                            strokeWidth="4"
                            strokeDasharray="226"
                            strokeDashoffset={226 - (226 * dwellProgress) / 100}
                            className="transition-all duration-75 ease-linear opacity-80"
                        />
                    </svg>

                    <Crosshair size={48} className={`transition-colors duration-300 ${dwellProgress > 0 ? 'text-red-400 stroke-2' : 'text-cyan-400 stroke-[1.5]'}`} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_2px_rgba(255,0,0,0.8)]"></div>

                    {/* Radial Guides */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-cyan-500/30 rounded-full animate-ping"></div>
                </div>
            </div>

        </div>
    );
};

export default MotorMode;
