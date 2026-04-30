/**
 * Dynamic Environment & Ghibli Kiwi Roamer System (SVG Animation Version)
 */

(function initEnvironmentSystem() {
    console.log("🌸 Environment System Initialized (SVG Animation)");

    // ==========================================
    // 1. Time-Of-Day Theming System
    // ==========================================
    function updateTimeTheme() {
        const hour = new Date().getHours();
        let theme = "";

        if (hour >= 5 && hour < 9) {
            theme = "morning";
        } else if (hour >= 9 && hour < 16) {
            theme = "noon"; 
        } else if (hour >= 16 && hour < 19) {
            theme = "dusk";
        } else {
            theme = "night";
        }

        document.body.setAttribute('data-theme', theme);
    }

    updateTimeTheme();
    setInterval(updateTimeTheme, 5 * 60 * 1000);

    // ==========================================
    // 2. SVG Kiwi Generator & 3D Parallax Roamer
    // ==========================================
    
    function createKiwiSVG(typeClass) {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 100 120");
        svg.setAttribute("class", `kiwi ${typeClass}`);
        
        // Sliced gradient kiwi colors are defined within SVG <defs>
        const coreWhite = "#F2F5E0"; // Center white core
        
        svg.innerHTML = `
            <defs>
                <!-- Green fleshy radial gradient -->
                <radialGradient id="green-grad-${typeClass}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stop-color="#DCECB2" />
                    <stop offset="40%" stop-color="#88B92E" />
                    <stop offset="100%" stop-color="#558B2F" />
                </radialGradient>
                <!-- Fuzzy brown skin radial gradient -->
                <radialGradient id="brown-grad-${typeClass}" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
                    <stop offset="0%" stop-color="#A16F4A" />
                    <stop offset="70%" stop-color="#795548" />
                    <stop offset="100%" stop-color="#4E342E" />
                </radialGradient>
            </defs>
            
            <!-- Legs (pivoting from hip) -->
            <line class="leg left-leg" x1="40" y1="90" x2="40" y2="120" stroke="var(--zen-ink)" stroke-width="4" stroke-linecap="round"/>
            <line class="leg right-leg" x1="60" y1="90" x2="60" y2="120" stroke="var(--zen-ink)" stroke-width="4" stroke-linecap="round"/>
            
            <!-- Body (Sliced Kiwi) -->
            <!-- Outer skin ring with gradient -->
            <ellipse class="body" cx="50" cy="55" rx="35" ry="40" fill="url(#brown-grad-${typeClass})" />
            <!-- Bright green flesh with gradient -->
            <ellipse class="body-inner" cx="50" cy="55" rx="31" ry="36" fill="url(#green-grad-${typeClass})" />
            <!-- White core -->
            <ellipse cx="50" cy="55" rx="10" ry="18" fill="${coreWhite}" opacity="0.9" />
            
            <!-- Seeds (Radial around core) -->
            <path d="M 46 42 L 47 44 M 54 42 L 53 44 M 38 52 L 41 53 M 62 52 L 59 53 M 40 64 L 43 62 M 60 64 L 57 62 M 48 70 L 49 67 M 52 70 L 51 67" stroke="#2C272E" stroke-width="1.5" stroke-linecap="round" />
            
            <!-- Arms (pivoting from shoulder) -->
            <line class="arm left-arm" x1="20" y1="60" x2="5" y2="80" stroke="var(--zen-ink)" stroke-width="3" stroke-linecap="round"/>
            <line class="arm right-arm" x1="80" y1="60" x2="95" y2="80" stroke="var(--zen-ink)" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Face (On top of the white core) -->
            <circle class="eye left-eye" cx="42" cy="45" r="4" fill="var(--zen-ink)" />
            <circle class="eye right-eye" cx="58" cy="45" r="4" fill="var(--zen-ink)" />
            
            <!-- Blush cheeks -->
            <ellipse class="blush" cx="34" cy="50" rx="4" ry="2" fill="#ff7070" opacity="0.8"/>
            <ellipse class="blush" cx="66" cy="50" rx="4" ry="2" fill="#ff7070" opacity="0.8"/>
            
            <!-- Tiny cute mouth overlapping the core -->
            <path class="mouth" d="M 47 54 Q 50 58 53 54" stroke="var(--zen-ink)" stroke-width="2" fill="none" stroke-linecap="round"/>
        `;
        return svg;
    }

    // Toggle logic injected as a global script
    window.toggleKiwiAnimation = function() {
        const container = document.getElementById('kiwi-container');
        if (container) {
            const isCurrentlyHidden = container.style.display === 'none';
            const willBeRunning = isCurrentlyHidden; // If it was hidden, it will now be running
            
            if (willBeRunning) {
                container.style.display = 'block';
                localStorage.setItem('kiwi_animation_enabled', 'true');
            } else {
                container.style.display = 'none';
                localStorage.setItem('kiwi_animation_enabled', 'false');
            }
            // Update button according to the NEW state
            updateToggleButtonState(willBeRunning);
        }
    };
    
    function updateToggleButtonState(kiwiIsRunning) {
        const btn = document.getElementById('kiwiToggleBtn');
        if (btn) {
            btn.innerHTML = kiwiIsRunning ? '🥝 隱藏kiwi' : '🥝 呼叫kiwi';
            btn.style.opacity = kiwiIsRunning ? '0.6' : '1';
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        // Retrieve preference
        const isEnabled = localStorage.getItem('kiwi_animation_enabled') !== 'false';
        
        if (!document.getElementById('kiwi-container')) {
            const container = document.createElement('div');
            container.id = 'kiwi-container';
            container.style.zIndex = '9999';
            if (!isEnabled) container.style.display = 'none';
            
            const familyGroup = document.createElement('div');
            familyGroup.className = 'kiwi-family';
            familyGroup.tabIndex = 0;
            familyGroup.setAttribute('role', 'img');
            familyGroup.setAttribute('aria-label', '我是 Kiwi, jogging');
            familyGroup.title = '我是 Kiwi · jogging';
            
            const dad = createKiwiSVG('dad');
            const son = createKiwiSVG('son');
            
            // Add a little soccer ball between them (hidden by default)
            const ball = document.createElement('div');
            ball.className = 'soccer-ball';
            ball.innerHTML = `
            <svg viewBox="0 0 20 20" width="18" height="18">
                <circle cx="10" cy="10" r="9" fill="#FFF" stroke="var(--zen-ink)" stroke-width="1.5" />
                <path d="M 10 5 L 13 8 L 11 12 L 7 12 L 6 8 Z" fill="var(--zen-ink)" />
                <line x1="10" y1="5" x2="10" y2="1" stroke="var(--zen-ink)" stroke-width="1" />
                <line x1="13" y1="8" x2="18" y2="7" stroke="var(--zen-ink)" stroke-width="1" />
                <line x1="11" y1="12" x2="15" y2="17" stroke="var(--zen-ink)" stroke-width="1" />
                <line x1="7" y1="12" x2="4" y2="17" stroke="var(--zen-ink)" stroke-width="1" />
                <line x1="6" y1="8" x2="2" y2="7" stroke="var(--zen-ink)" stroke-width="1" />
            </svg>`;
            
            familyGroup.appendChild(dad);
            familyGroup.appendChild(ball); // Ball explicitly between them structurally
            familyGroup.appendChild(son);

            const tooltip = document.createElement('div');
            tooltip.className = 'kiwi-tooltip';
            tooltip.textContent = '我是 Kiwi · jogging';
            familyGroup.appendChild(tooltip);
            
            container.appendChild(familyGroup);
            document.body.insertBefore(container, document.body.firstChild);
            
            startRoaming(familyGroup);
        }
        
        // Inject a floating control button
        if (!document.getElementById('kiwiToggleBtn')) {
            const btn = document.createElement('button');
            btn.id = 'kiwiToggleBtn';
            btn.onclick = window.toggleKiwiAnimation;
            btn.style.position = 'fixed';
            btn.style.bottom = '20px';
            btn.style.right = '20px';
            btn.style.zIndex = '10000';
            btn.style.padding = '8px 16px';
            btn.style.borderRadius = '999px';
            btn.style.border = '1px solid rgba(47, 67, 90, 0.2)';
            btn.style.background = 'rgba(255,255,255,0.8)';
            btn.style.backdropFilter = 'blur(10px)';
            btn.style.color = 'var(--zen-ink)';
            btn.style.fontFamily = 'inherit';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
            btn.style.transition = 'all 0.3s ease';
            
            document.body.appendChild(btn);
            updateToggleButtonState(isEnabled);
        }
    });

    function startRoaming(element) {
        function getKiwiActivityLabel() {
            if (element.classList.contains('action-soccer')) return 'play football';
            if (element.classList.contains('action-run')) return 'jogging';
            return 'jogging';
        }

        function updateKiwiTooltip() {
            const label = `我是 Kiwi · ${getKiwiActivityLabel()}`;
            element.title = label;
            element.setAttribute('aria-label', label);
            const tooltip = element.querySelector('.kiwi-tooltip');
            if (tooltip) tooltip.textContent = label;
        }

        function roam() {
            // Remove previous action and movement classes
            element.classList.remove('action-hug', 'action-lift', 'action-soccer', 'action-run');
            updateKiwiTooltip();
            
            // Fade out confetti if it exists
            const confettiLayer = document.getElementById('confetti-layer');
            if (confettiLayer) {
                confettiLayer.classList.remove('active');
            }
            
            // Random Scale for depth
            const scale = 0.5 + Math.random() * 0.7;
            element.style.setProperty('--family-scale', scale);
            
            // Limit roaming to either far left (0 to 15vw) OR far right (75 to 90vw)
            const isLeftRegion = Math.random() > 0.5;
            const targetX = isLeftRegion ? (2 + Math.random() * 15) : (75 + Math.random() * 15);
            
            // Determine if they RUN across instead of walk
            const isRunning = Math.random() > 0.7; // 30% chance to run
            if (isRunning) {
                element.classList.add('action-run');
            }
            updateKiwiTooltip();
            
            // Duration relies heavily on distance and scale.
            // If running, they traverse 3x faster.
            const baseTime = isRunning ? 2.5 : 8;
            const duration = baseTime / scale; 
            
            const bottomPercent = (1 - scale) * 15;

            // Face direction
            const currentLeftMatch = element.style.left.match(/([\d.-]+)vw/);
            const currentLeft = currentLeftMatch ? parseFloat(currentLeftMatch[1]) : -10;
            const isFacingLeft = targetX < currentLeft;
            const flipParam = isFacingLeft ? -1 : 1;
            element.style.setProperty('--family-dir', flipParam);
            
            element.style.transition = `left ${duration}s linear, transform 1.5s ease, bottom ${duration}s ease`;
            element.style.left = `${targetX}vw`;
            element.style.bottom = `${Math.max(0, bottomPercent)}%`;
            element.style.transform = `scale(${scale}) scaleX(${flipParam})`;

            const walkDelay = (duration * 1000);
            
            setTimeout(() => {
                // Determine if we trigger an interaction after stopping
                const interactionChance = Math.random();
                // We have 3 interaction types: Hug, Lift, Soccer. We trigger frequently (70% chance).
                if (interactionChance > 0.3) { 
                    const rand = Math.random();
                    let actionClass = 'action-hug';
                    
                    if (rand > 0.66) {
                        actionClass = 'action-soccer';
                        triggerConfetti(); // Fire celebration ribbons!
                    }
                    else if (rand > 0.33) {
                        actionClass = 'action-lift';
                    }
                    
                    element.classList.add(actionClass);
                    updateKiwiTooltip();
                    
                    // Interactions take roughly 4-5 seconds
                    setTimeout(roam, 4500 + Math.random() * 2000);
                } else {
                    // Just wait a normal pause duration then roam
                    setTimeout(roam, 1500 + Math.random() * 3000);
                }
            }, walkDelay);
        }

        setTimeout(roam, 500);
    }

    // Helper: Trigger falling confetti celebration
    function triggerConfetti() {
        let layer = document.getElementById('confetti-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'confetti-layer';
            document.body.appendChild(layer);
        }
        
        layer.innerHTML = '';
        layer.classList.add('active');
        
        const colors = ['#FF4C4C', '#FFD700', '#4CAF50', '#2196F3', '#FF9800', '#E91E63'];
        
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.left = Math.random() * 100 + 'vw';
            
            // Randomize falling
            const duration = 2.5 + Math.random() * 3; 
            const delay = Math.random() * 1.5; 
            piece.style.animationDuration = duration + 's';
            piece.style.animationDelay = delay + 's';
            
            layer.appendChild(piece);
        }
    }

})();
