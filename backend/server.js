const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load mock raw events securely
const eventsPath = path.join(__dirname, '../database', 'raw_events_data.json');
let rawEvents = [];

const analyticsDbPath = path.join(__dirname, '../database', 'analytics_db.json');
let analyticsData = {};

try {
    const data = fs.readFileSync(eventsPath, 'utf8');
    rawEvents = JSON.parse(data);
    console.log(`Loaded ${rawEvents.length} learning events.`);

    if (fs.existsSync(analyticsDbPath)) {
        analyticsData = JSON.parse(fs.readFileSync(analyticsDbPath, 'utf8'));
        console.log(`Loaded AI Analytics Data (${analyticsData.mlDataset.length} students).`);
    }
} catch (err) {
    console.error('Failed to load events. Run data_generator.js first.', err);
}

// -----------------------------------------------------
// TASK 1.1 - API Endpoints for Raw Learning Events
// -----------------------------------------------------

/**
 * @route GET /api/v1/analytics
 * @desc Get all ML generated analytics data
 */
app.get('/api/v1/analytics', (req, res) => {
    res.json({
        success: true,
        data: analyticsData
    });
});

/**
 * @route GET /api/v1/events
 * @desc Get all raw learning events with pagination
 */
app.get('/api/v1/events', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const results = rawEvents.slice(startIndex, endIndex);

    res.json({
        success: true,
        count: results.length,
        total: rawEvents.length,
        page,
        limit,
        data: results
    });
});

/**
 * @route GET /api/v1/events/:student_id
 * @desc Get raw events filtered by specific student_id
 */
app.get('/api/v1/events/student/:student_id', (req, res) => {
    const { student_id } = req.params;
    const studentEvents = rawEvents.filter(e => e.student_id === student_id);

    res.json({
        success: true,
        count: studentEvents.length,
        data: studentEvents
    });
});

/**
 * @route GET /api/v1/events/type/:event_type
 * @desc Get events filtered by type (e.g. video_play, quiz_attempt)
 */
app.get('/api/v1/events/type/:event_type', (req, res) => {
    const { event_type } = req.params;
    const currentEvents = rawEvents.filter(e => e.event_type === event_type);

    res.json({
        success: true,
        count: currentEvents.length,
        data: currentEvents
    });
});

/**
 * @route POST /api/v1/events
 * @desc Simulate ingesting a new event from the frontend
 */
app.post('/api/v1/events', (req, res) => {
    const newEvent = req.body;

    if (!newEvent.student_id || !newEvent.event_type || !newEvent.timestamp) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: student_id, event_type, timestamp"
        });
    }

    // In a real database, we would insert here
    rawEvents.push(newEvent);

    res.status(201).json({
        success: true,
        message: "Event ingested successfully",
        data: newEvent
    });
});

// -----------------------------------------------------
// TASK - Courses API
// -----------------------------------------------------

const mockCourses = [
    { id: 1, title: "Data Structures & Algorithms", instructor: "Prof. Vrusha", progress: 68, totalModules: 20, completedModules: 12, estCompletionTime: "10 hours", thumbnail: "./assets/course.png", aiRecommended: false },
    { id: 2, title: "Advanced Graph Theory", instructor: "Dr. Smith", progress: 45, totalModules: 15, completedModules: 6, estCompletionTime: "15 hours", thumbnail: "mock-img-1", aiRecommended: true, aiReason: "Practice Needed: Solve 5 Graph Problems based on your latest quiz." },
    { id: 3, title: "Dynamic Programming Masterclass", instructor: "Prof. Vrusha", progress: 32, totalModules: 10, completedModules: 3, estCompletionTime: "12 hours", thumbnail: "mock-img-1", aiRecommended: true, aiReason: "Action Required: Review basic tabulation based on struggling concepts." },
    { id: 4, title: "Web Development Bootcamp", instructor: "Sarah J.", progress: 100, totalModules: 25, completedModules: 25, estCompletionTime: "Completed", thumbnail: "mock-img-1", aiRecommended: false }
];

