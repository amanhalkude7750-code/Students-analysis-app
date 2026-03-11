document.addEventListener('DOMContentLoaded', async () => {

    // Custom Chart.js Default styling for Dark Theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // ====== FETCH CLASS ANALYTICS DATA FROM NEW ENDPOINT ======
    let classAnalytics = null;
    try {
        const res = await fetch('http://localhost:3000/api/v1/students/analytics/dashboard');
        const data = await res.json();
        if (data.success) {
            classAnalytics = data.data;
            
            // Update banner with dynamic data
            if (classAnalytics.risk_distribution) {
                const highRisk = classAnalytics.risk_distribution.high_risk_students || 0;
                document.querySelector('.banner-text p').innerHTML = `
                    AI Insights: ${highRisk} students are exhibiting high risk indicators. 
                    Current class average marks: ${classAnalytics.class_overview.avg_marks}/100
                `;
            }

            // Update metrics with actual data
            if (classAnalytics.class_overview) {
                const metrics = document.querySelectorAll('.metric-card');
                if (metrics[0]) metrics[0].querySelector('h3').textContent = classAnalytics.class_overview.avg_quiz_accuracy || '74%';
                if (metrics[1]) metrics[1].querySelector('h3').textContent = (classAnalytics.class_overview.avg_attendance || '74') + '%';
                if (metrics[2]) metrics[2].querySelector('h3').textContent = classAnalytics.class_overview.avg_marks + '%' || '5.2 hrs';
            }
        }
    } catch (err) {
        console.warn("Failed to fetch class analytics:", err);
    }

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
                    let color = '#333333';
                    if (idx === 1) color = '#666666';
                    if (idx === 2) color = '#999999';

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

    // ====== UPDATE AT-RISK STUDENTS TABLE WITH REAL DATA ======
    const updateAtRiskTable = async () => {
        const tbody = document.querySelector('.data-table tbody');
        if (!tbody) return;

        try {
            const res = await fetch('http://localhost:3000/api/v1/students/analytics/dashboard');
            const data = await res.json();

            if (data.success && data.data && data.data.at_risk_students) {
                const atRiskStudents = data.data.at_risk_students.slice(0, 4);
                
                tbody.innerHTML = atRiskStudents.map(student => `
                    <tr>
                        <td>Student #${student.student_id}</td>
                        <td>
                            <span style="font-size:0.85rem; color:var(--text-muted);">
                                <i class="fa-solid fa-graduation-cap"></i> ${student.standard} - ${student.subject}
                            </span>
                        </td>
                        <td>
                            <span style="font-size:0.85rem; color:calc(var(--text-main) * 0.8);">
                                Marks: <b>${student.marks}/100</b><br />
                                Att: <b>${student.attendance}%</b>
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${student.risk_level === 'HIGH' ? 'high-risk' : 'med-risk'}">
                                ${student.risk_level}
                            </span>
                        </td>
                        <td>${student.reason}</td>
                        <td><button class="action-btn">Message</button></td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.warn("Failed to update at-risk table:", err);
        }
    };
    updateAtRiskTable();

    // ====== UPDATE DISTRIBUTION BARS ======
    const updateDistributionBars = async () => {
        if (!classAnalytics || !classAnalytics.risk_distribution) return;

        const total = classAnalytics.risk_distribution.high_risk_students + 
                      classAnalytics.risk_distribution.medium_risk_students + 
                      classAnalytics.risk_distribution.low_risk_students;

        if (total > 0) {
            const topPct = (classAnalytics.risk_distribution.low_risk_students / total) * 100;
            const avgPct = (classAnalytics.risk_distribution.medium_risk_students / total) * 100;
            const riskPct = (classAnalytics.risk_distribution.high_risk_students / total) * 100;

            document.querySelectorAll('.dist-bar-bg')[0].querySelector('.dist-bar').style.width = topPct + '%';
            document.querySelectorAll('.dist-bar-bg')[1].querySelector('.dist-bar').style.width = avgPct + '%';
            document.querySelectorAll('.dist-bar-bg')[2].querySelector('.dist-bar').style.width = riskPct + '%';

            document.querySelectorAll('.distribution-row')[0].innerHTML = 
                `<span>Top Performers</span>
                 <div class="dist-bar-bg">
                     <div class="dist-bar top-perf" style="width: ${topPct}%;"></div>
                 </div>
                 <span>${classAnalytics.risk_distribution.low_risk_students} Students</span>`;

            document.querySelectorAll('.distribution-row')[1].innerHTML = 
                `<span>Average</span>
                 <div class="dist-bar-bg">
                     <div class="dist-bar avg-perf" style="width: ${avgPct}%;"></div>
                 </div>
                 <span>${classAnalytics.risk_distribution.medium_risk_students} Students</span>`;

            document.querySelectorAll('.distribution-row')[2].innerHTML = 
                `<span>At Risk</span>
                 <div class="dist-bar-bg">
                     <div class="dist-bar risk-perf" style="width: ${riskPct}%;"></div>
                 </div>
                 <span>${classAnalytics.risk_distribution.high_risk_students} Students</span>`;
        }
    };
    updateDistributionBars();

    // ====== REAL-TIME ACTIVITY MONITORING ======
    const monitorStudentActivity = async () => {
        if (!classAnalytics || !classAnalytics.at_risk_students) return;

        // Monitor each at-risk student's activity
        for (const student of classAnalytics.at_risk_students.slice(0, 5)) {
            try {
                const res = await fetch(`http://localhost:3000/api/v1/students/${student.student_id}/activity`);
                const activityData = await res.json();
                
                if (activityData.success && activityData.data) {
                    const activity = activityData.data;
                    // Activity data received - student is active
                    console.log(`Student ${student.student_id} activity: Velocity=${activity.learning_velocity.velocity}`);
                }
            } catch (err) {
                console.warn(`Failed to fetch activity for student ${student.student_id}:`, err);
            }
        }
    };

    // Monitor every 30 seconds
    monitorStudentActivity();
    setInterval(monitorStudentActivity, 30000);

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
                        'rgba(0, 0, 0, 0.2)',
                        'rgba(0, 0, 0, 0.4)',
                        'rgba(0, 0, 0, 0.6)',
                        'rgba(0, 0, 0, 0.8)',
                        'rgba(0, 0, 0, 1.0)'
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
        gradientLine.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        gradientLine.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        new Chart(ctxQuiz, {
            type: 'line',
            data: {
                labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
                datasets: [{
                    label: 'Class Avg Score',
                    data: [60, 65, 72, 70, 80], // Trending upwards
                    fill: true,
                    backgroundColor: gradientLine,
                    borderColor: '#333333',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#000000',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#000000',
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
                    gradientHot.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
                    gradientHot.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

                    new Chart(ctxVideo, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Difficulty / Friction Score',
                                data: frictionScores,
                                fill: true,
                                backgroundColor: gradientHot,
                                borderColor: '#000000',
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
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    titleColor: '#fff',
                                    bodyColor: '#000000',
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
                            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-main);">Audience Volume:</strong> <span style="color: var(--text-muted)">${data.data.total_views} distinct student watches</span> measured.</p>
                            <p style="margin-bottom: 0.5rem;"><strong style="color: var(--text-main);">Key Anomaly Detected:</strong> Massive difficulty spiking around Timestamp <strong style="color: #000000; font-size: 1.1rem;">${hardest.formatted_time}</strong>.</p>
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
