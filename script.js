// ==========================================================================
// CYBER SNAKE - MODERN ENGINE & CONTROLLER (WEB & MOBILE OPTIMIZED)
// ==========================================================================

// --- DOM References ---
const board = document.querySelector('.board');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const startBtn = document.querySelector('.btn-start');
const restartBtn = document.querySelector('.btn-restart');
const pauseBanner = document.querySelector('#pause-banner');
const resumeBtn = document.querySelector('#btn-resume');

// HUD Stats Elements
const highScoreElement = document.querySelector('#high-score');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#Time');
const speedIndicator = document.querySelector('#speed-indicator');

// Action Buttons
const pauseBtn = document.querySelector('#btn-pause');
const pauseIcon = document.querySelector('#pause-icon');
const soundBtn = document.querySelector('#btn-sound');
const soundIcon = document.querySelector('#sound-icon');
const videoDimBtn = document.querySelector('#btn-video-dim');
const dpadToggleBtn = document.querySelector('#btn-dpad-toggle');
const videoContainer = document.querySelector('.video-container');

// Game Over Summary Elements
const finalScoreElement = document.querySelector('#final-score');
const finalBestElement = document.querySelector('#final-best');
const finalTimeElement = document.querySelector('#final-time');
const finalLengthElement = document.querySelector('#final-length');
const newHighBadge = document.querySelector('#new-high-badge');

// Difficulty Buttons
const diffButtons = document.querySelectorAll('.diff-btn');

// Touch Controls Elements
const touchControls = document.querySelector('#touch-controls');
const dpadButtons = document.querySelectorAll('.dpad-btn[data-dir]');
const dpadPause = document.querySelector('#dpad-pause');

// --- Haptic Feedback for Mobile ---
function triggerHaptic(duration = 15) {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Haptics unavailable or restricted
        }
    }
}

// --- Audio System (Web Audio API Synthesizer) ---
let audioCtx = null;
let soundEnabled = localStorage.getItem('snake_sound_enabled') !== 'false'; // Default ON

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function updateSoundUI() {
    if (soundIcon) {
        soundIcon.innerText = soundEnabled ? '🔊' : '🔇';
    }
    soundBtn.title = soundEnabled ? 'Mute Sound (M)' : 'Unmute Sound (M)';
}
updateSoundUI();

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('snake_sound_enabled', soundEnabled);
    updateSoundUI();
    if (soundEnabled) {
        playSound('eat');
    }
});

function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'eat') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'bonus') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.05);

                gain.gain.setValueAtTime(0.18, now + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.15);
            });
        } else if (type === 'turn') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'over') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'victory') {
            [440, 554.37, 659.25, 880].forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            });
        }
    } catch (e) {
        console.warn('Audio playback error:', e);
    }
}

// --- Background Video Controls ---
let isDimmed = localStorage.getItem('snake_video_dimmed') === 'true';
function updateDimmingUI() {
    if (isDimmed) {
        videoContainer.classList.add('dimmed');
        videoDimBtn.title = "Enhance Background Video";
    } else {
        videoContainer.classList.remove('dimmed');
        videoDimBtn.title = "Dim Background Video (Focus Mode)";
    }
}
updateDimmingUI();

videoDimBtn.addEventListener('click', () => {
    isDimmed = !isDimmed;
    localStorage.setItem('snake_video_dimmed', isDimmed);
    updateDimmingUI();
});

// Auto-play video resilience on web and mobile
const bgVideo = document.getElementById('bg-video');
if (bgVideo) {
    const tryPlayVideo = () => {
        bgVideo.play().catch(() => {});
    };
    tryPlayVideo();
    document.addEventListener('touchstart', tryPlayVideo, { once: true });
    document.addEventListener('click', tryPlayVideo, { once: true });
}

// --- D-Pad Visibility Toggle (Mobile & Desktop) ---
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
let dpadPreference = localStorage.getItem('snake_dpad_preference');

function initDpadVisibility() {
    if (dpadPreference === 'hidden') {
        touchControls.classList.add('dpad-hidden');
        touchControls.classList.remove('dpad-visible');
        dpadToggleBtn.classList.remove('active');
    } else if (dpadPreference === 'visible') {
        touchControls.classList.remove('dpad-hidden');
        touchControls.classList.add('dpad-visible');
        dpadToggleBtn.classList.add('active');
    } else {
        // Default: Show on mobile/touch, hide on desktop
        if (isTouchDevice) {
            touchControls.classList.remove('dpad-hidden');
            dpadToggleBtn.classList.add('active');
        } else {
            touchControls.classList.remove('dpad-visible');
            dpadToggleBtn.classList.remove('active');
        }
    }
    updateBoardDimensions();
}

