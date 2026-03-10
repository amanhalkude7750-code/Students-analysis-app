document.addEventListener('DOMContentLoaded', () => {

    // Custom Chart.js Default styling for Dark Theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Fetch and populate Teacher Mini Leaderboard
    const fetchLeaderboard = async () => {
        const boardContainer = document.getElementById('teacher-mini-leaderboard');
        if (!boardContainer) return;

        try {
            const res = await fetch('http://localhost:3000/api/v1/leaderboard');
            const data = await res.json();

            if (data.success && data.data && data.data.length > 0) {
                boardContainer.innerHTML = ''; // clear loading state
                // Only show top 3 on dashboard widget
                const topStudents = data.data.slice(0, 3);

                topStudents.forEach((entry, idx) => {
                    let color = 'gold';
                    if (idx === 1) color = 'silver';
                    if (idx === 2) color = '#cd7f32';

                    boardContainer.innerHTML += `
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.3rem;">
                            <span><i class="fa-solid fa-award" style="color: ${color}"></i> ${entry.student_name}</span>
                            <span style="color: var(--accent-green); font-weight: 600">${entry.score}%</span>
                        </div>
                    `;
                });
            } else {
                boardContainer.innerHTML = '<span style="color: var(--text-muted)">No quiz data yet.</span>';
            }
        } catch (err) {
            boardContainer.innerHTML = '<span style="color: var(--accent-red)">Failed to load.</span>';
        }
    };
    fetchLeaderboard();

    // -------------------------------------------------------------
    // TASK 4.3: Topic Difficulty Chart (Topic vs Avg Score)
    // -------------------------------------------------------------
    const topicCanvas = document.getElementById('topicDifficultyChart');
    if (topicCanvas) {
        new Chart(topicCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'DP'],
                datasets: [{
                    label: 'Avg Score (%)',
                    data: [82, 75, 65, 48, 38], // Showing Graphs and DP as visibly difficult
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.6)', // Green (Good)
                        'rgba(59, 130, 246, 0.6)', // Blue
                        'rgba(249, 115, 22, 0.6)', // Orange
                        'rgba(244, 63, 94, 0.6)', // Red (Bad)
                        'rgba(244, 63, 94, 0.9)'  // Deep Red (Worse)
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 14, 23, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { callback: v => v + '%' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // TASK 4.4: Quiz Performance Trends (Quiz # vs Score)
    // -------------------------------------------------------------
    const quizCanvas = document.getElementById('quizTrendsChart');
    if (quizCanvas) {
        const ctxQuiz = quizCanvas.getContext('2d');
        const gradientLine = ctxQuiz.createLinearGradient(0, 0, 0, 400);
        gradientLine.addColorStop(0, 'rgba(20, 184, 166, 0.5)'); // Teal
        gradientLine.addColorStop(1, 'rgba(20, 184, 166, 0.0)');

        new Chart(ctxQuiz, {
            type: 'line',
            data: {
                labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
                datasets: [{
                    label: 'Class Avg Score',
                    data: [60, 65, 72, 70, 80], // Trending upwards
                    fill: true,
                    backgroundColor: gradientLine,
                    borderColor: '#14b8a6', // Teal
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#14b8a6',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 14, 23, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#14b8a6',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    y: {
                        min: 40,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { callback: v => v + '%' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // TASK 4.5: Video Interaction Heatmap (Real-Time)
    // -------------------------------------------------------------
    const videoCanvas = document.getElementById('videoLiveHeatmapChart');
    const analyticsContent = document.getElementById('video-analytics-content');

    if (videoCanvas && analyticsContent) {

        async function fetchVideoAnalytics() {
            try {
                // Fetch live telemetry for Course ID 1
                const res = await fetch('http://localhost:3000/api/v1/video-analytics/1');
                const data = await res.json();

                if (data.success && data.data && data.data.hotspots.length > 0) {

                    const labels = data.data.hotspots.map(h => h.formatted_time);
                    const frictionScores = data.data.hotspots.map(h => h.metrics.total_friction);

                    // Render Chart
                    const ctxVideo = videoCanvas.getContext('2d');
                    const gradientHot = ctxVideo.createLinearGradient(0, 0, 0, 200);
                    gradientHot.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
                    gradientHot.addColorStop(1, 'rgba(244, 63, 94, 0.0)');

                    new Chart(ctxVideo, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Difficulty / Friction Score',
                                data: frictionScores,
                                fill: true,
                                backgroundColor: gradientHot,
                                borderColor: '#f43f5e',
                                borderWidth: 2,
                                tension: 0.3,
                                pointRadius: 2,
                                pointHoverRadius: 5
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(10, 14, 23, 0.9)',
                                    titleColor: '#fff',
                                    bodyColor: '#f43f5e',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    borderWidth: 1,
                                    padding: 10
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(255,255,255,0.05)' }
                                },
                                x: {
                                    grid: { display: false }
                                }
                            }
                        }
                    });

                    // Render dynamic text analysis
                    const hardest = data.data.hardest_section;
                    if (hardest) {
                        analyticsContent.innerHTML = `
                            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-main);">Audience Volume:</strong> <span style="color: var(--accent-blue)">${data.data.total_views} distinct student watches</span> measured.</p>
                            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-main);">Key Anomaly Detected:</strong> Massive difficulty spiking around Timestamp <strong style="color: var(--accent-red); font-size: 1.1rem;">${hardest.formatted_time}</strong>.</p>
                            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-main);">Evidence:</strong> The engine detected <strong>${hardest.metrics.rewind}</strong> distinct back-skips and <strong>${hardest.metrics.pause}</strong> unexpected pauses during this isolated 10-second window.</p>
                            <p style="margin-bottom: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-light);"><strong style="color: var(--text-main);">AI Recommendation:</strong> We highly advise the teacher review their lesson delivery around the ${hardest.formatted_time} mark, as it is mathematically creating friction for learners.</p>
                        `;
                    } else {
                        analyticsContent.innerHTML = '<p>Insufficient friction data to isolate an anomaly.</p>';
                    }

                } else {
                    analyticsContent.innerHTML = '<p>No live interaction data logged yet. Open the student portal and interact with the video!</p>';
                }
            } catch (e) {
                console.error("Failed to load video heatmap:", e);
                analyticsContent.innerHTML = '<p style="color: var(--accent-red)">Failed to reach analytics engine endpoint.</p>';
            }
        }

        fetchVideoAnalytics();
    }

});
