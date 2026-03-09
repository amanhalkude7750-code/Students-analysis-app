document.addEventListener('DOMContentLoaded', () => {

    // Custom Chart.js Default styling for Dark Theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

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
