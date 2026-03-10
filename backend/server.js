const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API to serve courses
app.get('/api/v1/courses', (req, res) => {
    // Return mock courses data matching what course-script.js expects
    const courses = [
        {
            thumbnail: "purple-icon", // Using a CSS class for generic icon placeholder
            aiRecommended: true,
            aiReason: "Recommended based on weak topic: Dynamic Programming",
            title: "Dynamic Programming Masterclass",
            progress: 30,
            completedModules: 3,
            totalModules: 10,
            estCompletionTime: "5 hrs",
            instructor: "Alan Turing"
        },
        {
            thumbnail: "teal-icon",
            aiRecommended: false,
            aiReason: "",
            title: "Introduction to Graph Theory",
            progress: 100,
            completedModules: 8,
            totalModules: 8,
            estCompletionTime: "0 hrs (Completed)",
            instructor: "Dr. Smith"
        },
        {
            thumbnail: "progress-icon",
            aiRecommended: true,
            aiReason: "High priority for next week's syllabus",
            title: "Advanced Data Structures",
            progress: 0,
            completedModules: 0,
            totalModules: 5,
            estCompletionTime: "3.5 hrs",
            instructor: "Prof. Johnson"
        }
    ];

    res.json({
        success: true,
        data: courses
    });
});

app.get('/api/v1/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            predictedScore: 88,
            riskLevel: "Low Risk",
            courseCompletion: 74,
            dailyTime: 4.2,
            quizImp: "Constantly improving",
            aiInsight: "Your recent focus on Graph Theory has significantly improved your projected score. We recommend reviewing Dynamic Programming in the courses below to boost your mastery.",
            chartData: {
                progressLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                progressScores: [65, 70, 72, 85, 88],
                heatmapDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                heatmapHours: [2, 4, 3, 5, 1.5, 2.5, 3.5]
            }
        }
    });
});

// Setup DB path for video events
const DB_EVENTS_PATH = path.join(__dirname, '../database/video_events.json');

// Ensure DB file exists
if (!fs.existsSync(DB_EVENTS_PATH)) {
    fs.writeFileSync(DB_EVENTS_PATH, JSON.stringify([]));
}

// POST endpoint to track video activity
app.post('/api/v1/video-events', (req, res) => {
    try {
        const events = JSON.parse(fs.readFileSync(DB_EVENTS_PATH, 'utf-8'));
        const newEvent = req.body;
        events.push(newEvent);
        fs.writeFileSync(DB_EVENTS_PATH, JSON.stringify(events, null, 2));
        res.json({ success: true, message: "Video event stored successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET endpoint to fetch video analytics for the teacher dashboard
app.get('/api/v1/teacher-video-analytics', (req, res) => {
    try {
        const events = JSON.parse(fs.readFileSync(DB_EVENTS_PATH, 'utf-8'));

        // Compute analytics dynamically
        let totalStudents = new Set();
        let totalWatchDuration = 0;
        let watchDurationCount = 0;
        let playEvents = 0;
        let completionEvents = 0;
        let videoReplays = {};

        events.forEach(e => {
            if (e.student_id) totalStudents.add(e.student_id);

            if (e.event_type === 'play') {
                playEvents++;
                videoReplays[e.video_id] = (videoReplays[e.video_id] || 0) + 1;
            }
            if (e.event_type === 'video_completed') {
                completionEvents++;
            }
            if (e.watch_duration && e.watch_duration > 0) {
                totalWatchDuration += e.watch_duration;
                watchDurationCount++;
            }
        });

        let mostReplayedVideo = Object.keys(videoReplays).sort((a, b) => videoReplays[b] - videoReplays[a])[0] || 'N/A';

        // Mock engagement trends based on events size to make dashboard alive
        let engagementTrends = [60, 65, 70, 75, 80 + (events.length % 20)];

        const analytics = {
            studentsWatching: totalStudents.size,
            averageWatchTime: watchDurationCount > 0 ? (totalWatchDuration / watchDurationCount).toFixed(1) : 0,
            completionRate: playEvents > 0 ? ((completionEvents / playEvents) * 100).toFixed(1) : 0,
            mostReplayedVideo: mostReplayedVideo,
            engagementTrends: engagementTrends
        };

        res.json({ success: true, data: analytics });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------------
// TASK - Authentication API
// -----------------------------------------------------

const mockUsers = [
    { id: "student_001", email: "student@university.edu", password: "password123", role: "student", name: "Alex Researcher" },
    { id: "prof_001", email: "teacher@university.edu", password: "admin", role: "teacher", name: "Prof. Johnson" }
];

app.post('/api/v1/login', (req, res) => {
    const { email, password, role } = req.body;

    const user = mockUsers.find(u => u.email === email && u.password === password && u.role === role);

    if (user) {
        // Exclude the password from the response
        const { password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } else {
        res.status(401).json({ success: false, message: "Invalid email or password" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API Server running at http://localhost:${PORT}`);
});
