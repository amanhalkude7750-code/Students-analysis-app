document.addEventListener('DOMContentLoaded', async () => {

    const coursesGrid = document.getElementById('all-courses-grid');

    try {
        // Fetch real course data from the backend API you just built
        const response = await fetch('http://localhost:3000/api/v1/courses');
        const data = await response.json();

        if (data.success && data.data) {
            coursesGrid.innerHTML = ''; // Clear the loader

            data.data.forEach(course => {

                // Determine layout rules based on ML tagging
                let aiTagHtml = '';
                let borderStyle = '1px solid var(--border-light)';
                let reasonHtml = `<p>${course.totalModules} Modules • Instructor: ${course.instructor}</p>`;

                if (course.aiRecommended) {
                    borderStyle = '1px solid var(--accent-purple)';
                    aiTagHtml = `<span class="course-tag ai-tag" style="margin-bottom: 0.5rem;"><i class="fa-solid fa-bolt"></i> AI RECOMMENDED</span>`;
                    reasonHtml = `<p style="color: var(--accent-purple); font-weight: 500;">${course.aiReason}</p>`;
                }

                // Card HTML Structure
                const card = `
                    <div class="course-card glass-card" style="border: ${borderStyle};">
                        ${course.thumbnail.includes('.png')
                        ? `<img src="${course.thumbnail}" class="course-img" alt="Thumbnail">`
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

    } catch (err) {
        console.error("Failed to load backend courses:", err);
        coursesGrid.innerHTML = `<div style="color: var(--accent-red); padding: 2rem;">Error: Cannot reach API at http://localhost:3000</div>`;
    }

});
