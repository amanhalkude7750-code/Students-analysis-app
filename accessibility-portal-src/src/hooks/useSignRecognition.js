```javascript
import { useState, useCallback } from 'react';

// Use a hook to manage the sign language recognition state
// Use a hook to manage the sign language recognition state
export const useSignRecognition = () => {
    const [tokens, setTokens] = useState([]);

    // This function would be connected to the MediaPipe logic eventually
    const addToken = useCallback((token) => {
        if (!token) return;
        
        const cleanToken = token.trim().toUpperCase();
        const timestamp = Date.now();
        // Simulate high confidence for demo (or vary it if needed)
        const confidence = 0.85 + (Math.random() * 0.14);

        setTokens((prev) => {
             // Create the token object
             const newToken = {
                token: cleanToken,
                timestamp: timestamp,
                confidence: parseFloat(confidence.toFixed(2))
            };
            return [...prev, newToken];
        });
    }, []);

    const clearTokens = useCallback(() => {
        setTokens([]);
    }, []);

    const removeLastToken = useCallback(() => {
        setTokens((prev) => prev.slice(0, -1));
    }, []);

    return {
        tokens,
        addToken,
        clearTokens,
        removeLastToken
    };
};
```
