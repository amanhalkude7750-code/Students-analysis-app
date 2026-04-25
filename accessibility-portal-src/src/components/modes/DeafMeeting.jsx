import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, Mic, MicOff, PhoneOff, Settings, Users, MessageSquare, Hand, Sparkles } from 'lucide-react';
import Webcam from 'react-webcam';

const DeafMeeting = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isConnecting, setIsConnecting] = useState(true);

    // Simulate connecting state
    React.useEffect(() => {
        const timer = setTimeout(() => setIsConnecting(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 font-sans flex flex-col h-screen">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
                <Link
                    to="/deaf/menu"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                        <ArrowLeft size={18} />
                    </span>
                    <span className="text-sm font-semibold hidden sm:inline">Leave Room</span>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">
                            YOU
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">
                            MR
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-sm font-bold">1:1 Practice Session</span>
                        <span className="text-emerald-400 text-[10px] font-bold tracking-wider">04:23 • ENCRYPTED</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
                {/* Main Video Area (Teacher) */}
                <div className="flex-1 bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden relative group">
                    {isConnecting ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-white font-medium">Connecting to teacher...</p>
                        </div>
                    ) : (
                        <>
                            {/* Placeholder for Teacher Video - using a static gradient or image */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 flex flex-col items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-5xl text-white font-black mb-4 shadow-2xl">
                                    MR
                                </div>
                                <h3 className="text-2xl font-bold text-white">Mr. Roberts</h3>
                                <p className="text-emerald-400 text-sm font-medium">Teacher • Speaking</p>
                            </div>

                            {/* Captions Overlay */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl bg-black/60 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 transition-opacity opacity-100">
                                <p className="text-white text-lg font-medium">
                                    "Let's practice the numbers 1 through 10. Start whenever you're ready."
                                </p>
                            </div>
                        </>
                    )}

                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-2">
                        <Video size={14} className="text-emerald-400" />
                        Teacher Camera
                    </div>
                </div>

                {/* Sidebar (Self View & Chat) */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    {/* Self View */}
                    <div className="h-64 bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden relative">
                        {isVideoOn ? (
                            <Webcam
                                className="absolute inset-0 w-full h-full object-cover"
                                mirrored={true}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-bold">
                                    YOU
                                </div>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[10px] font-bold">
                            You
                        </div>
                        
                        {/* Live AI Sign Detection Overlay */}
                        {isVideoOn && (
                            <div className="absolute bottom-3 right-3 bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-400/30 flex items-center gap-2 shadow-lg animate-pulse">
                                <Hand size={14} className="text-white" />
                                <span className="text-white text-xs font-bold">AI Active</span>
                            </div>
                        )}
                    </div>

                    {/* Live Translation / Chat box */}
                    <div className="flex-1 bg-gray-900 rounded-3xl border border-gray-800 p-4 flex flex-col">
                        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-400" />
                            Live Translation
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
                            <div className="bg-gray-800/50 rounded-2xl rounded-tl-sm p-3 max-w-[85%] self-start border border-gray-700">
                                <span className="text-emerald-400 text-[10px] font-bold block mb-1">Teacher</span>
                                <p className="text-gray-300 text-sm">Hello! How are you doing today?</p>
                            </div>
                            
                            <div className="bg-blue-900/30 rounded-2xl rounded-tr-sm p-3 max-w-[85%] self-end border border-blue-800/50">
                                <span className="text-blue-400 text-[10px] font-bold block mb-1 flex items-center justify-end gap-1">
                                    <Hand size={10} /> Signed
                                </span>
                                <p className="text-gray-200 text-sm">I am doing well, thank you.</p>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-2xl rounded-tl-sm p-3 max-w-[85%] self-start border border-gray-700">
                                <span className="text-emerald-400 text-[10px] font-bold block mb-1">Teacher</span>
                                <p className="text-gray-300 text-sm">Let's practice the numbers 1 through 10. Start whenever you're ready.</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="bg-gray-800 rounded-xl p-2 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Type a message..." 
                                    className="bg-transparent border-none outline-none text-white text-sm w-full px-2 placeholder:text-gray-500"
                                />
                                <button className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                                    <MessageSquare size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-900 p-4 border-t border-gray-800 flex justify-center items-center gap-4">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                
                <button 
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-4 rounded-full transition-all ${!isVideoOn ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    <Video size={24} />
                </button>

                <Link 
                    to="/deaf/menu"
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-500 transition-all hover:scale-105 shadow-lg shadow-red-900/50 ml-4 px-8 flex items-center gap-2 font-bold"
                >
                    <PhoneOff size={20} />
                    <span>End Call</span>
                </Link>
            </div>
        </div>
    );
};

export default DeafMeeting;
