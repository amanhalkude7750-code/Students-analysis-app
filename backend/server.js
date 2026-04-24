const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Gemini AI (merged from Access-ai-main)
let genAI = null;
try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');
    console.log('✅ Gemini AI SDK loaded.');
} catch (e) {
    console.warn('⚠️  @google/generative-ai not installed. Translation will use mock mode.');
}

// SQLite History (merged from Access-ai-main)
let History = null;
try {
    const sequelize = require('./database_sqlite');
    History = require('./History');
    sequelize.sync().then(() => console.log('✅ SQLite DB synced.'));
} catch (e) {
    console.warn('⚠️  SQLite not available. History will not be saved.');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


// Load raw events
const eventsPath = path.join(__dirname, '../database', 'raw_events_data.json');
let rawEvents = [];

const analyticsDbPath = path.join(__dirname, '../database', 'analytics_db.json');
let analyticsData = {};

// Load student data from CSV
const csvPath = path.join(__dirname, 'student_learning_dataset.csv');
let studentDataset = [];

try {
    const data = fs.readFileSync(eventsPath, 'utf8');
    rawEvents = JSON.parse(data);
    console.log(`Loaded ${rawEvents.length} learning events.`);

    if (fs.existsSync(analyticsDbPath)) {
        analyticsData = JSON.parse(fs.readFileSync(analyticsDbPath, 'utf8'));
        console.log(`Loaded AI Analytics Data (${analyticsData.mlDataset.length} students).`);
    }
} catch (err) {
    console.error('Failed to load events:', err.message);
}

// Load CSV data
if (fs.existsSync(csvPath)) {
    try {
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const student = {};
                headers.forEach((header, idx) => {
                    const value = values[idx];
                    student[header] = isNaN(value) ? value.trim() : parseFloat(value);
                });
                studentDataset.push(student);
            }
        }
        console.log(`✅ Loaded ${studentDataset.length} students from CSV.`);
    } catch (err) {
        console.error('Failed to load CSV:', err.message);
    }
} else {
    console.warn('⚠️  CSV file not found at:', csvPath);
}

// Load Notes Data
const notesDbPath = path.join(__dirname, '../database', 'notes_db.json');
let savedNotes = [];

if (fs.existsSync(notesDbPath)) {
    try {
        savedNotes = JSON.parse(fs.readFileSync(notesDbPath, 'utf8'));
        console.log(`✅ Loaded ${savedNotes.length} saved notes.`);
    } catch (err) {
        console.error('Failed to load notes:', err.message);
    }
}


// =====================================================
// API ENDPOINTS
// =====================================================

