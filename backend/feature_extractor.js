const fs = require('fs');
const path = require('path');

// Constants for mock length of a video (e.g., 600 seconds = 10 minutes)
const VIDEO_LENGTH_SEC = 600;
const TOTAL_DAYS_IN_PERIOD = 30; // Analyzing the last 30 days

// Load raw events
const rawEventsPath = path.join(__dirname, '../database', 'raw_events_data.json');
let rawEvents = [];
try {
    rawEvents = JSON.parse(fs.readFileSync(rawEventsPath, 'utf8'));
} catch (err) {
    console.error("Failed to load raw_events_data.json. Make sure to generate the data first.");
    process.exit(1);
}

// ------------------------------------------------------------------
// TASK 1.2 - Feature Extraction Logic
// ------------------------------------------------------------------

function extractFeatures() {
    console.log(`Processing ${rawEvents.length} raw events for feature extraction...`);

    const studentStats = {};
    const videoHotspots = {};

    // Group data by student for student-level features and by video for video-level features
    rawEvents.forEach(event => {
        const { student_id, event_type, timestamp, duration, score, video_id } = event;

        // --- 1. Processing Video-Level Metrics (Pause Hotspots) ---
        if (video_id && event_type === 'video_pause') {
            if (!videoHotspots[video_id]) videoHotspots[video_id] = {};
            // Mocking a pause timestamp based on duration or random if missing
            // In a real scenario, the raw event object would have 'video_timestamp'
            const pauseMoment = Math.floor(Math.random() * VIDEO_LENGTH_SEC);
            // Grouping into 10-second buckets for hotspots
            const bucket = Math.floor(pauseMoment / 10) * 10;
            videoHotspots[video_id][bucket] = (videoHotspots[video_id][bucket] || 0) + 1;
        }

        // --- 2. Processing Student-Level Metrics ---
        if (!studentStats[student_id]) {
            studentStats[student_id] = {
                videos_played: new Set(),
                total_duration_watched: 0,
                pause_count: 0,
                rewind_count: 0,
                module_completions: 0, // Combining video completes & quiz attempts
                total_study_time: 0,
                active_days: new Set(),
                quizzes_taken: 0,
                total_quiz_score: 0
            };
        }

        const stats = studentStats[student_id];
        const eventDate = new Date(timestamp).toDateString();
        stats.active_days.add(eventDate);

        switch (event_type) {
            case 'video_play':
                stats.videos_played.add(video_id);
                stats.total_duration_watched += duration || 0;
                stats.total_study_time += duration || 0;
                break;
            case 'video_pause':
                stats.pause_count += 1;
                break;
            case 'video_rewind':
                stats.rewind_count += 1;
                stats.total_study_time += duration || 0; // Time spent rewinding/re-watching
                break;
            case 'video_complete':
                stats.module_completions += 1;
                break;
            case 'quiz_attempt':
                stats.quizzes_taken += 1;
                stats.total_quiz_score += score || 0;
                stats.total_study_time += duration || 0;
                stats.module_completions += 1; // Count a quiz as a learning milestone
                break;
        }
    });

    // ------------------------------------------------------------------
    // TASK 1.3 - Build Feature Dataset 
    // Data schema: student_id, avg_video_completion, pause_frequency, 
    // quiz_accuracy, study_time_per_day, revisit_rate, consistency, learning_velocity
    // ------------------------------------------------------------------
    const mlDataset = [];

    for (const [student_id, stats] of Object.entries(studentStats)) {

        // 1. Revisit Rate: number of rewinds (replays) / total unique videos watched
        const uniqueVideos = stats.videos_played.size || 1; // avoid division by zero
        const revisit_rate = (stats.rewind_count / uniqueVideos).toFixed(2);

        // 2. Average Watch Completion
        // avg_completion = total_watched_duration / (unique_videos * standard_video_length)
        let total_possible_duration = uniqueVideos * VIDEO_LENGTH_SEC;
        let avg_video_completion = (stats.total_duration_watched / total_possible_duration).toFixed(2);
        if (avg_video_completion > 1) avg_video_completion = 1.0; // Cap at 100%

        // 3. Pause Frequency
        const pause_frequency = (stats.pause_count / uniqueVideos).toFixed(2);

        // 4. Quiz Accuracy
        const quiz_accuracy = stats.quizzes_taken > 0
            ? (stats.total_quiz_score / stats.quizzes_taken).toFixed(2)
            : 0;

        // 5. Study Session Consistency
        const consistency = (stats.active_days.size / TOTAL_DAYS_IN_PERIOD).toFixed(2);

        // 6. Study time per day (average over the period)
        const study_time_per_day = (stats.total_study_time / TOTAL_DAYS_IN_PERIOD).toFixed(2);

        // 7. Learning Velocity: modules completed (videos & quizzes) / total study time (in hours)
        const studyTimeHours = stats.total_study_time / 3600;
        const learning_velocity = studyTimeHours > 0
            ? (stats.module_completions / studyTimeHours).toFixed(2)
            : 0;

        mlDataset.push({
            student_id,
            avg_video_completion: parseFloat(avg_video_completion),
            pause_frequency: parseFloat(pause_frequency),
            quiz_accuracy: parseFloat(quiz_accuracy),
            study_time_per_day: parseFloat(study_time_per_day),
            revisit_rate: parseFloat(revisit_rate),
            consistency: parseFloat(consistency),
            learning_velocity: parseFloat(learning_velocity)
        });
    }

    return { mlDataset, videoHotspots };
}

// Execute feature extraction
const { mlDataset, videoHotspots } = extractFeatures();

// Output 1: Save as simulated Analytics Database Record (JSON)
const analyticsDbPath = path.join(__dirname, '../database', 'analytics_db.json');
fs.writeFileSync(analyticsDbPath, JSON.stringify({ mlDataset, videoHotspots }, null, 2));
console.log(`\n✅ Saved transformed analytics data to: analytics_db.json`);

// Output 2: Generate ML Training Dataset (CSV)
const csvPath = path.join(__dirname, '../database', 'ml_training_dataset.csv');
const csvHeaders = "student_id,avg_video_completion,pause_frequency,quiz_accuracy,study_time_per_day,revisit_rate,consistency,learning_velocity\n";
const csvRows = mlDataset.map(row =>
    `${row.student_id},${row.avg_video_completion},${row.pause_frequency},${row.quiz_accuracy},${row.study_time_per_day},${row.revisit_rate},${row.consistency},${row.learning_velocity}`
).join("\n");

fs.writeFileSync(csvPath, csvHeaders + csvRows);
console.log(`✅ Saved ML Training dataset to: ml_training_dataset.csv`);

// Print a preview of the dataset
console.log('\nPreview of Feature Dataset:');
console.table(mlDataset.slice(0, 5));

console.log('\nPreview of Pause Hotspots for a single video:');
const firstVideoId = Object.keys(videoHotspots)[0];
if (firstVideoId) {
    console.log(`Video ID: ${firstVideoId}`, videoHotspots[firstVideoId]);
}
