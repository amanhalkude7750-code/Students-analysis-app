document.addEventListener('DOMContentLoaded', async () => {

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // ====== GET STUDENT ID FROM URL OR USE FIRST STUDENT ======
    const urlParams = new URLSearchParams(window.location.search);
    let studentId = urlParams.get('id') || localStorage.getItem('studentId') || 1001;

    // 1. FETCH ACTUAL STUDENT DATA FROM BACKEND CSV
    let studentAnalysis = null;
    try {
        const response = await fetch(`http://localhost:3000/api/v1/students/${studentId}`);
        const db = await response.json();
        if (db.success && db.data) {
            studentAnalysis = db.data;
            
            // Update welcome banner with actual student info
            document.querySelector('.user-name').textContent = `Student ${studentAnalysis.personal_info.student_id}`;
            document.querySelector('.user-role').textContent = `${studentAnalysis.personal_info.standard} - ${studentAnalysis.personal_info.subject}`;
        }
    } catch (err) {
        console.warn("Failed to fetch student analysis from CSV. Using analytics DB.", err);
    }

    // FALLBACK: Fetch from analytics DB if CSV fetch fails
    let studentData = null;
    if (!studentAnalysis) {
        try {
            const response = await fetch('http://localhost:3000/api/v1/analytics');
            const db = await response.json();
            if (db && db.data && db.data.mlDataset && db.data.mlDataset.length > 0) {
                studentData = db.data.mlDataset[0];
            }
        } catch (err) {
            console.warn("Backend not reachable. Falling back to mock data.", err);
        }
    }

    // Dynamic Variables based on fetching
    let completionScore, quizAcc, studyDaily, revisitRate;
    
    if (studentAnalysis) {
        // Use CSV data
        completionScore = parseFloat(studentAnalysis.engagement_metrics.video_completion);
        quizAcc = parseFloat(studentAnalysis.academic_metrics.quiz_accuracy);
        studyDaily = studentAnalysis.engagement_metrics.study_time_hours;
        revisitRate = 3; // Mock value
    } else if (studentData) {
        // Use analytics DB
        completionScore = Math.round(studentData.avg_video_completion * 100);
        quizAcc = Math.round(studentData.quiz_accuracy);
        studyDaily = studentData.study_time_per_day;
        revisitRate = studentData.revisit_rate;
    } else {
        // Fallback mock
        completionScore = 60;
        quizAcc = 65;
        studyDaily = 2.5;
        revisitRate = 0.3;
    }

    let studyTime = [
        studyDaily / 2, studyDaily, studyDaily * 1.5, studyDaily * 0.5, studyDaily * 1.2, studyDaily * 0.8, studyDaily
    ];

    // Populating Basic DOM Elements with actual data
    document.getElementById('ui-course-completion').innerText = `${completionScore}%`;
    document.getElementById('ui-progress-bar').style.width = `${completionScore}%`;
    document.getElementById('ui-daily-time').innerText = `${studyDaily.toFixed(1)} hrs`;

    // 2. FETCH PREDICTIONS FROM AI PIPELINE SERVICES
    try {
        // AI Prediction - Final Score
        const resPerf = await fetch('http://localhost:3000/api/ai/predict-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quiz_accuracy: quizAcc,
                avg_video_completion: completionScore / 100,
                revisit_rate: revisitRate,
                study_time_per_day: studyDaily
            })
        });
        const perfData = await resPerf.json();
        document.getElementById('ui-predicted-score').innerText = perfData.data?.predicted_score || "78%";

        // AI Prediction - Dropout Risk
        const resRisk = await fetch('http://localhost:3000/api/ai/predict-risk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                study_time: studyDaily * 7,
                quiz_accuracy: quizAcc / 100,
                assignment_score: studentAnalysis?.academic_metrics?.assignment_score || 85,
                attendance_rate: studentAnalysis?.academic_metrics?.attendance_rate 
                    ? parseFloat(studentAnalysis.academic_metrics.attendance_rate) / 100 
                    : 0.9,
                video_completion: completionScore / 100,
                practice_attempts: studentAnalysis?.engagement_metrics?.practice_attempts || 12,
                session_consistency: studentAnalysis?.engagement_metrics?.session_consistency || 5,
                pause_frequency: studentAnalysis?.learning_behavior?.pause_frequency || 3,
                rewind_frequency: studentAnalysis?.learning_behavior?.rewind_frequency || 2,
                engagement_score: studentAnalysis?.engagement_metrics?.engagement_score 
                    ? parseFloat(studentAnalysis.engagement_metrics.engagement_score) / 100
                    : 0.8,
                term_marks: studentAnalysis?.academic_metrics?.term_marks || 85,
                total_attendance_days: studentAnalysis?.academic_metrics?.total_attendance_days || 190,
                extracurricular_hours: studentAnalysis?.learning_behavior?.extracurricular_hours || 5,
                discipline_incidents: studentAnalysis?.learning_behavior?.discipline_incidents || 0
            })
        });
        const riskResponse = await resRisk.json();
        const riskEl = document.getElementById('ui-risk-level');
        if (riskResponse.success && riskResponse.data) {
            const level = riskResponse.data.risk_level;
            const conf = Math.round(riskResponse.data.confidence * 100);
            riskEl.innerText = `${level} (${conf}%)`;
            if (level === 'HIGH') riskEl.style.color = 'var(--accent-red)';
            else if (level === 'MEDIUM') riskEl.style.color = 'var(--accent-orange)';
            else riskEl.style.color = 'var(--accent-green)';
        } else {
            riskEl.innerText = "Error";
            riskEl.style.color = 'var(--text-muted)';
        }

        // Task 8: Fetch Complete Recommendation Pipeline
        const resPipeline = await fetch(`http://localhost:3000/api/recommendations/${studentId}`);
        const pipelineData = await resPipeline.json();

        const weakTopics = pipelineData.data?.weak_topics || [];
        const recommendations = pipelineData.data?.recommendations || [];

        // Render Header Insight with Weak Topics
        let insightHTML = `<strong><i class="fa-solid fa-robot"></i> Your Analysis:</strong><br>`;
        
        if (studentAnalysis && studentAnalysis.risk_assessment.recommended_actions.length > 0) {
            insightHTML += `<strong style="color: #14b8a6;">Recommendations:</strong><br>`;
            insightHTML += studentAnalysis.risk_assessment.recommended_actions.slice(0, 3).map(r => `• ${r}`).join('<br>');
        } else if (weakTopics.length > 0) {
            insightHTML += `<strong>Weak Topics:</strong><br>• ${weakTopics.join('<br>• ')}`;
        } else {
            insightHTML += `You're performing well! Keep up the momentum.`;
        }
        
        document.getElementById('ui-ai-insight').innerHTML = insightHTML;
        const grid = document.getElementById('ui-recommendation-grid');
        grid.innerHTML = ''; // clear loading state

        recommendations.forEach((rec, idx) => {
            let icon = 'fa-play'; // default video
            if (rec.type === 'practice') icon = 'fa-code';
            if (rec.type === 'simulation') icon = 'fa-laptop-code';

            grid.innerHTML += `
               <div class="course-card glass-card" style="border: 1px solid var(--accent-purple);">
                    <div class="course-img" style="height: 100px; background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="course-content">
                        <span class="course-tag ai-tag">RECOMmENDED NEXT STEP</span>
                        <h3 style="font-size: 1.1rem; margin-top: 5px;">${rec.title}</h3>
                        <p>Part of your personalized learning path.</p>
                        <div class="course-footer" style="margin-top: auto;">
                            <span class="duration"><i class="fa-regular fa-clock"></i> AI Tutor</span>
                            <button class="btn-primary" style="padding: 0.4rem 0.8rem;">Start</button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.warn("AI Predictors not reachable. Fallback visuals maintained.");
    }


    // -------------------------------------------------------------
    // TASK 4.1: Learning Progress Graph (Time vs Score / Completion)
    // -------------------------------------------------------------
    const progressCanvas = document.getElementById('progressChart');
    if (progressCanvas) {
        const ctxProgress = progressCanvas.getContext('2d');
        const gradientLine = ctxProgress.createLinearGradient(0, 0, 0, 400);
        gradientLine.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        gradientLine.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

        new Chart(ctxProgress, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
                datasets: [{
                    label: 'Score / Completion %',
                    // Use fetched dynamic values to interpolate progress
                    data: [15, 28, 42, 40, quizAcc - 10, completionScore - 5, Math.max(quizAcc, completionScore)],
                    fill: true,
                    backgroundColor: gradientLine,
                    borderColor: '#3b82f6',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#3b82f6',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
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
                        bodyColor: '#3b82f6',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) { return ` Mastery: ${context.parsed.y}%`; }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: { callback: function (value) { return value + '%'; } }
                    },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // TASK 4.2: Engagement Heatmap (Days vs Study Time)
    // -------------------------------------------------------------
    const heatmapCanvas = document.getElementById('heatmapChart');
    if (heatmapCanvas) {
        const ctxHeatmap = heatmapCanvas.getContext('2d');
        const maxStudyTime = Math.max(...studyTime);

        const heatColors = studyTime.map(val => {
            const intensity = 0.3 + (0.7 * (val / maxStudyTime));
            return `rgba(249, 115, 22, ${intensity})`;
        });

        new Chart(ctxHeatmap, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Study Time (hrs)',
                    data: studyTime,
                    backgroundColor: heatColors,
                    borderRadius: 6,
                    borderWidth: 0,
                    barPercentage: 0.7
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
                        bodyColor: '#f97316',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                return ` Active Time: ${context.parsed.y.toFixed(1)} Hrs`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        title: { display: false, text: "Hours" }
                    },
                    x: { grid: { display: false, drawBorder: false } }
                }
            }
        });
    }

});
