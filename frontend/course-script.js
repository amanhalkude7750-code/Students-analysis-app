document.addEventListener('DOMContentLoaded', async () => {

    const coursesGrid = document.getElementById('all-courses-grid');

    try {
        // Fetch real course data from the backend API you just built
        const response = await fetch('/api/v1/courses');
        const data = await response.json();

        if (data.success && data.data) {
            let allCourses = data.data;

            function renderCourses(courses) {
                coursesGrid.innerHTML = '';
                if (courses.length === 0) {
                    coursesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No courses found for this category.</div>`;
                    return;
                }

                courses.forEach(course => {
                    let aiTagHtml = '';
                    let borderStyle = '1px solid var(--border-light)';
                    let reasonHtml = `<p>${course.totalModules} Modules • Instructor: ${course.instructor}</p>`;

                    if (course.aiRecommended) {
                        borderStyle = '1px solid var(--accent-purple)';
                        aiTagHtml = `<span class="course-tag ai-tag" style="margin-bottom: 0.5rem;"><i class="fa-solid fa-bolt"></i> AI RECOMMENDED</span>`;
                        reasonHtml = `<p style="color: var(--accent-purple); font-weight: 500;">${course.aiReason}</p>`;
                    }

                    const card = `
                        <div class="course-card glass-card" style="border: ${borderStyle};">
                            ${course.thumbnail.includes('.png') || course.thumbnail.includes('linear-gradient')
                            ? (course.thumbnail.includes('linear-gradient') 
                                ? `<div class="course-img" style="background: ${course.thumbnail}"></div>` 
                                : `<img src="${course.thumbnail}" class="course-img" alt="Thumbnail">`)
                            : `<div class="course-img ${course.thumbnail}"></div>`
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
                                    <button onclick="window.location.href='course-player.html?id=${course.id}'" class="btn-primary" style="padding: 0.4rem 1rem; width: auto; background: ${course.progress === 100 ? 'var(--accent-green)' : 'var(--grad-primary)'}">
                                        ${course.progress === 100 ? 'Review' : (course.progress === 0 ? 'Start' : 'Resume')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    coursesGrid.innerHTML += card;
                });
            }

            // Initial Render
            renderCourses(allCourses);

            // Filter functionality
            const filterBtns = document.querySelectorAll('.filter-btn');
            
            function applyFilter(filterType, btn) {
                filterBtns.forEach(b => b.classList.remove('active'));
                if (btn) btn.classList.add('active');
                
                let filtered;
                if (filterType === 'In Progress' || filterType === 'progress') {
                    filtered = allCourses.filter(c => c.progress > 0 && c.progress < 100);
                } else if (filterType === 'AI Recommended' || filterType === 'recommended') {
                    filtered = allCourses.filter(c => c.aiRecommended);
                } else if (filterType === 'Completed' || filterType === 'completed') {
                    filtered = allCourses.filter(c => c.progress === 100);
                } else {
                    filtered = allCourses;
                }
                renderCourses(filtered);
            }

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    applyFilter(btn.textContent.trim(), btn);
                });
            });

            // Handle URL Parameters
            const urlParams = new URLSearchParams(window.location.search);
            const initialFilter = urlParams.get('filter');
            if (initialFilter) {
                // Find matching button to maintain visual consistency
                const targetBtn = Array.from(filterBtns).find(b => {
                    const text = b.textContent.trim().toLowerCase();
                    return text.includes(initialFilter.toLowerCase()) || (initialFilter === 'progress' && text.includes('progress'));
                });
                applyFilter(initialFilter, targetBtn);
            }
        }

    } catch (err) {
        console.error("Failed to load backend courses:", err);
        coursesGrid.innerHTML = `<div style="color: var(--accent-red); padding: 2rem;">Error: Cannot reach the analytics API</div>`;
    }

});