/**
 * @route GET /api/v1/courses
 * @desc Get all courses for student
 */
app.get('/api/v1/courses', (req, res) => {
    res.json({
        success: true,
        data: mockCourses
    });
});

// -----------------------------------------------------
// TASK 5 - AI Model Service Endpoints
// -----------------------------------------------------

/**
 * @route POST /api/ai/predict-performance
 * @desc Get AI prediction for a student's final performance
 * @body { quiz_accuracy, avg_video_completion, revisit_rate, study_time_per_day }
 */
app.post('/api/ai/predict-performance', (req, res) => {
    const { quiz_accuracy, avg_video_completion, revisit_rate, study_time_per_day } = req.body;

    if (quiz_accuracy === undefined) {
        return res.status(400).json({ success: false, message: "Missing features in body" });
    }

    // Proxy mathematical inference for RF/ML model equivalent
    const simulated_score = Math.min(100, Math.max(0,
        (quiz_accuracy * 0.4) + (avg_video_completion * 30) - (revisit_rate * 2) + Math.min(study_time_per_day / 2, 20) + (Math.random() * 10 - 5)
    ));

    let category = "Low";
    if (simulated_score >= 80) category = "High";
    else if (simulated_score >= 60) category = "Medium";

    res.json({
        success: true,
        data: {
            predicted_score: Math.round(simulated_score) + "%",
            performance_category: category,
            confidence_interval: "95%"
        }
    });
});

/**
 * @route POST /api/ai/predict-risk
 * @desc Get real ML student risk prediction
 */
app.post('/api/ai/predict-risk', async (req, res) => {
    try {
        const response = await axios.post(
            "http://localhost:8000/predict",
            req.body
        );
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("AI service error:", error.message);
        res.status(500).json({ success: false, message: "AI service unavailable" });
    }
});

/**
 * @route POST /api/ai/recommendations
 * @desc Generate learning suggestions based on analytics
 * @body { quiz_accuracy, replay_frequency, weak_concept }
 */
app.post('/api/ai/recommendations', (req, res) => {
    const { quiz_accuracy, replay_frequency, weak_concept } = req.body;

    let recommendations = [];

    if (quiz_accuracy < 50) {
        recommendations.push("Watch Lecture 4 again");
        if (weak_concept) recommendations.push(`Review ${weak_concept} concepts`);
    } else if (quiz_accuracy >= 80) {
        recommendations.push("Advance to the next module");
        recommendations.push("Try the optional challenge assignment");
    }

    if (replay_frequency > 3) {
        recommendations.push("Solve 5 practice problems");
    }

    if (recommendations.length === 0) {
        recommendations.push("Keep up the good pacing!");
    }

    res.json({
        success: true,
        data: {
            recommended_actions: recommendations
        }
    });
});

/**
 * @route GET /api/recommendations/:student_id
 * @desc Get comprehensive personalized learning path and weak topics
 */
app.get('/api/recommendations/:student_id', (req, res) => {
    const { student_id } = req.params;

    // Using mock data structurally similar to ML Pipeline output
    res.json({
        success: true,
        data: {
            student_id: parseInt(student_id),
            weak_topics: ["Recursion", "Graph Traversal"],
            recommendations: [
                {
                    type: "video",
                    title: "Watch: Recursion Basics",
                    url: "youtube.com/..."
                },
                {
                    type: "practice",
                    title: "Solve: 5 Recursion Problems",
                    url: "leetcode.com/..."
                },
                {
                    type: "simulation",
                    title: "Try: Recursion Visualizer",
                    url: "recursion-tree.com/..."
                }
            ]
        }
    });
});

app.listen(PORT, () => {
    console.log(`📡 ACCESS.AI Analytics API running on http://localhost:${PORT}`);
    console.log(`Try fetching events: http://localhost:${PORT}/api/v1/events`);
});
