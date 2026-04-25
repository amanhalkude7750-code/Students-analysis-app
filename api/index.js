const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

let genAI = null;
try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (e) {
    console.warn('⚠️  @google/generative-ai not installed. Translation will use mock mode.');
}

const app = express();

app.use(cors());
app.use(express.json());

// Helper to find data files — use __dirname for Vercel serverless compatibility
const PROJECT_ROOT = path.join(__dirname, '..');
const getPath = (relPath) => path.join(PROJECT_ROOT, relPath);

// Initialize data
let rawEvents = [];
let analyticsData = {};
let studentDataset = [];
let savedNotes = [];

const loadData = () => {
    try {
        console.log('[Vercel API] Loading data from:', PROJECT_ROOT);

        const eventsPath = getPath('database/raw_events_data.json');
        console.log('[Vercel API] Events path:', eventsPath, 'exists:', fs.existsSync(eventsPath));
        if (fs.existsSync(eventsPath)) {
            rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
            console.log('[Vercel API] Loaded', rawEvents.length, 'events');
        }

        const analyticsDbPath = getPath('database/analytics_db.json');
        if (fs.existsSync(analyticsDbPath)) {
            analyticsData = JSON.parse(fs.readFileSync(analyticsDbPath, 'utf8'));
        }

        const csvPath = getPath('backend/student_learning_dataset.csv');
        console.log('[Vercel API] CSV path:', csvPath, 'exists:', fs.existsSync(csvPath));
        if (fs.existsSync(csvPath)) {
            const csvData = fs.readFileSync(csvPath, 'utf8');
            const lines = csvData.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            studentDataset = [];
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
            console.log('[Vercel API] Loaded', studentDataset.length, 'students from CSV');
        }

        const notesDbPath = getPath('database/notes_db.json');
        console.log('[Vercel API] Notes path:', notesDbPath, 'exists:', fs.existsSync(notesDbPath));
        if (fs.existsSync(notesDbPath)) {
            savedNotes = JSON.parse(fs.readFileSync(notesDbPath, 'utf8'));
            console.log('[Vercel API] Loaded', savedNotes.length, 'notes');
        }
    } catch (err) {
        console.error('[Vercel API] Data load error:', err);
    }
};

// Initial load
loadData();

// API Endpoints
app.get('/api/v1/students', (req, res) => {
    res.json({ success: true, data: studentDataset, count: studentDataset.length });
});

app.get('/api/v1/students/:student_id', (req, res) => {
    const { student_id } = req.params;
    const student = studentDataset.find(s => s.student_id == student_id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const analysis = {
        personal_info: { student_id: student.student_id, standard: student.standard, subject: student.subject, parent_involvement: student.parent_involvement },
        academic_metrics: { term_marks: student.term_marks, quiz_accuracy: (student.quiz_accuracy * 100).toFixed(2) + "%", assignment_score: student.assignment_score, attendance_rate: (student.attendance_rate * 100).toFixed(2) + "%", total_attendance_days: student.total_attendance_days },
        engagement_metrics: { study_time_hours: student.study_time, video_completion: (student.video_completion * 100).toFixed(2) + "%", practice_attempts: student.practice_attempts, session_consistency: student.session_consistency, engagement_score: (student.engagement_score * 100).toFixed(2) + "%" },
        learning_behavior: { pause_frequency: student.pause_frequency, rewind_frequency: student.rewind_frequency, extracurricular_hours: student.extracurricular_hours, discipline_incidents: student.discipline_incidents },
        risk_assessment: { risk_level: student.risk_level, recommended_actions: generateRecommendations(student) }
    };
    res.json({ success: true, data: analysis });
});

app.get('/api/v1/students/analytics/dashboard', (req, res) => {
    if (!studentDataset.length) return res.json({ success: true, data: {} });
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
        class_overview: { total_students: totalStudents, avg_marks: (totalMarks / totalStudents).toFixed(2), avg_quiz_accuracy: (totalQuizAcc / totalStudents).toFixed(2) + "%", avg_attendance: (totalAttendance / totalStudents).toFixed(2) + "%" },
        risk_distribution: { high_risk_students: riskLevels.HIGH, medium_risk_students: riskLevels.MEDIUM, low_risk_students: riskLevels.LOW },
        top_performers: getTopPerformers(studentDataset, 5),
        at_risk_students: getAtRiskStudents(studentDataset, 5),
        difficult_topics: generateDifficultTopics(studentDataset)
    };
    res.json({ success: true, data: analytics });
});

