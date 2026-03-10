const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

        const activity = {
            student_id: student.student_id,
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

app.get('/api/v1/courses', (req, res) => {
    const mockCourses = [
        { id: 1, title: "Data Structures & Algorithms", instructor: "Prof. Vrusha", progress: 68, totalModules: 20, completedModules: 12 },
        { id: 2, title: "Advanced Graph Theory", instructor: "Dr. Smith", progress: 45, totalModules: 15, completedModules: 6 },
        { id: 3, title: "Dynamic Programming Masterclass", instructor: "Prof. Vrusha", progress: 32, totalModules: 10, completedModules: 3 }
    ];
    res.json({ success: true, data: mockCourses });
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

app.post('/api/ai/predict-risk', (req, res) => {
    const riskScore = Math.random() * 100;
    let riskLevel = 'LOW';
    if (riskScore > 70) riskLevel = 'HIGH';
    else if (riskScore > 40) riskLevel = 'MEDIUM';

    res.json({
        success: true,
        data: {
            risk_level: riskLevel,
            confidence: riskScore / 100
        }
    });
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

app.listen(PORT, () => {
    console.log(`\n✅ ACCESS.AI Analytics API Started`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📊 Students Loaded: ${studentDataset.length}`);
    console.log(`\n📍 API Endpoints:`);
    console.log(`   GET /api/v1/students`);
    console.log(`   GET /api/v1/students/:id`);
    console.log(`   GET /api/v1/students/analytics/dashboard`);
    console.log(`   GET /api/v1/students/:id/activity\n`);
});
