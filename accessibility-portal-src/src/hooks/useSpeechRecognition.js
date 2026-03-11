
import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const isContinuousRef = useRef(false);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError("Browser does not support Speech Recognition.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false; // We handle continuity manually
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => setIsListening(true);

        recognitionInstance.onend = () => {
            setIsListening(false);
            // Check ref to see if we should restart
            if (isContinuousRef.current) {
                setTimeout(() => {
                    if (isContinuousRef.current) {
                        try {
                            recognitionInstance.start();
                        } catch (e) {
                            // ignore
                        }
                    }
                }, 250); // Add delay to prevent max-call-stack/browser freezing
            }
        };

        recognitionInstance.onresult = (event) => {
            const currentTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setTranscript(currentTranscript);
        };

        recognitionInstance.onerror = (event) => {
            if (event.error === 'no-speech' || event.error === 'aborted') {
                // Ignore these common non-critical errors
                return;
            }
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isContinuousRef.current = false; // Stop continuous retry if permission denied
            }
            console.error("Speech Recognition Error:", event.error);
            setError(`Error: ${event.error}`);
            setIsListening(false);
        };

        recognitionRef.current = recognitionInstance;

        return () => {
            recognitionInstance.stop();
            recognitionRef.current = null;
        };
    }, []);

    const startListening = useCallback((continuous = false) => {
        setTranscript('');
        setError(null);
        isContinuousRef.current = continuous;

        if (recognitionRef.current) {
            try {
                // simple check to avoid error if already started
                recognitionRef.current.start();
            } catch (e) {
                // ignore if already started
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        isContinuousRef.current = false; // Kill the auto-restart loop
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        transcript,
        resetTranscript,
        isListening,
        error,
        startListening,
        stopListening,
        hasSupport: !!recognitionRef.current || ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)
    };
};