app.get('/api/v1/students/:student_id/activity', (req, res) => {
    const { student_id } = req.params;
    const student = studentDataset.find(s => s.student_id == student_id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const activity = {
        student_id: student.student_id,
        last_activity_time: new Date().toISOString(),
        weekly_pattern: generateWeeklyPattern(student),
        engagement_timeline: generateEngagementTimeline(student),
        learning_velocity: calculateLearningVelocity(student),
        interaction_metrics: { video_pauses: student.pause_frequency, video_rewinds: student.rewind_frequency, quiz_attempts: student.practice_attempts, study_consistency: student.session_consistency }
    };
    res.json({ success: true, data: activity });
});

app.get('/api/v1/notes/:student_id', (req, res) => {
    const { student_id } = req.params;
    const notes = savedNotes.filter(n => n.student_id == student_id);
    res.json({ success: true, data: notes });
});

app.post('/api/v1/notes', (req, res) => {
    const { student_id, course_id, notes } = req.body;
    if (!notes) return res.status(400).json({ success: false, message: "Notes required" });
    const summary = notes.substring(0, 100) + "...";
    const newNote = { id: Date.now(), student_id, course_id, notes, summary, timestamp: new Date().toISOString() };
    savedNotes.push(newNote);
    res.json({ success: true, data: newNote, summary });
});

app.get('/api/v1/leaderboard', (req, res) => {
    const leaderboard = studentDataset.slice(0, 10).map(s => ({
        student_id: s.student_id, student_name: `Student ${s.student_id}`, score: Math.round(s.quiz_accuracy * 100)
    })).sort((a,b) => b.score - a.score);
    res.json({ success: true, data: leaderboard });
});

app.get('/api/v1/courses', (req, res) => {
    const courses = [
        { id: 1, title: 'Advanced Mathematics - Algebra', instructor: 'Prof. James Wilson', thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', totalModules: 12, completedModules: 8, progress: 67, estCompletionTime: '4 weeks', aiRecommended: true, aiReason: 'Recommended based on your performance in Algebra fundamentals' },
        { id: 2, title: 'Science - Physics Basics', instructor: 'Dr. Sarah Chen', thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', totalModules: 10, completedModules: 5, progress: 50, estCompletionTime: '6 weeks', aiRecommended: true, aiReason: 'AI predicts high success rate based on your learning patterns' }
    ];
    res.json({ success: true, data: courses });
});

// Video interaction endpoints
const videoInteractions = [];
app.post('/api/v1/video-events', (req, res) => {
    videoInteractions.push(req.body);
    res.json({ success: true });
});

app.post('/api/translate', async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid tokens provided' });
        }

        const rawTokens = tokens.map(t => t.token || t).join(' ');
        console.log('[Vercel API] Translation Request for:', rawTokens);

        let responseText = '';

        if (!genAI || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            console.warn('[Vercel API] No Gemini API Key, using fallback.');
            responseText = `(SIMULATED AI): Translated "${rawTokens}" into a fluent sentence. [Please set GEMINI_API_KEY]`;
        } else {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = `You are a Sign Language Translator. Convert this sequence of sign tokens into a natural, fluent, and polite English sentence. Account for grammar, context, and potential emotional tone.\n\nTokens: [${rawTokens}]\n\nOutput just the sentence.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            responseText = response.text();
        }
        res.json({ response: responseText });
    } catch (error) {
        console.error('[Vercel API] Translation Error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

app.get('/api/v1/video-analytics/:course_id', (req, res) => {
    res.json({ 
        success: true, 
        data: { 
            total_views: 15, 
            hotspots: [{ timestamp_sec: 10, formatted_time: "0:10", metrics: { pause: 2, rewind: 1, skip: 0, total_friction: 5 } }],
            hardest_section: { formatted_time: "0:10", metrics: { pause: 2, rewind: 1, total_friction: 5 } }
        } 
    });
});

app.post('/api/ai/predict-risk', (req, res) => {
    res.json({ success: true, data: { risk_level: 'LOW', confidence: 0.95 } });
});

// Helper functions (simplified for brevity, can be expanded)
function generateRecommendations() { return ["Review course material"]; }
function getTopPerformers(students, count) { return students.slice(0, count).map(s => ({ student_id: s.student_id, marks: s.term_marks })); }
function getAtRiskStudents(students, count) { return students.filter(s => s.risk_level !== 'LOW').slice(0, count).map(s => ({ student_id: s.student_id, risk_level: s.risk_level, reason: 'Low marks' })); }
function generateDifficultTopics() { return [{ subject: 'Math', avg_score: 45, difficulty: 'High' }]; }
function generateWeeklyPattern() { return { monday: 30, tuesday: 45, wednesday: 0, thursday: 60, friday: 20, saturday: 10, sunday: 0 }; }
function generateEngagementTimeline() { return [{ week: 1, engagement: 80 }, { week: 2, engagement: 85 }]; }
function calculateLearningVelocity() { return { velocity: 4.5, trend: 'Improving', pace: 'Consistent' }; }

module.exports = app;
