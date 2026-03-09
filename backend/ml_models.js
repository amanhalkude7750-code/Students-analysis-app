const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { RandomForestRegression } = require('ml-random-forest');

// ------------------------------------------------------------------
// Mocking Course Topics Map (To assign Concepts to Videos and Quizzes)
// ------------------------------------------------------------------
const courseTopics = {
    'video_001': 'Dynamic Programming',
    'video_002': 'Binary Trees',
    'video_003': 'Sorting Algorithms',
    'video_004': 'Graph Theory',
    'video_005': 'Hash Tables',
    'quiz_001': 'Dynamic Programming',
    'quiz_002': 'Binary Trees',
    'quiz_003': 'Sorting Algorithms',
    'quiz_004': 'Graph Theory',
    'quiz_005': 'Hash Tables'
};

const analyticsPath = path.join(__dirname, '../database', 'analytics_db.json');
const rawEventsPath = path.join(__dirname, '../database', 'raw_events_data.json');
const csvFilePath = path.join(__dirname, '../database', 'ml_training_dataset.csv');

// Helper functions for categorization
const getPerformanceCategory = (score) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
};

// ==================================================================
// TASK 2.1 — Performance Prediction Model (Random Forest)
// ==================================================================

function runPerformancePrediction() {
    return new Promise((resolve) => {
        const dataset = [];
        const X = [];
        const y = []; // The labels we want to predict

        // Load dataset using csv-parser
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                const features = [
                    parseFloat(row.quiz_accuracy),
                    parseFloat(row.avg_video_completion),
                    parseFloat(row.revisit_rate),
                    parseFloat(row.study_time_per_day),
                    parseFloat(row.pause_frequency)
                ];

                // Since we didn't initially have a "final_score" to train on, 
                // we simulate a highly correlated actual_score based on features for ML training purposes.
                const simulated_score = Math.min(
                    100,
                    Math.max(0, (features[0] * 0.4) + (features[1] * 30) - (features[2] * 2) + Math.min(features[3] / 2, 20) + (Math.random() * 10 - 5))
                );

                dataset.push({ student_id: row.student_id, features, actual_score: simulated_score });
                X.push(features);
                y.push(simulated_score);
            })
            .on('end', () => {
                console.log(`\n======================================================`);
                console.log(`🧠 TASK 2.1: Performance Prediction Model (Random Forest)`);
                console.log(`======================================================`);
                console.log(`Training Model with ${dataset.length} samples...`);

                // Train the Random Forest Model
                const rfParams = {
                    seed: 42,
                    maxFeatures: 3,
                    replacement: true,
                    nEstimators: 50 // Number of trees
                };

                const regression = new RandomForestRegression(rfParams);
                regression.train(X, y);

                console.log(`Model Trained Successfully!`);
                console.log(`\nRunning Inference on random students...`);

                // Run Prediction on a few sample students
                const sampleStudents = dataset.slice(0, 5);
                sampleStudents.forEach(student => {
                    // Predict Final Grade based on behavior features
                    const [predicted_score] = regression.predict([student.features]);
                    const formattedScore = predicted_score.toFixed(1);
                    const category = getPerformanceCategory(predicted_score);

                    console.log(`Student ID         : ${student.student_id}`);
                    console.log(`Predicted Score    : ${formattedScore}%`);
                    console.log(`Performance        : ${category}`);
                    console.log(`-----------------------------------`);
                });

                resolve();
            });
    });
}

// ==================================================================
// TASK 2.2 — Weak Concept Detection
// ==================================================================

function runWeakConceptDetection() {
    console.log(`\n======================================================`);
    console.log(`🧠 TASK 2.2: Weak Concept Detection`);
    console.log(`======================================================`);

    // Load events
    let rawEvents = [];
    try {
        rawEvents = JSON.parse(fs.readFileSync(rawEventsPath, 'utf8'));
    } catch (err) {
        console.error("Missing raw_events_data.json");
        return;
    }

    const studentConceptStats = {};

    // Group indicators by student and by concept
    rawEvents.forEach(event => {
        const { student_id, event_type, video_id, quiz_id, score, duration } = event;

        let concept = null;
        if (video_id && courseTopics[video_id]) concept = courseTopics[video_id];
        if (quiz_id && courseTopics[quiz_id]) concept = courseTopics[quiz_id];

        if (!concept) return; // Skip if no mapping

        if (!studentConceptStats[student_id]) studentConceptStats[student_id] = {};
        if (!studentConceptStats[student_id][concept]) {
            studentConceptStats[student_id][concept] = {
                quiz_scores: [],
                replay_count: 0,
                pause_durations: [],
                total_pauses: 0
            };
        }

        const stats = studentConceptStats[student_id][concept];

        if (event_type === 'quiz_attempt') {
            stats.quiz_scores.push(score || 0);
        } else if (event_type === 'video_rewind') {
            stats.replay_count += 1;
        } else if (event_type === 'video_pause') {
            stats.total_pauses += 1;
            // Assuming duration here was pause duration for illustration
            if (duration) stats.pause_durations.push(duration);
        }
    });

    // Detect weak concepts based on business rules
    // Rule: if (avg_quiz_score < 40% AND replay_count >= 3) OR (avg_quiz_score < 50% and total_pauses > 5) -> "Weak Topic"

    let countFound = 0;
    for (const [student_id, concepts] of Object.entries(studentConceptStats)) {
        const weakTopics = [];

        for (const [conceptName, stats] of Object.entries(concepts)) {
            let avgScore = 100; // default passing if no quiz taken
            if (stats.quiz_scores.length > 0) {
                const total = stats.quiz_scores.reduce((a, b) => a + b, 0);
                avgScore = total / stats.quiz_scores.length;
            } else {
                // If they haven't taken the quiz but have replayed the video heavily (>5), they are struggling conceptually.
                if (stats.replay_count > 5) avgScore = 40;
            }

            const rule1 = (avgScore < 40 && stats.replay_count >= 3);
            const rule2 = (avgScore < 50 && stats.total_pauses >= 5);

            if (rule1 || rule2) {
                weakTopics.push(conceptName);
            }
        }

        if (weakTopics.length > 0) {
            if (countFound < 3) {
                console.log(`Student ID: ${student_id}`);
                console.log(`Weak Topics:`);
                weakTopics.forEach(t => console.log(` - ${t}`));
                console.log(``);
            }
            countFound++;
        }
    }

    if (countFound === 0) {
        console.log("No critically weak topics found across the student base with current rules.");
    } else {
        console.log(`Detected weak topics for ${countFound} students based on behavioral indicators.\n`);
    }

    // Save weak topics to analytics db for frontend consumption
    const dbData = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));

    // Inject weak topics 
    dbData.mlDataset.forEach(student => {
        student.weak_topics = studentConceptStats[student.student_id] ?
            Object.keys(studentConceptStats[student.student_id]).filter(conceptName => {
                const stats = studentConceptStats[student.student_id][conceptName];
                let avgScore = stats.quiz_scores.length > 0 ? (stats.quiz_scores.reduce((a, b) => a + b, 0) / stats.quiz_scores.length) : (stats.replay_count > 5 ? 40 : 100);
                return (avgScore < 40 && stats.replay_count >= 3) || (avgScore < 50 && stats.total_pauses >= 5);
            }) : [];
    });

    fs.writeFileSync(analyticsPath, JSON.stringify(dbData, null, 2));
    console.log(`✅ Saved Weak Concept Detection metrics back to analytics_db.json`);
}

// Execute orchestrator
async function execute() {
    await runPerformancePrediction();
    runWeakConceptDetection();
}

execute();
