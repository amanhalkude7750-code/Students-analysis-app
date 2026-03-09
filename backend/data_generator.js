const fs = require('fs');
const path = require('path');

// Configuration for mock data generation
const NUM_STUDENTS = 20;
const NUM_VIDEOS = 5;
const NUM_QUIZZES = 3;
const EVENTS_PER_STUDENT = 50;

// Helper to generate a random ID
const generateId = (prefix, id) => `${prefix}_${id.toString().padStart(3, '0')}`;

// Helper to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate a random timestamp within the last 30 days
const getRandomTimestamp = () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    return pastDate.toISOString();
};

const eventTypes = [
    'video_play',
    'video_pause',
    'video_rewind',
    'video_complete',
    'quiz_attempt',
    'login',
    'logout'
];

function generateEvents() {
    const events = [];

    for (let s = 1; s <= NUM_STUDENTS; s++) {
        const studentId = generateId('student', s);

        // Generate login/logout patterns and learning sessions
        let sessionActive = false;
        let sessionStartTime = null;

        for (let i = 0; i < EVENTS_PER_STUDENT; i++) {
            const eventType = getRandomItem(eventTypes);
            const timestamp = getRandomTimestamp();
            const videoId = generateId('video', Math.floor(Math.random() * NUM_VIDEOS) + 1);
            const quizId = generateId('quiz', Math.floor(Math.random() * NUM_QUIZZES) + 1);

            let event = {
                student_id: studentId,
                event_type: eventType,
                timestamp: timestamp
            };

            // Add context based on event type
            if (eventType.startsWith('video_')) {
                event.video_id = videoId;
                if (eventType === 'video_play' || eventType === 'video_rewind') {
                    // Random duration watched in seconds
                    event.duration = Math.floor(Math.random() * 600);
                }
            } else if (eventType === 'quiz_attempt') {
                event.quiz_id = quizId;
                event.score = Math.floor(Math.random() * 100);
                event.duration = Math.floor(Math.random() * 1200); // Time taken in seconds
            } else if (eventType === 'logout' && sessionActive) {
                // Calculate session duration if we artificially tracked a login
                const diffMs = new Date(timestamp) - new Date(sessionStartTime);
                event.duration = Math.abs(Math.floor(diffMs / 1000)); // duration in seconds
                sessionActive = false;
            } else if (eventType === 'login') {
                sessionActive = true;
                sessionStartTime = timestamp;
            }

            events.push(event);
        }
    }

    // Sort events by timestamp to make it realistic
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return events;
}

const rawEvents = generateEvents();
const outputPath = path.join(__dirname, '../database', 'raw_events_data.json');

fs.writeFileSync(outputPath, JSON.stringify(rawEvents, null, 2));

console.log(`Successfully generated ${rawEvents.length} raw learning events!`);
console.log(`Data saved to: ${outputPath}`);
console.log('\nSample event:');
console.log(JSON.stringify(rawEvents[0], null, 2));