dpadToggleBtn.addEventListener('click', () => {
    const isCurrentlyHidden = touchControls.classList.contains('dpad-hidden') || 
        (!touchControls.classList.contains('dpad-visible') && !isTouchDevice);

    if (isCurrentlyHidden) {
        touchControls.classList.remove('dpad-hidden');
        touchControls.classList.add('dpad-visible');
        dpadToggleBtn.classList.add('active');
        localStorage.setItem('snake_dpad_preference', 'visible');
    } else {
        touchControls.classList.add('dpad-hidden');
        touchControls.classList.remove('dpad-visible');
        dpadToggleBtn.classList.remove('active');
        localStorage.setItem('snake_dpad_preference', 'hidden');
    }
    updateBoardDimensions();
});

// --- Game Configuration & State ---
const GRID_SIZE = 22; // 22 x 22 grid for optimal arcade proportions
let baseSpeed = 120; // Default ms per tick (Normal)
let currentSpeed = baseSpeed;
const rows = GRID_SIZE;
const cols = GRID_SIZE;

let highScore = parseInt(localStorage.getItem("highScore"), 10) || 0;
highScoreElement.innerText = highScore;

let score = 0;
let secondsCount = 0;
let isPaused = false;
let isGameRunning = false;

// Timing Handles
let animationFrameId = null;
let lastTickTimestamp = 0;
let timeIntervalId = null;
let bonusTimerId = null;

let direction = 'right';
let nextDirection = 'right';
let inputQueue = [];

let snake = [];
let food = { row: 10, col: 15 };
let bonusFood = null;
let foodsEaten = 0;
const blocks = {};

// Handle Difficulty Selection
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        baseSpeed = parseInt(btn.dataset.speed, 10);
        currentSpeed = baseSpeed;
    });
});

// --- Dynamic Responsive Grid Initialization ---
function updateBoardDimensions() {
    const isMobile = window.innerWidth <= 768;
    const headerEl = document.querySelector('.game-header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 60;
    
    // Check if touch controls are visible
    let dpadHeight = 0;
    if (touchControls && window.getComputedStyle(touchControls).display !== 'none') {
        dpadHeight = touchControls.offsetHeight || 135;
    }

    const paddingX = isMobile ? 18 : 48;
    const paddingY = isMobile ? 22 : 56;

    const maxW = window.innerWidth - paddingX;
    const maxH = window.innerHeight - headerHeight - dpadHeight - paddingY;

    // Board always fits viewport neatly without vertical scrolling
    const boardDimension = Math.floor(Math.max(220, Math.min(maxW, maxH, 560)));
    board.style.width = `${boardDimension}px`;
    board.style.height = `${boardDimension}px`;
}

function initGrid() {
    board.innerHTML = '';
    updateBoardDimensions();

    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const block = document.createElement('div');
            block.classList.add("block");
            board.appendChild(block);
            blocks[`${row},${col}`] = block;
        }
    }
}

// Window resize and orientation change handler
window.addEventListener('resize', updateBoardDimensions);
window.addEventListener('orientationchange', () => {
    setTimeout(updateBoardDimensions, 100);
});

// --- Food Spawn Helpers ---
function getRandomEmptyCell() {
    const emptyCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isOccupiedBySnake = snake.some(seg => seg.row === r && seg.col === c);
            const isOccupiedByFood = food && food.row === r && food.col === c;
            const isOccupiedByBonus = bonusFood && bonusFood.row === r && bonusFood.col === c;
            if (!isOccupiedBySnake && !isOccupiedByFood && !isOccupiedByBonus) {
                emptyCells.push({ row: r, col: c });
            }
        }
    }
    if (emptyCells.length === 0) return { row: 0, col: 0 };
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function spawnFood() {
    food = getRandomEmptyCell();
    foodsEaten++;

    // Spawn bonus golden food every 4 foods eaten
    if (foodsEaten % 4 === 0 && !bonusFood) {
        spawnBonusFood();
    }
}

function spawnBonusFood() {
    bonusFood = getRandomEmptyCell();
    clearTimeout(bonusTimerId);
    
    bonusTimerId = setTimeout(() => {
        if (bonusFood && blocks[`${bonusFood.row},${bonusFood.col}`]) {
            blocks[`${bonusFood.row},${bonusFood.col}`].classList.remove("bonus-food");
        }
        bonusFood = null;
    }, 7000);
}

