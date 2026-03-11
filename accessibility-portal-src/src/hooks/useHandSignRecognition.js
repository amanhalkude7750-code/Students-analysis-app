import { useState, useEffect, useCallback, useRef } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// Map standard gestures to meaningful words for the MVP
const GESTURE_MAP = {
    "Thumb_Up": "YES",
    "Thumb_Down": "NO",
    "Victory": "PEACE",
    "Open_Palm": "HELLO",
    "Closed_Fist": "STOP",
    "Pointing_Up": "ONE",
    "ILoveYou": "I LOVE YOU"
};

export const useHandSignRecognition = (webcamRef) => {
    const [tokens, setTokens] = useState([]);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);

    // Refs for MediaPipe
    const gestureRecognizerRef = useRef(null);
    const requestRef = useRef(null);

    // 1. Load Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                });

                setIsModelLoading(false);
                console.log("MediaPipe Gesture Recognizer Loaded");
            } catch (error) {
                console.error("Error loading MediaPipe model:", error);
                setIsModelLoading(false); // Stop loading spinner even on error
            }
        };

        loadModel();

        return () => {
            // Cleanup if needed
        };
    }, []);

    const lastVideoTimeRef = useRef(-1);

    // 2. Detection Loop
    const detect = useCallback(() => {
        if (!gestureRecognizerRef.current || !webcamRef?.current?.video) {
            requestRef.current = requestAnimationFrame(detect);
            return;
        }

        const video = webcamRef.current.video;
        if (video.readyState !== 4) {
            requestRef.current = requestAnimationFrame(detect);
            return; // Video not ready
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            try {
                const nowInMs = performance.now();
                const results = gestureRecognizerRef.current.recognizeForVideo(video, nowInMs);

                if (results.gestures.length > 0) {
                    // results.gestures is an array of arrays (one per hand)
                    const primaryHand = results.gestures[0][0]; // Most confident gesture of first hand
                    const categoryName = primaryHand.categoryName;
                    const score = primaryHand.score;

                    if (score > 0.6 && categoryName !== "None") {
                        const mappedToken = GESTURE_MAP[categoryName] || categoryName;

                        // Debounce/Logic to prevent flooding (simple check for now)
                        setTokens(prev => {
                            const lastToken = prev[prev.length - 1];
                            // Only add if different from last token or if last token was significant time ago (>1s)
                            if (!lastToken || (lastToken.token !== mappedToken && Date.now() - lastToken.timestamp > 1000)) {
                                return [...prev, {
                                    token: mappedToken,
                                    confidence: score,
                                    timestamp: Date.now()
                                }];
                            }
                            return prev;
                        });
                    }
                }
            } catch (error) {
                // Ignore mediapipe timestamp errors
            }
        }

        requestRef.current = requestAnimationFrame(detect);
    }, [webcamRef]);

    // 3. Start/Stop Logic
    const startDetection = useCallback(() => {
        setCameraActive(true);
        if (!requestRef.current) {
            requestRef.current = requestAnimationFrame(detect);
        }
    }, [detect]);

    const stopDetection = useCallback(() => {
        setCameraActive(false);
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    }, []);

    // Auto-start detection when model is ready and camera is active (optional, controllable by UI)
    useEffect(() => {
        if (!isModelLoading && cameraActive) {
            startDetection();
        }
    }, [isModelLoading, cameraActive, startDetection]);


    // Legacy support for manual addition (simulation palette)
    const addToken = useCallback((token) => {
        setTokens(prev => [...prev, {
            token: token,
            confidence: 1.0,
            timestamp: Date.now()
        }]);
    }, []);

    const clearTokens = useCallback(() => setTokens([]), []);

    return {
        tokens,
        addToken,
        clearTokens,
        isModelLoading,
        startDetection,
        stopDetection,
        cameraActive
    };
};
