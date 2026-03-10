document.addEventListener('DOMContentLoaded', () => {
    // Determine Identity
    const storedUser = localStorage.getItem('activeUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const nameEl = document.getElementById('ui-username');
        const roleEl = document.getElementById('ui-userrole');
        const aiBannerEl = document.getElementById('ui-banner-name');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role.toUpperCase();
        if (aiBannerEl) aiBannerEl.textContent = user.name;
    }


    // Custom Chart.js Default styling for Dark Theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // -------------------------------------------------------------
    // FETCH LIVE VIDEO ANALYTICS VIA FIREBASE
    // -------------------------------------------------------------
    function setupRealTimeAnalytics() {
        if (!window.db) {
            setTimeout(setupRealTimeAnalytics, 500); // Retry until Firebase loads
            return;
        }

        const eventsRef = window.collection(window.db, "video_events");

        window.onSnapshot(eventsRef, (snapshot) => {
            let totalStudents = new Set();
            let totalWatchDuration = 0;
            let watchDurationCount = 0;
            let playEvents = 0;
            let completionEvents = 0;
            let videoReplays = {};

            snapshot.forEach((doc) => {
                const e = doc.data();
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
            let averageWatchTime = watchDurationCount > 0 ? (totalWatchDuration / watchDurationCount).toFixed(1) : 0;
            let completionRate = playEvents > 0 ? ((completionEvents / playEvents) * 100).toFixed(1) : 0;

            // Mock engagement trends based on events size to make dashboard alive
            let engagementTrends = [60, 65, 70, 75, Math.min(100, 80 + (snapshot.size % 20))];

            document.getElementById('metric-total-students').textContent = totalStudents.size;
            document.getElementById('metric-avg-watch-time').textContent = averageWatchTime + "s";
            document.getElementById('metric-completion-rate').textContent = completionRate + "%";
            document.getElementById('metric-most-replayed').textContent = mostReplayedVideo;

            // Update engagement trends chart if it has been drawn
            if (window.quizTrendChartConfig && window.quizTrendChartConfig.data.datasets[0]) {
                window.quizTrendChartConfig.data.datasets[0].data = engagementTrends;
                window.quizTrendChartConfig.update();
            }
        });
    }

    setupRealTimeAnalytics();

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

        window.quizTrendChartConfig = new Chart(ctxQuiz, {
            type: 'line',
            data: {
                labels: ['Start', 'Quarter', 'Halfway', 'Three-Quarters', 'End'],
                datasets: [{
                    label: 'Engagement Over Time',
                    data: [60, 65, 72, 70, 80], // Trending upwards, dynamically updated
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
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { callback: v => v }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // TASK 4.5: Video Interaction Heatmap (Timestamp vs Replay Count)
    // -------------------------------------------------------------
    const videoCanvas = document.getElementById('videoHeatmapChart');
    if (videoCanvas) {
        const ctxVideo = videoCanvas.getContext('2d');

        // Creating an area chart that flares up in red for viewing "Hotspots"
        const gradientHot = ctxVideo.createLinearGradient(0, 0, 0, 200);
        gradientHot.addColorStop(0, 'rgba(244, 63, 94, 0.8)'); // Red intensity representing heat
        gradientHot.addColorStop(1, 'rgba(244, 63, 94, 0.0)');

        new Chart(ctxVideo, {
            type: 'line',
            data: {
                labels: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00'],
                datasets: [{
                    label: 'Replay Count',
                    data: [2, 5, 25, 8, 4, 30, 45, 10], // Noticeable spike at 2:00, and massive spike at 6:00
                    fill: true,
                    backgroundColor: gradientHot,
                    borderColor: '#f43f5e',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 0,
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
                        padding: 10,
                        callbacks: {
                            label: (ctx) => ` Replays: ${ctx.parsed.y}`
                        }
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
    }

});
