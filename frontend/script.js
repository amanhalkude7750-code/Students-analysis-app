document.addEventListener('DOMContentLoaded', async () => {
    // Determine Identity
    const storedUser = localStorage.getItem('activeUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const nameEl = document.getElementById('ui-username');
        const roleEl = document.getElementById('ui-userrole');
        const aiBannerEl = document.querySelector('.banner-text h1 .gradient-text');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role.toUpperCase();
        if (aiBannerEl) aiBannerEl.textContent = user.name.split(' ')[0];
    }

    async function loadFirebaseDashboard() {
        if (!window.db) {
            setTimeout(loadFirebaseDashboard, 500);
            return;
        }

        try {
            // Fetch Dashboard Data
            const dashRef = window.collection(window.db, "dashboard");
            const dashSnap = await window.getDocs(dashRef);

            if (!dashSnap.empty) {
                const d = dashSnap.docs[0].data();
                document.getElementById('ui-predicted-score').textContent = d.predictedScore + '%';
                document.getElementById('ui-risk-level').textContent = d.riskLevel;
                document.getElementById('ui-course-completion').textContent = d.courseCompletion + '%';
                document.getElementById('ui-progress-bar').style.width = d.courseCompletion + '%';
                document.getElementById('ui-daily-time').textContent = d.dailyTime + ' hrs';
                document.getElementById('ui-quiz-imp').textContent = d.quizImp;
                document.getElementById('ui-ai-insight').innerHTML = `<strong><i class="fa-solid fa-robot"></i> AI Analysis Complete</strong><br>${d.aiInsight}`;

                // Initialize charts
                const ctxProgress = document.getElementById('progressChart').getContext('2d');
                new Chart(ctxProgress, {
                    type: 'line',
                    data: {
                        labels: d.chartData.progressLabels,
                        datasets: [{
                            label: 'Progress Score',
                            data: d.chartData.progressScores,
                            borderColor: '#9d4edd',
                            backgroundColor: 'rgba(157, 78, 221, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });

                const ctxHeatmap = document.getElementById('heatmapChart').getContext('2d');
                new Chart(ctxHeatmap, {
                    type: 'bar',
                    data: {
                        labels: d.chartData.heatmapDays,
                        datasets: [{
                            label: 'Study Hours',
                            data: d.chartData.heatmapHours,
                            backgroundColor: '#06d6a0',
                            borderRadius: 4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }

            // Fetch AI Recommended Courses
            const coursesRef = window.collection(window.db, "courses");
            const coursesSnap = await window.getDocs(coursesRef);

            const grid = document.getElementById('ui-recommendation-grid');
            grid.innerHTML = '';

            coursesSnap.forEach(doc => {
                const course = doc.data();
                if (!course.aiRecommended) return;

                let borderStyle = '1px solid var(--accent-purple)';
                let aiTagHtml = `<span class="course-tag ai-tag" style="margin-bottom: 0.5rem;"><i class="fa-solid fa-bolt"></i> AI RECOMMENDED</span>`;
                let reasonHtml = `<p style="color: var(--accent-purple); font-weight: 500;">${course.aiReason}</p>`;

                const card = `
                    <div class="course-card glass-card" style="border: ${borderStyle};">
                        ${course.thumbnail.includes('-icon')
                        ? `<div class="course-img ${course.thumbnail}"></div>`
                        : `<img src="${course.thumbnail}" class="course-img" alt="Thumbnail">`
                    }
                        <div class="course-content">
                            ${aiTagHtml}
                            <h3>${course.title}</h3>
                            ${reasonHtml}
                            <div style="margin-top: 1rem;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem">
                                    <small style="color:var(--text-muted)">Progress: ${course.progress}%</small>
                                    <small style="color:var(--text-muted)">${course.completedModules}/${course.totalModules} Completed</small>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${course.progress}%; height: 100%; background: ${course.progress === 100 ? 'var(--accent-green)' : 'var(--grad-primary)'};"></div>
                                </div>
                            </div>
                            <div class="course-footer" style="padding-top: 1rem; margin-top: auto;">
                                <span class="duration"><i class="fa-regular fa-clock"></i> ${course.estCompletionTime}</span>
                                <button onclick="window.location.href='video-player.html?course=${encodeURIComponent(course.title)}'" class="btn-primary" style="padding: 0.4rem 1rem; width: auto; background: ${course.progress === 100 ? 'var(--accent-green)' : 'var(--grad-primary)'}">
                                    ${course.progress === 100 ? 'Review' : (course.progress === 0 ? 'Start' : 'Resume')}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                grid.innerHTML += card;
            });
        } catch (err) {
            console.error("Firebase Dashboard error:", err);
            document.getElementById('ui-ai-insight').innerHTML = `<strong style="color: red;">Error loading dashboard data from Firebase.</strong>`;
        }
    }

    loadFirebaseDashboard();
});
