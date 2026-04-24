// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
if (firstScriptTag) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
    document.head.appendChild(tag);
}

// Global scope for YT
let isVideoEnded = false;
let isVideoStarted = false;
let player;

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('course-video', {
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
};

let lastPlayerTime = 0;
let checkInterval;

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isVideoStarted = true;
        // Start watching for skips
        checkInterval = setInterval(() => {
            const currentTime = player.getCurrentTime();
            // If jump is more than 3 seconds backwards -> Rewind
            if (lastPlayerTime - currentTime > 3) {
                logVideoEvent("rewind", currentTime);
            }
            // If jump is more than 3 seconds forwards -> Skip
            else if (currentTime - lastPlayerTime > 3) {
                logVideoEvent("skip", currentTime);
            }
            lastPlayerTime = currentTime;
        }, 1000);
    }

    if (event.data == YT.PlayerState.PAUSED) {
        clearInterval(checkInterval);
        logVideoEvent("pause", player.getCurrentTime());
    }

    if (event.data == YT.PlayerState.ENDED) {
        clearInterval(checkInterval);
        isVideoEnded = true;
        // Enable Quiz Button
        const btnStartQuiz = document.getElementById('btn-start-quiz');
        if (btnStartQuiz) {
            btnStartQuiz.style.background = 'var(--accent-blue)';
            btnStartQuiz.style.color = '#fff';
            btnStartQuiz.style.cursor = 'pointer';
            btnStartQuiz.disabled = false;
            btnStartQuiz.innerHTML = '<i class="fa-solid fa-unlock"></i> Start Quiz';
        }
    }
}

async function logVideoEvent(action, timestamp) {
    const urlParams = new URLSearchParams(window.location.search);
    const sId = urlParams.get('student_id') || localStorage.getItem('studentId') || 101;
    const cId = urlParams.get('id') || 1;

    try {
        await fetch('/api/v1/video-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                course_id: cId,
                student_id: sId,
                action: action,
                timestamp_sec: timestamp
            })
        });
    } catch (err) {
        console.error("Telemetry error:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const btnStartQuiz = document.getElementById('btn-start-quiz');
    const quizContainer = document.getElementById('quiz-container');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const quizResultText = document.getElementById('quiz-result');

    const saveNotesBtn = document.getElementById('save-notes-btn');
    const studentNotes = document.getElementById('student-notes');
    const aiSummaryBox = document.getElementById('ai-summary-box');
    const aiSummaryContent = document.getElementById('ai-summary-content');

    // 1. Video Watch handling relies on YT events defined above now


    // 2. 10 Dummy Questions for Quiz
    const dummyQuestions = [
        { q: "1. What is the foundational time complexity of a basic loop traversing an array?", ops: ["O(1)", "O(n)", "O(n^2)", "O(log n)"], a: 1 },
        { q: "2. Which of the following data structures operates on LIFO?", ops: ["Queue", "Tree", "Graph", "Stack"], a: 3 },
        { q: "3. In dynamic programming, overlapping subproblems are required.", ops: ["True", "False"], a: 0 },
        { q: "4. Which graph traversal uses a Queue?", ops: ["DFS", "BFS", "Dijkstras", "A*"], a: 1 },
        { q: "5. A Hash Table offers what time complexity for average insertions?", ops: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], a: 2 },
        { q: "6. Which sorting algorithm has an O(n log n) average case?", ops: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], a: 2 },
        { q: "7. A binary search requires the input array to be:", ops: ["Randomized", "Reversed", "Sorted", "Hashed"], a: 2 },
        { q: "8. What does DFS stand for?", ops: ["Direct File System", "Depth First Search", "Dynamic First Sequence", "Do Format String"], a: 1 },
        { q: "9. An array is a contiguous block of memory.", ops: ["True", "False"], a: 0 },
        { q: "10. Space complexity measures the amount of memory needed by an algorithm.", ops: ["True", "False"], a: 0 },
    ];

    btnStartQuiz.addEventListener('click', () => {
        if (!isVideoEnded) return;

        // Render Questions
        quizQuestionsContainer.innerHTML = '';
        dummyQuestions.forEach((item, index) => {
            let optionsHTML = '';
            item.ops.forEach((op, opIndex) => {
                optionsHTML += `<label style="display:block; margin: 0.5rem 0;"><input type="radio" name="q${index}" value="${opIndex}"> ${op}</label>`;
            });

            const qHTML = `
                <div class="question">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">${item.q}</p>
                    ${optionsHTML}
                </div>
            `;
            quizQuestionsContainer.innerHTML += qHTML;
        });

        quizContainer.style.display = 'block';
        btnStartQuiz.style.display = 'none'; // hide the start button once quiz begins
    });

    // Handling quiz submission
    submitQuizBtn.addEventListener('click', async () => {
        let score = 0;
        let answered = 0;

        dummyQuestions.forEach((item, index) => {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            if (selected) {
                answered++;
                if (parseInt(selected.value) === item.a) {
                    score++;
                }
            }
        });

        if (answered < 10) {
            alert("Please answer all 10 questions.");
            return;
        }

        const percentage = Math.round((score / 10) * 100);

        try {
            await fetch('/api/v1/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    student_name: JSON.parse(localStorage.getItem('activeUser') || '{}').name || "Alex Researcher",
                    score: percentage
                })
            });
        } catch (err) {
            console.error("Failed to sync quiz with server:", err);
        }

        quizResultText.innerText = `You scored ${percentage}% (${score}/10). Your telemetry data has been logged to the Analytics Pipeline.`;

        if (percentage >= 80) quizResultText.style.color = 'var(--accent-green)';
        else if (percentage >= 50) quizResultText.style.color = 'var(--accent-orange)';
        else quizResultText.style.color = 'var(--accent-red)';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student_id') || localStorage.getItem('studentId') || 101;
    const courseId = urlParams.get('id') || 1;

    // 3. Save Notes & Get AI Summarization
    saveNotesBtn.addEventListener('click', async () => {
        const text = studentNotes.value.trim();
        if (!text) {
            alert("Please write some notes before saving.");
            return;
        }

        saveNotesBtn.innerHTML = 'Summarizing <i class="fa-solid fa-spinner fa-spin"></i>';
        saveNotesBtn.disabled = true;

        try {
            // Use dynamic student and course IDs
            const payload = {
                student_id: studentId,
                course_id: courseId,
                notes: text
            };

            const response = await fetch('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                aiSummaryContent.innerText = data.summary;
                aiSummaryBox.style.display = 'block';
                saveNotesBtn.innerText = 'Saved & Summarized';
                saveNotesBtn.style.background = 'var(--accent-green)';
            } else {
                alert("Failed to get summary: " + data.message);
                saveNotesBtn.innerText = 'Save & Summarize';
                saveNotesBtn.disabled = false;
            }

        } catch (err) {
            console.error(err);
            alert("Could not connect to the backend notes endpoint.");
            saveNotesBtn.innerText = 'Save & Summarize';
            saveNotesBtn.disabled = false;
        }
    });

});
