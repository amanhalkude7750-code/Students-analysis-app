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

// -----------------------------------------------------
// TASK - Learning Notes & AI Summarization
// -----------------------------------------------------

const savedNotes = [];

/**
 * @route POST /api/v1/notes
 * @desc Save student notes and generate an AI summary
 */
app.post('/api/v1/notes', (req, res) => {
    const { student_id, course_id, notes } = req.body;

    if (!student_id || !course_id || !notes) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    savedNotes.push({ student_id, course_id, notes, timestamp: new Date() });

    // Simulate an AI summarization (or integrate real LLM if desired)
    const summary = `AI Summary: You mainly discussed keywords like "${notes.split(' ').slice(0, 3).join(' ')}". Your notes indicate a strong focus on core definitions but might need more practical examples. Great job organizing your thoughts!`;

    res.json({
        success: true,
        summary: summary
    });
});

/**
 * @route GET /api/v1/notes/:student_id
 * @desc Get all saved notes for a student
 */
app.get('/api/v1/notes/:student_id', (req, res) => {
    const { student_id } = req.params;
    const studentNotes = savedNotes.filter(n => n.student_id == student_id);
    res.json({ success: true, data: studentNotes });
});

// -----------------------------------------------------
// TASK - Video Interaction Analytics
// -----------------------------------------------------

/**
 * events stored: 
 * { course_id, student_id, action: "pause"|"rewind"|"skip", timestamp_sec: number, actual_time: Date }
 */
const videoInteractions = [];

/**
 * @route POST /api/v1/video-events
 * @desc Log a student interacting with the video timeline
 */
app.post('/api/v1/video-events', (req, res) => {
    const { course_id, student_id, action, timestamp_sec } = req.body;

    if (!course_id || !student_id || !action || timestamp_sec === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    videoInteractions.push({
        course_id,
        student_id,
        action,
        timestamp_sec: Math.floor(timestamp_sec),
        actual_time: new Date()
    });

    res.json({ success: true, message: "Event logged" });
});

/**
 * @route GET /api/v1/video-analytics/:course_id
 * @desc Process raw interactions into difficulty hotspots
 */
app.get('/api/v1/video-analytics/:course_id', (req, res) => {
    const { course_id } = req.params;

    // Filter events for this video
    const courseEvents = videoInteractions.filter(e => e.course_id == course_id);

    // Count views (assuming unique student IDs hitting play implies a view)
    const uniqueStudents = new Set(courseEvents.map(e => e.student_id)).size;
    const totalViews = uniqueStudents > 0 ? uniqueStudents : 15; // fallback mock data if 0

    // Aggregate timestamps
    const timeBlocks = {};

    courseEvents.forEach(event => {
        // Group by 10-second buckets to identify "hotspots" instead of specific seconds
        const bucket = Math.floor(event.timestamp_sec / 10) * 10;

        if (!timeBlocks[bucket]) {
            timeBlocks[bucket] = { pause: 0, rewind: 0, skip: 0, total_friction: 0 };
        }

        timeBlocks[bucket][event.action]++;

        // Calculate a "friction" score. Rewinds and pauses imply difficulty. Skips imply boredom/too easy.
        if (event.action === "rewind") timeBlocks[bucket].total_friction += 2;
        if (event.action === "pause") timeBlocks[bucket].total_friction += 1;
    });

    // Format into array for chart consumption
    const sortedHotspots = Object.keys(timeBlocks)
        .map(sec => ({
            timestamp_sec: parseInt(sec),
            formatted_time: `${Math.floor(sec / 60)}:${(parseInt(sec) % 60).toString().padStart(2, '0')}`,
            metrics: timeBlocks[sec]
        }))
        .sort((a, b) => a.timestamp_sec - b.timestamp_sec);

    // Find the hardest section
    let hardestSection = null;
    let maxFriction = 0;
    sortedHotspots.forEach(spot => {
        if (spot.metrics.total_friction > maxFriction) {
            maxFriction = spot.metrics.total_friction;
            hardestSection = spot;
        }
    });

    res.json({
        success: true,
        data: {
            total_views: totalViews,
            hotspots: sortedHotspots,
            hardest_section: hardestSection
        }
    });
});

// -----------------------------------------------------
// TASK - Quiz & Leaderboard
// -----------------------------------------------------

// Store leaderboard entries in-memory
const leaderboardData = [
    { student_id: 102, student_name: "Sneha P.", score: 90, timestamp: new Date() },
    { student_id: 103, student_name: "Rahul K.", score: 40, timestamp: new Date() },
    { student_id: 104, student_name: "Priya S.", score: 85, timestamp: new Date() }
];

/**
 * @route POST /api/v1/quiz
 * @desc Save quiz score and update leaderboard
 */
app.post('/api/v1/quiz', (req, res) => {
    const { student_id, student_name, score } = req.body;

    if (!student_id || score === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    leaderboardData.push({ student_id, student_name: student_name || "Student", score, timestamp: new Date() });

    res.json({ success: true, message: "Quiz result saved successfully" });
});

/**
 * @route GET /api/v1/leaderboard
 * @desc Get ranked leaderboard
 */
app.get('/api/v1/leaderboard', (req, res) => {
    // Sort descending by score
    const sorted = [...leaderboardData].sort((a, b) => b.score - a.score);
    res.json({ success: true, data: sorted });
});

app.listen(PORT, () => {
    console.log(`📡 ACCESS.AI Analytics API running on http://localhost:${PORT}`);
    console.log(`Try fetching events: http://localhost:${PORT}/api/v1/events`);
});
