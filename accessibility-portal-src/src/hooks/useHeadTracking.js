import { useState, useEffect, useCallback, useRef } from 'react';

export const useHeadTracking = () => {
    // x, y coordinates in percentage (0-100)
    const [cursor, setCursor] = useState({ x: 50, y: 50 });
    const [isTracking, setIsTracking] = useState(false);
    const [gesture, setGesture] = useState(null); // 'YES', 'NO', or null

    // History buffer for gesture detection
    const historyRef = useRef([]);

    const detectGesture = (history) => {
        if (history.length < 10) return null;

        // Extract recent movements
        const recent = history.slice(-20); // Last 20 frames (~300-500ms)
        const xValues = recent.map(p => p.x);
        const yValues = recent.map(p => p.y);

        // Calculate variance/range
        const xRange = Math.max(...xValues) - Math.min(...xValues);
        const yRange = Math.max(...yValues) - Math.min(...yValues);

        // Thresholds
        const SHAKE_THRESHOLD = 15; // 15% screen width
        const NOD_THRESHOLD = 15;   // 15% screen height

        // Simple Heuristic: 
        // Shake = High X variance, Low Y variance
        if (xRange > SHAKE_THRESHOLD && yRange < (xRange * 0.5)) {
            return "NO";
        }
        // Nod = High Y variance, Low X variance
        if (yRange > NOD_THRESHOLD && xRange < (yRange * 0.5)) {
            return "YES";
        }

        return null;
    };

    // Mock simulation for now - in a real app, this parses MediaPipe FaceMesh data
    // to map nose tip position to screen coordinates.
    const moveCursor = useCallback((dx, dy) => {
        setCursor(prev => ({
            x: Math.min(100, Math.max(0, prev.x + dx)),
            y: Math.min(100, Math.max(0, prev.y + dy))
        }));
    }, []);

    // For the MVP demo, we can simulate "Head Movement" via keyboard arrows 
    // OR just use mouse position as a proxy for "Head Gaze" to demonstrate the UI concept.
    // Let's use Mouse Proxy for the most fluid "Pilot" demo feeling if webcam isn't fully wired yet.
    useEffect(() => {
        if (!isTracking) return;

        const handleMouseMove = (e) => {
            // Map mouse to Pilot Cursor (Visualizing how head tracking would look)
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;

            setCursor({ x, y });

            // Update History
            historyRef.current.push({ x, y, t: Date.now() });
            if (historyRef.current.length > 50) historyRef.current.shift();

            // Detect Gesture
            const detected = detectGesture(historyRef.current);
            if (detected) {
                setGesture(detected);
                // Clear gesture after a moment to avoid sticky state
                setTimeout(() => setGesture(null), 1500);
                // Clear history to prevent double detection
                historyRef.current = [];
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isTracking]);

    return {
        cursor,
        isTracking,
        setIsTracking,
        moveCursor,
        gesture
    };
};
