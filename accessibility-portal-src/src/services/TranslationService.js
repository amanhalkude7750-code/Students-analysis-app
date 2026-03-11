/**
 * Service to handle Sign Language Token -> Fluent Sentence translation.
 * 
 * In a production environment, this would call a LLM API (Gemini/OpenAI).
 * For the Hackathon/MVP, we use extensive pattern matching and mock responses
 * to demonstrate the "Translation" vs "Chatbot" philosophy.
 */

// Simulated Mock Dictionary for Demo
const MOCK_ORACLE = [
    {
        pattern: ["ME", "WATER", "WANT"],
        response: "Excuse me, could I please have some water?"
    },
    {
        pattern: ["HELP", "ME"],
        response: "I need assistance, could you help me?"
    },
    {
        pattern: ["HELLO", "ME", "DEAF"],
        response: "Hello, I am deaf and I use sign language."
    },
    {
        pattern: ["THANK YOU"],
        response: "Thank you very much."
    },
    {
        pattern: ["ME", "LOST", "WHERE", "EXIT"],
        response: "I am lost, could you tell me where the exit is?"
    }
];

const API_URL = "http://localhost:5000/api/translate";
const DEMO_MODE = true; // Set to true to avoid network errors during frontend-only development

export const reconstructSentence = async (tokens) => {
    // Simulate network latency (visible UI feedback)
    // await new Promise(resolve => setTimeout(resolve, 300));

    if (!tokens || tokens.length === 0) {
        return "Waiting for input...";
    }

    // Extract raw string tokens
    const rawTokens = tokens.map(t => t.token);

    if (DEMO_MODE) {
        console.log("Demo Mode: Skipping Backend API, using Mock Oracle");
        return getMockResponse(rawTokens);
    }

    try {
        console.log("Calling Backend API with:", rawTokens);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tokens: rawTokens }),
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Backend Response:", data.response);
        return data.response;

    } catch (error) {
        console.warn("Backend API Failed, using Mock Fallback:", error.message);
        return getMockResponse(rawTokens);
    }
};

// Helper for Mock Logic
const getMockResponse = (rawTokens) => {
    // 1. Exact Match Search
    const exactMatch = MOCK_ORACLE.find(entry =>
        JSON.stringify(entry.pattern) === JSON.stringify(rawTokens)
    );
    if (exactMatch) return exactMatch.response + " (Offline Mode)";

    // 2. Subset/Keyword Match (Heuristic Fallback)
    if (rawTokens.includes("WATER") && (rawTokens.includes("ME") || rawTokens.includes("WANT"))) {
        return "Excuse me, I would like some water. (Offline Mode)";
    }
    if (rawTokens.includes("HELP")) {
        return "I need some help please. (Offline Mode)";
    }
    if (rawTokens.includes("HELLO")) {
        return "Hello there! (Offline Mode)";
    }

    return `(Literal Translation - Offline): ${rawTokens.join(" ")}`;
};