// Floating Score Effect
function createFloatingScore(row, col, text, isBonus = false) {
    const targetBlock = blocks[`${row},${col}`];
    if (!targetBlock) return;
    
    const rect = targetBlock.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    
    const floater = document.createElement('div');
    floater.className = `floating-score ${isBonus ? 'bonus' : ''}`;
    floater.innerText = text;
    floater.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top - boardRect.top + rect.height / 2}px`;

    board.appendChild(floater);
    setTimeout(() => floater.remove(), 800);
}

// --- Main Game Loop (Deterministic requestAnimationFrame) ---
function gameLoop(timestamp) {
    if (!isGameRunning) return;

    if (!isPaused) {
        if (!lastTickTimestamp) lastTickTimestamp = timestamp;
        const delta = timestamp - lastTickTimestamp;

        if (delta >= currentSpeed) {
            updateGame();
            lastTickTimestamp = timestamp - (delta % currentSpeed);
        }
    } else {
        lastTickTimestamp = timestamp;
    }

    if (isGameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- Game Logic Update ---
function updateGame() {
    if (inputQueue.length > 0) {
        nextDirection = inputQueue.shift();
    }
    direction = nextDirection;

    let head = { ...snake[0] };

    if (direction === "left") head.col -= 1;
    else if (direction === "right") head.col += 1;
    else if (direction === "up") head.row -= 1;
    else if (direction === "down") head.row += 1;

    // 1. Boundary Collision Check
    if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
        triggerHaptic(50);
        gameOver();
        return;
    }

    // 2. Self Collision Check
    const selfCollision = snake.some((segment) => {
        return segment.row === head.row && segment.col === head.col;
    });

    if (selfCollision) {
        triggerHaptic(50);
        gameOver();
        return;
    }

    // Clear board classes
    Object.values(blocks).forEach(block => {
        block.className = 'block';
    });

    let ateFood = false;

    // 3. Regular Food Eaten Check
    if (head.row === food.row && head.col === food.col) {
        score += 10;
        ateFood = true;
        playSound('eat');
        triggerHaptic(18);
        createFloatingScore(food.row, food.col, '+10');
        spawnFood();
    }

    // 4. Bonus Golden Food Eaten Check
    if (bonusFood && head.row === bonusFood.row && head.col === bonusFood.col) {
        score += 50;
        ateFood = true;
        playSound('bonus');
        triggerHaptic(30);
        createFloatingScore(bonusFood.row, bonusFood.col, '+50 ⚡', true);
        clearTimeout(bonusTimerId);
        bonusFood = null;
    }

    // Progressive Speed Acceleration per session
    const speedTier = Math.min(5, Math.floor(score / 50));
    currentSpeed = Math.max(60, baseSpeed - speedTier * 8);
    speedIndicator.innerText = `${(1 + speedTier * 0.2).toFixed(1)}x`;

    // High Score Update
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore.toString());
    }

    scoreElement.innerText = score;
    highScoreElement.innerText = highScore;

    if (!ateFood) {
        snake.pop(); // Remove tail
    }

    // Place new head
    snake.unshift(head);

    // Draw Regular Food
    if (blocks[`${food.row},${food.col}`]) {
        blocks[`${food.row},${food.col}`].classList.add("food");
    }

    // Draw Bonus Food
    if (bonusFood && blocks[`${bonusFood.row},${bonusFood.col}`]) {
        blocks[`${bonusFood.row},${bonusFood.col}`].classList.add("bonus-food");
    }

    // Draw Snake Segments
    snake.forEach((segment, index) => {
        const block = blocks[`${segment.row},${segment.col}`];
        if (block) {
            block.classList.add("fill");
            if (index === 0) {
                block.classList.add("snake-head", `dir-${direction}`);
            } else if (index === snake.length - 1) {
                block.classList.add("snake-tail");
            }
        }
    });
}

// Initial Board Draw
function drawCurrentState() {
    Object.values(blocks).forEach(block => {
        block.className = 'block';
    });

    if (blocks[`${food.row},${food.col}`]) {
        blocks[`${food.row},${food.col}`].classList.add("food");
    }

    snake.forEach((segment, index) => {
        const block = blocks[`${segment.row},${segment.col}`];
        if (block) {
            block.classList.add("fill");
            if (index === 0) {
                block.classList.add("snake-head", `dir-${direction}`);
            } else if (index === snake.length - 1) {
                block.classList.add("snake-tail");
            }
        }
    });
}

// --- Game Timer System ---
function formatTime(totalSeconds) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function startTimer() {
    clearInterval(timeIntervalId);
    secondsCount = 0;
    timeElement.innerText = "00:00";
    timeIntervalId = setInterval(() => {
        if (!isPaused && isGameRunning) {
            secondsCount++;
            timeElement.innerText = formatTime(secondsCount);
        }
    }, 1000);
}

// --- Pause / Resume Mechanics ---
function togglePause() {
    if (!isGameRunning) return;
    isPaused = !isPaused;

    if (isPaused) {
        pauseBanner.classList.remove('hidden');
        pauseIcon.innerText = '▶️';
        pauseBtn.title = "Resume Game (Space)";
    } else {
        pauseBanner.classList.add('hidden');
        pauseIcon.innerText = '⏸️';
        pauseBtn.title = "Pause Game (Space)";
        playSound('turn');
    }
}

pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
if (dpadPause) dpadPause.addEventListener('click', togglePause);

// --- Game Over Logic ---
function gameOver() {
    isGameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    clearInterval(timeIntervalId);
    clearTimeout(bonusTimerId);

    const isNewRecord = score > 0 && score >= highScore;
    if (isNewRecord) {
        playSound('victory');
        newHighBadge.classList.remove('hidden');
    } else {
        playSound('over');
        newHighBadge.classList.add('hidden');
    }

    finalScoreElement.innerText = score;
    finalBestElement.innerText = highScore;
    finalTimeElement.innerText = formatTime(secondsCount);
    finalLengthElement.innerText = snake.length;

    modal.style.display = "flex";
    startGameModal.style.display = "none";
    gameOverModal.style.display = "flex";
}

// --- Game Start / Reset ---
function startGame() {
    isGameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    clearInterval(timeIntervalId);
    clearTimeout(bonusTimerId);

    getAudioContext();
    modal.style.display = "none";
    pauseBanner.classList.add('hidden');
    
    score = 0;
    secondsCount = 0;
    foodsEaten = 0;
    isPaused = false;
    bonusFood = null;
    currentSpeed = baseSpeed;

    scoreElement.innerText = "0";
    timeElement.innerText = "00:00";
    speedIndicator.innerText = "1.0x";
    pauseIcon.innerText = '⏸️';

    direction = 'right';
    nextDirection = 'right';
    inputQueue = [];

    const startRow = Math.floor(rows / 2);
    snake = [
        { row: startRow, col: 6 },
        { row: startRow, col: 5 },
        { row: startRow, col: 4 }
    ];

    food = getRandomEmptyCell();
    drawCurrentState();

    isGameRunning = true;
    lastTickTimestamp = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
    startTimer();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// --- Direction Queue & Key Handling ---
const opposites = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
};

function queueDirection(newDir) {
    if (!isGameRunning || isPaused) return;
    
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
    if (newDir !== lastDir && newDir !== opposites[lastDir]) {
        if (inputQueue.length < 2) {
            inputQueue.push(newDir);
            playSound('turn');
            triggerHaptic(8);
        }
    }
}

// Keyboard Controls (Web / Desktop)
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (event.code === "Space") {
        event.preventDefault();
        if (modal.style.display === "flex") {
            if (startGameModal.style.display !== "none") startBtn.click();
            else if (gameOverModal.style.display !== "none") restartBtn.click();
        } else {
            togglePause();
        }
        return;
    }

    if (key === 'm') {
        soundBtn.click();
        return;
    }

    if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        queueDirection('up');
    } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        queueDirection('down');
    } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        queueDirection('left');
    } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        queueDirection('right');
    } else if (key === 'enter') {
        if (modal.style.display === "flex") {
            if (startGameModal.style.display !== "none") startBtn.click();
            else if (gameOverModal.style.display !== "none") restartBtn.click();
        }
    }
});

// Touch / On-screen D-Pad Buttons (Mobile & Web)
dpadButtons.forEach(btn => {
    const handleDirPress = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('pressed');
        const dir = btn.getAttribute('data-dir');
        if (dir) queueDirection(dir);
    };

    const handleDirRelease = (e) => {
        btn.classList.remove('pressed');
    };

    btn.addEventListener('touchstart', handleDirPress, { passive: false });
    btn.addEventListener('touchend', handleDirRelease, { passive: false });
    btn.addEventListener('touchcancel', handleDirRelease, { passive: false });
    btn.addEventListener('mousedown', handleDirPress);
    btn.addEventListener('mouseup', handleDirRelease);
    btn.addEventListener('mouseleave', handleDirRelease);
});

// Mobile Touch Swipe Gestures
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.touch-controls') || e.target.closest('.modal-card') || e.target.closest('.hud-actions')) {
        return; // Don't interfere with buttons or modals
    }
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = Date.now();
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (e.target.closest('.touch-controls') || e.target.closest('.modal-card') || e.target.closest('.hud-actions')) {
        return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - touchStartTime;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    
    // Swipe gesture threshold (at least 20px within 800ms)
    if (touchDuration < 800 && (absDiffX > 20 || absDiffY > 20)) {
        if (absDiffX > absDiffY) {
            // Horizontal swipe
            if (diffX > 0) queueDirection('right');
            else queueDirection('left');
        } else {
            // Vertical swipe
            if (diffY > 0) queueDirection('down');
            else queueDirection('up');
        }
    }
}, { passive: true });

// Prevent default scrolling on mobile game container while playing
document.addEventListener('touchmove', (e) => {
    if (isGameRunning && !modal.style.display.includes('flex')) {
        if (!e.target.closest('.modal-card')) {
            e.preventDefault();
        }
    }
}, { passive: false });

// --- Initial Startup ---
initDpadVisibility();
initGrid();