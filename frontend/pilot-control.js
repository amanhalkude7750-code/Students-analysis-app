document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('pilot-cursor');
    const dwellCircle = document.getElementById('dwell-circle');
    const crosshair = document.getElementById('crosshair');
    const video = document.getElementById('webcam-video');
    
    const hudCommand = document.getElementById('hud-command');
    const hudAction = document.getElementById('hud-action');

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let dwellProgress = 0;
    let lastHoveredEl = null;

    // --- 1. WEBCAM SETUP ---
    async function setupWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            console.error("Webcam access denied:", err);
            // Non-critical for simulated pilot demo
        }
    }
    setupWebcam();

    // --- 2. CURSOR TRACKING (Simulated Head Tracking) ---
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
    });

    // --- 3. DWELL CLICK LOGIC ---
    function isInteractive(el) {
        if (!el) return false;
        return el.tagName === 'BUTTON' || 
               el.tagName === 'A' || 
               el.tagName === 'INPUT' || 
               el.onclick != null || 
               window.getComputedStyle(el).cursor === 'pointer';
    }

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(5)';
            ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            document.body.removeChild(ripple);
        }, 350);
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    }

    setInterval(() => {
        // Hide cursor to find element underneath
        cursor.style.display = 'none';
        const el = document.elementFromPoint(cursorX, cursorY);
        cursor.style.display = 'block';

        if (isInteractive(el)) {
            crosshair.classList.add('dwelling');
            if (el === lastHoveredEl) {
                dwellProgress += 5; // 5% per 50ms = 1 second to 100%
                
                if (dwellProgress >= 100) {
                    // TRIGGER CLICK
                    el.click();
                    createRipple(cursorX, cursorY);
                    speak("Clicked.");
                    hudAction.textContent = "DWELL CLICK";
                    
                    dwellProgress = 0;
                    lastHoveredEl = null; // reset to avoid instant double click
                }
            } else {
                lastHoveredEl = el;
                dwellProgress = 0;
            }
        } else {
            crosshair.classList.remove('dwelling');
            lastHoveredEl = null;
            dwellProgress = 0;
        }

        // Update Ring UI (226 is the circumference of the circle)
        const offset = 226 - (226 * dwellProgress) / 100;
        dwellCircle.style.strokeDashoffset = offset;

    }, 50);

    // --- 4. VOICE COMMANDS ---
    function setupVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            hudCommand.textContent = "NOT SUPPORTED";
            document.getElementById('voice-status').textContent = "VOICE_CMD: ERR";
            document.getElementById('voice-status').className = "status-off";
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('').toUpperCase();
            
            hudCommand.textContent = transcript;

            if (transcript.endsWith("SCROLL DOWN")) {
                window.scrollBy({ top: 300, behavior: 'smooth' });
                hudAction.textContent = "SCROLLING DOWN";
                speak("Scrolling down");
                recognition.stop();
            } else if (transcript.endsWith("SCROLL UP")) {
                window.scrollBy({ top: -300, behavior: 'smooth' });
                hudAction.textContent = "SCROLLING UP";
                speak("Scrolling up");
                recognition.stop();
            } else if (transcript.endsWith("CLICK") || transcript.endsWith("SELECT")) {
                hudAction.textContent = "VOICE CLICK";
                createRipple(cursorX, cursorY);
                speak("Clicking.");
                
                cursor.style.display = 'none';
                const el = document.elementFromPoint(cursorX, cursorY);
                cursor.style.display = 'block';
                if (el) el.click();
                
                recognition.stop();
            }
        };

        recognition.onend = () => {
            setTimeout(() => {
                try { recognition.start(); } catch(e){}
            }, 250);
        };

        try {
            recognition.start();
        } catch(e) {}
    }

    setupVoice();

    // Expose global function for demo buttons
    window.triggerDemo = function(actionName) {
        hudAction.textContent = `EXECUTED: ${actionName}`;
        speak(`${actionName} confirmed.`);
    };
});