// Get all students
app.get('/api/v1/students', (req, res) => {
    try {
        if (!studentDataset.length) {
            return res.json({ success: true, data: [], message: "No students loaded" });
        }

        const students = studentDataset.map(s => ({
            student_id: s.student_id,
            standard: s.standard,
            subject: s.subject,
            term_marks: s.term_marks,
            quiz_accuracy: (s.quiz_accuracy * 100).toFixed(2),
            attendance_rate: (s.attendance_rate * 100).toFixed(2),
            engagement_score: (s.engagement_score * 100).toFixed(2),
            risk_level: s.risk_level
        }));

        res.json({ success: true, data: students, count: students.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get specific student details
app.get('/api/v1/students/:student_id', (req, res) => {
    try {
        const { student_id } = req.params;
        const student = studentDataset.find(s => s.student_id == student_id);

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const analysis = {
            personal_info: {
                student_id: student.student_id,
                standard: student.standard,
                subject: student.subject,
                parent_involvement: student.parent_involvement
            },
            academic_metrics: {
                term_marks: student.term_marks,
                quiz_accuracy: (student.quiz_accuracy * 100).toFixed(2) + "%",
                assignment_score: student.assignment_score,
                attendance_rate: (student.attendance_rate * 100).toFixed(2) + "%",
                total_attendance_days: student.total_attendance_days
            },
            engagement_metrics: {
                study_time_hours: student.study_time,
                video_completion: (student.video_completion * 100).toFixed(2) + "%",
                practice_attempts: student.practice_attempts,
                session_consistency: student.session_consistency,
                engagement_score: (student.engagement_score * 100).toFixed(2) + "%"
            },
            learning_behavior: {
                pause_frequency: student.pause_frequency,
                rewind_frequency: student.rewind_frequency,
                extracurricular_hours: student.extracurricular_hours,
                discipline_incidents: student.discipline_incidents
            },
            risk_assessment: {
                risk_level: student.risk_level,
                recommended_actions: generateRecommendations(student)
            }
        };

        res.json({ success: true, data: analysis });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get class dashboard analytics
app.get('/api/v1/students/analytics/dashboard', (req, res) => {
    try {
        if (!studentDataset.length) {
            return res.json({ success: true, data: {} });
        }

        const totalStudents = studentDataset.length;
        const riskLevels = { HIGH: 0, MEDIUM: 0, LOW: 0 };
        let totalMarks = 0, totalQuizAcc = 0, totalAttendance = 0;

        studentDataset.forEach(s => {
            riskLevels[s.risk_level]++;
            totalMarks += s.term_marks;
            totalQuizAcc += s.quiz_accuracy * 100;
            totalAttendance += s.attendance_rate * 100;
        });

        const analytics = {
            class_overview: {
                total_students: totalStudents,
                avg_marks: (totalMarks / totalStudents).toFixed(2),
                avg_quiz_accuracy: (totalQuizAcc / totalStudents).toFixed(2) + "%",
                avg_attendance: (totalAttendance / totalStudents).toFixed(2) + "%"
            },
            risk_distribution: {
                high_risk_students: riskLevels.HIGH,
                medium_risk_students: riskLevels.MEDIUM,
                low_risk_students: riskLevels.LOW
            },
            top_performers: getTopPerformers(studentDataset, 5),
            at_risk_students: getAtRiskStudents(studentDataset, 5),
            difficult_topics: generateDifficultTopics(studentDataset)
        };

        res.json({ success: true, data: analytics });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get student activity analytics
app.get('/api/v1/students/:student_id/activity', (req, res) => {
    try {
        const { student_id } = req.params;
        const student = studentDataset.find(s => s.student_id == student_id);

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // Calculate last activity time based on engagement (more recently active = higher engagement)
        // Engagement score 0.8-0.95 = active in last 10-30 mins, 0.5-0.8 = 30-120 mins ago, <0.5 = 2+ hours ago
        let minutesAgo;
        const engagementScore = parseFloat(student.engagement_score);
        
        if (engagementScore >= 0.8) {
            minutesAgo = Math.round(Math.random() * 25); // 0-25 mins ago
        } else if (engagementScore >= 0.6) {
            minutesAgo = Math.round(30 + Math.random() * 60); // 30-90 mins ago
        } else {
            minutesAgo = Math.round(120 + Math.random() * 240); // 2-6 hours ago
        }
        
        const lastActivityTime = new Date(Date.now() - minutesAgo * 60000);

        const activity = {
            student_id: student.student_id,
            last_activity_time: lastActivityTime.toISOString(),
            weekly_pattern: generateWeeklyPattern(student),
            engagement_timeline: generateEngagementTimeline(student),
            learning_velocity: calculateLearningVelocity(student),
            interaction_metrics: {
                video_pauses: student.pause_frequency,
                video_rewinds: student.rewind_frequency,
                quiz_attempts: student.practice_attempts,
                study_consistency: student.session_consistency
            }
        };

        res.json({ success: true, data: activity });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get student notes
app.get('/api/v1/notes/:student_id', (req, res) => {
    try {
        const { student_id } = req.params;
        const studentNotes = savedNotes.filter(n => n.student_id == student_id);
        res.json({ success: true, data: studentNotes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Save student notes and generate summary
app.post('/api/v1/notes', (req, res) => {
    try {
        const { student_id, course_id, notes } = req.body;
        
        if (!notes || notes.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Notes cannot be empty" });
        }

        // Simple AI-like summarization: extract key phrases
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Create a summary by selecting important sentences
        let summary = '';
        if (sentences.length > 0) {
            const importantSentences = sentences
                .sort((a, b) => b.trim().split(/\s+/).length - a.trim().split(/\s+/).length)
                .slice(0, Math.min(3, sentences.length))
                .map(s => s.trim());
            
            summary = importantSentences.join('. ') + '.';
        }

        if (summary.length === 0 || summary.length > 200) {
            summary = notes.substring(0, 150).trim() + (notes.length > 150 ? '...' : '');
        }

        // --- NEW: Actually Save the Note ---
        const newNote = {
            id: Date.now(),
            student_id: student_id,
            course_id: course_id || 'General',
            notes: notes,
            summary: summary,
            timestamp: new Date().toISOString()
        };

        savedNotes.push(newNote);

        // Persist to disk
        try {
            fs.writeFileSync(notesDbPath, JSON.stringify(savedNotes, null, 2));
        } catch (fsErr) {
            console.error("Failed to save note to disk:", fsErr);
        }

        res.json({
            success: true,
            message: "Notes saved successfully",
            summary: `Summary: ${summary}`,
            notes_count: sentences.length,
            data: newNote
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// Get leaderboard rankings
app.get('/api/v1/leaderboard', (req, res) => {
    try {
        // Create leaderboard based on quiz accuracy scores
        const leaderboard = studentDataset
            .map(student => ({
                student_id: student.student_id,
                student_name: `Student #${student.student_id}`,
                score: Math.round(parseFloat(student.quiz_accuracy) * 100),
                engagement: parseFloat(student.engagement_score),
                marks: student.term_marks,
                standard: student.standard
            }))
            .sort((a, b) => {
                // Sort by quiz accuracy first, then by marks
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return b.marks - a.marks;
            })
            .slice(0, 50); // Return top 50 students

        res.json({
            success: true,
            data: leaderboard,
            totalStudents: studentDataset.length,
            topScore: leaderboard[0]?.score || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// -----------------------------------------------------
// Video Interaction Analytics
// -----------------------------------------------------
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

    // Count views (fallback to mock if no real events yet)
    const uniqueStudents = new Set(courseEvents.map(e => e.student_id)).size;
    const totalViews = uniqueStudents > 0 ? uniqueStudents : 15;

    const timeBlocks = {};

    courseEvents.forEach(event => {
        const bucket = Math.floor(event.timestamp_sec / 10) * 10;
        if (!timeBlocks[bucket]) {
            timeBlocks[bucket] = { pause: 0, rewind: 0, skip: 0, total_friction: 0 };
        }
        timeBlocks[bucket][event.action]++;
        if (event.action === "rewind") timeBlocks[bucket].total_friction += 2;
        if (event.action === "pause") timeBlocks[bucket].total_friction += 1;
    });

    const sortedHotspots = Object.keys(timeBlocks)
        .map(sec => ({
            timestamp_sec: parseInt(sec),
            formatted_time: `${Math.floor(sec / 60)}:${(parseInt(sec) % 60).toString().padStart(2, '0')}`,
            metrics: timeBlocks[sec]
        }))
        .sort((a, b) => a.timestamp_sec - b.timestamp_sec);

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

// Quiz Result Endpoint
app.post('/api/v1/quiz', (req, res) => {
    const { student_id, student_name, score } = req.body;
    if (!student_id || score === undefined) {
        return res.status(400).json({ success: false, message: "Missing student_id or score" });
    }
    // In a real app we'd save this to a DB. For now, we'll just acknowledge.
    res.json({ success: true, message: "Quiz result received" });
});


// Get all available courses
app.get('/api/v1/courses', (req, res) => {
    try {
        const courses = [
            {
                id: 1,
                title: 'Advanced Mathematics - Algebra',
                instructor: 'Prof. James Wilson',
                thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                totalModules: 12,
                completedModules: 8,
                progress: 67,
                estCompletionTime: '4 weeks',
                aiRecommended: true,
                aiReason: 'Recommended based on your performance in Algebra fundamentals'
            },
            {
                id: 2,
                title: 'Science - Physics Basics',
                instructor: 'Dr. Sarah Chen',
                thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                totalModules: 10,
                completedModules: 5,
                progress: 50,
                estCompletionTime: '6 weeks',
                aiRecommended: true,
                aiReason: 'AI predicts high success rate based on your learning patterns'
            },
            {
                id: 3,
                title: 'English Language - Literature',
                instructor: 'Ms. Emma Roberts',
                thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                totalModules: 15,
                completedModules: 10,
                progress: 67,
                estCompletionTime: '8 weeks',
                aiRecommended: false,
                aiReason: ''
            },
            {
                id: 4,
                title: 'History & Social Studies',
                instructor: 'Dr. Michael Brown',
                thumbnail: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                totalModules: 8,
                completedModules: 3,
                progress: 38,
                estCompletionTime: '5 weeks',
                aiRecommended: false,
                aiReason: ''
            },
            {
                id: 5,
                title: 'Computer Science - Python',
                instructor: 'Prof. Alex Kumar',
                thumbnail: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                totalModules: 14,
                completedModules: 14,
                progress: 100,
                estCompletionTime: 'Completed',
                aiRecommended: true,
                aiReason: 'You excelled in this course! Consider advanced modules'
            },
            {
                id: 6,
                title: 'Biology - Human Anatomy',
                instructor: 'Dr. Lisa Park',
                thumbnail: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                totalModules: 11,
                completedModules: 0,
                progress: 0,
                estCompletionTime: '7 weeks',
                aiRecommended: false,
                aiReason: ''
            }
        ];

        res.json({
            success: true,
            data: courses,
            totalCourses: courses.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Helper Functions
function generateRecommendations(student) {
    const recommendations = [];

    if (student.quiz_accuracy < 0.5) {
        recommendations.push("Review course material - quiz accuracy below 50%");
    }
    if (student.attendance_rate < 0.6) {
        recommendations.push("Improve attendance - current rate below 60%");
    }
    if (student.pause_frequency > 8) {
        recommendations.push("Video content is challenging - increase practice problems");
    }
    if (student.practice_attempts < 5) {
        recommendations.push("Increase practice attempts for better retention");
    }
    if (student.discipline_incidents > 0) {
        recommendations.push("Address behavioral concerns with student");
    }

    return recommendations.length > 0 ? recommendations : ["Student is performing well"];
}

function getTopPerformers(students, count) {
    return students
        .sort((a, b) => (b.term_marks + b.quiz_accuracy * 100) - (a.term_marks + a.quiz_accuracy * 100))
        .slice(0, count)
        .map(s => ({
            student_id: s.student_id,
            standard: s.standard,
            subject: s.subject,
            marks: s.term_marks,
            score: ((s.term_marks + s.quiz_accuracy * 100) / 2).toFixed(2)
        }));
}

function getAtRiskStudents(students, count) {
    return students
        .filter(s => s.risk_level === 'HIGH' || s.risk_level === 'MEDIUM')
        .sort((a, b) => {
            if (a.risk_level === 'HIGH' && b.risk_level !== 'HIGH') return -1;
            if (a.risk_level !== 'HIGH' && b.risk_level === 'HIGH') return 1;
            return b.term_marks - a.term_marks;
        })
        .slice(0, count)
        .map(s => ({
            student_id: s.student_id,
            standard: s.standard,
            subject: s.subject,
            marks: s.term_marks,
            attendance: (s.attendance_rate * 100).toFixed(2),
            risk_level: s.risk_level,
            reason: generateRiskReason(s)
        }));
}

function generateRiskReason(student) {
    if (student.term_marks < 40) return "Low academic performance";
    if (student.attendance_rate < 0.5) return "Poor attendance";
    if (student.quiz_accuracy < 0.3) return "Low quiz scores";
    if (student.discipline_incidents >= 2) return "Disciplinary issues";
    return "Inconsistent performance";
}

function generateDifficultTopics(students) {
    const subjectPerformance = {};
    
    students.forEach(s => {
        if (!subjectPerformance[s.subject]) {
            subjectPerformance[s.subject] = [];
        }
        subjectPerformance[s.subject].push(s.quiz_accuracy);
    });

    return Object.entries(subjectPerformance)
        .map(([subject, scores]) => ({
            subject,
            avg_score: ((scores.reduce((a, b) => a + b) / scores.length) * 100).toFixed(2),
            difficulty: ((scores.reduce((a, b) => a + b) / scores.length) * 100 < 50) ? "High" : 
                        ((scores.reduce((a, b) => a + b) / scores.length) * 100 < 70) ? "Medium" : "Low"
        }))
        .sort((a, b) => parseFloat(a.avg_score) - parseFloat(b.avg_score))
        .slice(0, 5);
}

function generateWeeklyPattern(student) {
    // Generate synthetic weekly pattern based on study_time and consistency
    const baseActivity = student.study_time / 7;
    return {
        monday: Math.round(baseActivity * (0.8 + Math.random() * 0.4)),
        tuesday: Math.round(baseActivity * (0.9 + Math.random() * 0.4)),
        wednesday: Math.round(baseActivity * (0.7 + Math.random() * 0.3)),
        thursday: Math.round(baseActivity * (1.0 + Math.random() * 0.5)),
        friday: Math.round(baseActivity * (0.6 + Math.random() * 0.3)),
        saturday: Math.round(baseActivity * (0.5 + Math.random() * 0.4)),
        sunday: Math.round(baseActivity * (0.8 + Math.random() * 0.3))
    };
}

function generateEngagementTimeline(student) {
    // Generate 4-week engagement timeline
    const baseline = student.engagement_score * 100;
    return [
        { week: 1, engagement: Math.min(100, baseline * 0.8) },
        { week: 2, engagement: Math.min(100, baseline * 0.85) },
        { week: 3, engagement: Math.min(100, baseline * 0.95) },
        { week: 4, engagement: Math.min(100, baseline) }
    ];
}

function calculateLearningVelocity(student) {
    // Calculate learning speed based on quiz accuracy and practice attempts
    return {
        velocity: ((student.quiz_accuracy * student.practice_attempts) / 10).toFixed(2),
        trend: student.quiz_accuracy > 0.7 ? "Improving" : "Needs attention",
        pace: student.session_consistency > 6 ? "Consistent" : "Inconsistent"
    };
}

// Legacy endpoints for compatibility
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

app.get('/api/v1/analytics', (req, res) => {
    res.json({
        success: true,
        data: analyticsData
    });
});


app.post('/api/ai/predict-performance', (req, res) => {
    const { quiz_accuracy, avg_video_completion, revisit_rate, study_time_per_day } = req.body;
    
    if (quiz_accuracy === undefined) {
        return res.status(400).json({ success: false, message: "Missing features" });
    }

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

app.post('/api/ai/predict-risk', async (req, res) => {
    try {
        // Try to call the Python AI server if it's running
        const response = await axios.post(
            "http://localhost:8000/predict",
            req.body,
            { timeout: 2000 }
        );
        res.json({ success: true, data: response.data });
    } catch (error) {
        // Fallback to randomized simulation if AI server is down
        console.warn("AI Server (port 8000) not reached, using simulation fallback");
        const riskScore = Math.random() * 100;
        let riskLevel = 'LOW';
        if (riskScore > 70) riskLevel = 'HIGH';
        else if (riskScore > 40) riskLevel = 'MEDIUM';

        res.json({
            success: true,
            data: {
                risk_level: riskLevel,
                confidence: riskScore / 100,
                is_simulation: true
            }
        });
    }
});

app.get('/api/recommendations/:student_id', (req, res) => {
    const { student_id } = req.params;
    res.json({
        success: true,
        data: {
            student_id: parseInt(student_id),
            weak_topics: ["Recursion", "Graph Traversal"],
            recommendations: [
                { type: "video", title: "Watch: Recursion Basics", url: "youtube.com/..." },
                { type: "practice", title: "Solve: 5 Recursion Problems", url: "leetcode.com/..." }
            ]
        }
    });
});

// =====================================================
// GEMINI TRANSLATE & HISTORY (merged from Access-ai-main)
// =====================================================

// Translate sign language tokens to fluent sentence
app.post('/api/translate', async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid tokens provided' });
        }

        const rawTokens = tokens.map(t => t.token || t).join(' ');
        console.log('Translation Request for:', rawTokens);

        let responseText = '';

        if (!genAI || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            console.warn('No Gemini API Key, using fallback.');
            responseText = `(SIMULATED AI): Translated "${rawTokens}" into a fluent sentence. [Please set GEMINI_API_KEY]`;
        } else {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = `You are a Sign Language Translator. Convert this sequence of sign tokens into a natural, fluent, and polite English sentence. Account for grammar, context, and potential emotional tone.\n\nTokens: [${rawTokens}]\n\nOutput just the sentence.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            responseText = response.text();
        }

        // Save to SQLite history if available
        if (History) {
            try {
                await History.create({ input: rawTokens, output: responseText, mode: 'DEAF' });
            } catch (e) {
                console.warn('Failed to save history:', e.message);
            }
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({ error: 'Failed to process translation', details: error.message });
    }
});

// Get translation history
app.get('/api/history', async (req, res) => {
    try {
        if (!History) {
            return res.json({ history: [] });
        }
        const history = await History.findAll({
            order: [['timestamp', 'DESC']],
            limit: 50
        });
        res.json({ history });
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ ACCESS.AI Analytics API Started`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📊 Students Loaded: ${studentDataset.length}`);
    console.log(`\n📍 API Endpoints:`);
    console.log(`   GET  /api/v1/students`);
    console.log(`   GET  /api/v1/students/:id`);
    console.log(`   GET  /api/v1/students/analytics/dashboard`);
    console.log(`   GET  /api/v1/students/:id/activity`);
    console.log(`   POST /api/v1/notes`);
    console.log(`   GET  /api/v1/leaderboard`);
    console.log(`   GET  /api/v1/courses`);
    console.log(`   POST /api/translate`);
    console.log(`   GET  /api/history\n`);
});
