// ==========================================
// RAT CASH VACUUM - PREMIUM GAME SYSTEM
// ==========================================

// ==========================================
// FIREBASE CLOUD DATABASE SETUP
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB4_8wz9zqTdRmFmIYvdFqQvzwyx1DszDw",
  authDomain: "rat-cash-vacuum.firebaseapp.com",
  projectId: "rat-cash-vacuum",
  storageBucket: "rat-cash-vacuum.appspot.com",
  messagingSenderId: "247351410090",
  appId: "1:247351410090:web:7bf7eba3adb27731dffd3",
  databaseURL: "https://rat-cash-vacuum-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

let db = null;
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    } catch (err) {
        console.error("Firebase init failed: ", err);
    }
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game UI Elements
const scoreValEl = document.getElementById('score-val');
const comboValEl = document.getElementById('combo-val');
const dangerBarEl = document.getElementById('danger-bar');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const startHighScoreEl = document.getElementById('start-high-score');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const gameContainer = document.getElementById('game-container');
const tutorialToast = document.getElementById('tutorial-toast');
const muteBtn = document.getElementById('mute-btn');
const feverBanner = document.getElementById('fever-banner');
const levelValEl = document.getElementById('level-val');
const levelUpBanner = document.getElementById('level-up-banner');
const levelUpTitle = document.getElementById('level-up-title');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const helpCloseBtn = document.getElementById('help-close-btn');
const introScreen = document.getElementById('intro-screen');
const introSkipBtn = document.getElementById('intro-skip-btn');
const introNextBtn = document.getElementById('intro-next-btn');
const introSlides = document.querySelectorAll('.intro-slide');
const watchIntroBtn = document.getElementById('watch-intro-btn');
let currentIntroSlide = 1;

// Modals & Action buttons
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
const sfxVolumeVal = document.getElementById('sfx-volume-val');
const bgmVolumeSlider = document.getElementById('bgm-volume-slider');
const bgmVolumeVal = document.getElementById('bgm-volume-val');

const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardCloseBtn = document.getElementById('leaderboard-close-btn');
const leaderboardResetBtn = document.getElementById('leaderboard-reset-btn');
const leaderboardBody = document.getElementById('leaderboard-body');

const achievementsModal = document.getElementById('achievements-modal');
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsCloseBtn = document.getElementById('achievements-close-btn');
const achievementsList = document.getElementById('achievements-list');

const nameInputModal = document.getElementById('name-input-modal');
const playerNameInput = document.getElementById('player-name-input');
const nameSubmitBtn = document.getElementById('name-submit-btn');

// Stats and game parameters
let stats = {
    totalCheeseEaten: 0,
    totalMoneyDeflected: 0,
    maxScoreSpace: 0,
    maxLevelReached: 0
};
let achievementsUnlocked = {};
let scoreWaitingForLeaderboard = null;
let leaderboardData = [];

// ==========================================
// SOUND & BGM MANAGER (Web Audio API Synthesizer)
// ==========================================
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.sfxVolume = 0.8;
        this.bgmVolume = 0.5;
        this.bgmTimeout = null;
        this.bgmTick = 0;
        // Cute 8-bit happy chiptune melody sequence
        this.bgmPattern = [
            0, 4, 7, 12, 11, 7, 4, 0,
            2, 5, 9, 14, 12, 9, 5, 2,
            4, 7, 11, 16, 14, 11, 7, 4,
            5, 9, 12, 17, 16, 12, 9, 5
        ];
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playChew() {
        this.init();
        if (!this.ctx || this.muted) return;
        
        // Short crunchy noise for biting
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playSlap() {
        this.init();
        if (!this.ctx || this.muted) return;

        // Slap sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playCoin() {
        this.init();
        if (!this.ctx || this.muted) return;

        // Retro coin sound
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.25);
    }

    playExplosion() {
        this.init();
        if (!this.ctx || this.muted) return;

        // Explosion noise rumble
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.9;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(20, now + 0.9);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01 * this.sfxVolume, now + 0.9);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
        noise.stop(now + 0.9);
    }

    playSizeUp() {
        this.init();
        if (!this.ctx || this.muted) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playLevelUp() {
        this.init();
        if (!this.ctx || this.muted) return;
        
        const now = this.ctx.currentTime;
        // Rising pentatonic chord A4 -> C5 -> E5 -> A5
        const notes = [440, 523.25, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15 * this.sfxVolume, now + idx * 0.08 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001 * this.sfxVolume, now + idx * 0.08 + 0.25);
            
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.25);
        });
    }

    playPowerUp() {
        this.init();
        if (!this.ctx || this.muted) return;

        // Rising retro bubble sound
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
    }

    playIncinerate() {
        this.init();
        if (!this.ctx || this.muted) return;

        // Fiss sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Play loop chiptune melody
    startBgm() {
        this.init();
        if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
        this.bgmTick = 0;
        this.playBgmStep();
    }

    playBgmStep() {
        if (!gameActive) {
            this.bgmTimeout = setTimeout(() => this.playBgmStep(), 500);
            return;
        }

        if (this.muted) {
            this.bgmTimeout = setTimeout(() => this.playBgmStep(), 300);
            return;
        }

        const now = this.ctx.currentTime;
        const noteIndex = this.bgmPattern[this.bgmTick % this.bgmPattern.length];
        
        // Scale note transposition if Fever Mode is active
        const trans = feverActive ? 5 : 0; // Transpose up 5 semitones in fever mode
        const freq = 130.81 * Math.pow(2, (noteIndex + trans) / 12); // Base C3

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle'; // classic retro GameBoy triangle wave
        osc.frequency.setValueAtTime(freq, now);
        
        // Increased volume to make BGM more exciting and balanced
        const vol = (feverActive ? 0.14 : 0.095) * this.bgmVolume;
        gainNode.gain.setValueAtTime(vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
        
        this.bgmTick++;
        
        // Calculate tempo delay based on current level (speeds up music per level!)
        // In fever mode, tempo speeds up significantly
        const baseDelay = feverActive ? 110 : (200 - (currentLevel * 20));
        const delay = Math.max(80, baseDelay);
        
        this.bgmTimeout = setTimeout(() => this.playBgmStep(), delay);
    }
}

const sounds = new SoundManager();

// ==========================================
// GAME STATE & VARIABLES
// ==========================================
let gameActive = false;
let score = 0;
let combo = 0;
let ratSizeLevel = 0; // 0: Normal, 1: Fat, 2: Bloated, 3: Exploded
let items = [];
let particles = [];
let floatingTexts = [];
let vortexRotation = 0;
let lastSpawnTime = 0;
let spawnInterval = 1300; // ms between spawns
let difficultyFactor = 1;
let globalTime = 0;
let shrinkComboCounter = 0; // count foods to shrink rat size
let showSlapEffect = false;
let slapEffectX = 0;
let slapEffectY = 0;
let slapEffectTimer = 0;
let selectedStage = 'void'; // 'void', 'sewer', 'kitchen', 'cheese'
let selectedSkin = 'default'; // 'default', 'chef', 'mafia', 'space'

// POWER-UP ACTIVE STATES
let freezeActive = false;
let freezeTimer = 0;
let magnetActive = false;
let magnetTimer = 0;
let chiliActive = false;
let chiliTimer = 0;

// FEVER MODE ACTIVE STATES
let feverActive = false;
let feverTimer = 0;
let feverCooldownTimer = 0;

// LEVEL & DIFFICULTY PROGRESSION STATE
let currentLevel = 1;
let levelUpPauseTimer = 0;

const LEVEL_CONFIGS = {
    1: { minScore: 0, maxScore: 50, speed: 1.0, interval: 1300, title: '🍼 หนูฝึกหัด' },
    2: { minScore: 51, maxScore: 150, speed: 1.1, interval: 1220, title: '🧀 นักชิมชีส' },
    3: { minScore: 151, maxScore: 300, speed: 1.2, interval: 1140, title: '🌀 เครื่องดูดฝุ่น' },
    4: { minScore: 301, maxScore: 500, speed: 1.3, interval: 1060, title: '🍿 หนูนักดูด' },
    5: { minScore: 501, maxScore: 750, speed: 1.4, interval: 980, title: '⚡ พลังเทอร์โบ' },
    6: { minScore: 751, maxScore: 1100, speed: 1.5, interval: 900, title: '🌪️ พายุจอมเขมือบ' },
    7: { minScore: 1101, maxScore: 1500, speed: 1.6, interval: 830, title: '🥇 จ้าวความเร็ว' },
    8: { minScore: 1501, maxScore: 1950, speed: 1.7, interval: 760, title: '🌟 เขมือบมาราธอน' },
    9: { minScore: 1951, maxScore: 2499, speed: 1.8, interval: 700, title: '🔥 พายุบ้าคลั่ง' },
    10: { minScore: 2500, maxScore: Infinity, speed: 2.0, interval: 630, title: '👑 ราชานักดูดไร้ขีดจำกัด' }
};

// Setup canvas size
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// RAT CHARACTER OBJECT (WITH SKINS & HATS)
// ==========================================
const rat = {
    x: 0,
    y: 0,
    baseRadius: 55,
    radius: 55,
    targetRadius: 55,
    mouthOpen: true,
    mouthClosedTimer: 0,
    mouthClosedDuration: 24, // frames (approx 0.4s)
    chewTimer: 0,
    eyeWince: false,
    sweatTimer: 0,
    sweatParticles: [],

    init() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 110;
        this.mouthOpen = true;
        this.mouthClosedTimer = 0;
        this.chewTimer = 0;
        this.radius = this.baseRadius;
        this.targetRadius = this.baseRadius;
        this.sweatParticles = [];
    },

    update() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 110;

        // Manage mouth closing duration
        if (!this.mouthOpen) {
            this.mouthClosedTimer--;
            if (this.mouthClosedTimer <= 0) {
                this.mouthOpen = true;
            }
        }

        // Manage chew animation timer
        if (this.chewTimer > 0) {
            this.chewTimer--;
        }

        // Calculate size target based on level
        const sizeMultipliers = [1.0, 1.45, 1.95];
        if (ratSizeLevel < 3) {
            this.targetRadius = this.baseRadius * sizeMultipliers[ratSizeLevel];
        } else {
            this.targetRadius = this.baseRadius * 2.5; // Final huge size before dying
        }

        // Smooth size transition
        this.radius += (this.targetRadius - this.radius) * 0.1;

        // Visual effects for swelling level
        if (ratSizeLevel === 2) {
            this.sweatTimer++;
            if (this.sweatTimer > 25) {
                this.sweatTimer = 0;
                this.sweatParticles.push({
                    x: this.x + (Math.random() - 0.5) * this.radius,
                    y: this.y - this.radius / 2,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -Math.random() * 2 - 1,
                    alpha: 1
                });
            }
        }

        // Update sweat particles
        for (let i = this.sweatParticles.length - 1; i >= 0; i--) {
            const p = this.sweatParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            if (p.alpha <= 0) {
                this.sweatParticles.splice(i, 1);
            }
        }
    },

    draw() {
        ctx.save();

        // 1. Draw Sweat Particles
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        this.sweatParticles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Pulsing glow if fat, bloated or chili active
        if (chiliActive) {
            ctx.shadowBlur = 25 + Math.sin(globalTime * 0.15) * 8;
            ctx.shadowColor = 'rgba(255, 50, 0, 0.8)';
        } else if (ratSizeLevel > 0) {
            const glowIntensity = ratSizeLevel === 1 ? 15 : 30;
            const pulseSpeed = ratSizeLevel === 1 ? 0.05 : 0.12;
            const glowColor = ratSizeLevel === 1 ? 'rgba(255, 94, 0, 0.4)' : 'rgba(255, 0, 60, 0.6)';
            
            ctx.shadowBlur = glowIntensity + Math.sin(globalTime * pulseSpeed) * 8;
            ctx.shadowColor = glowColor;
        }

        // Shake if bloating, size 2, or chili pepper fire
        let shakeX = 0;
        let shakeY = 0;
        if (ratSizeLevel === 2 || chiliActive) {
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        } else if (ratSizeLevel === 3) {
            shakeX = (Math.random() - 0.5) * 10;
            shakeY = (Math.random() - 0.5) * 10;
        }

        ctx.translate(this.x + shakeX, this.y + shakeY);

        // Body Color selection
        let bodyColor = '#8077a3';
        let tummyColor = '#b5add6';
        if (chiliActive) {
            bodyColor = '#ff2200'; // Chili fire red
            tummyColor = '#ff9988';
        } else if (ratSizeLevel === 1) {
            bodyColor = '#8c70a8'; // reddish tint
            tummyColor = '#cfbedb';
        } else if (ratSizeLevel >= 2) {
            bodyColor = '#a85b82'; // bloated red
            tummyColor = '#e6bed3';
        }

        // Draw space backpack if astronaut skin
        if (selectedSkin === 'space') {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 3;
            // Left backpack block
            ctx.fillRect(-this.radius * 0.95, -this.radius * 0.4, this.radius * 0.3, this.radius * 0.8);
            ctx.strokeRect(-this.radius * 0.95, -this.radius * 0.4, this.radius * 0.3, this.radius * 0.8);
            // Right backpack block
            ctx.fillRect(this.radius * 0.65, -this.radius * 0.4, this.radius * 0.3, this.radius * 0.8);
            ctx.strokeRect(this.radius * 0.65, -this.radius * 0.4, this.radius * 0.3, this.radius * 0.8);
        }

        // --- DRAW BODY ---
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.9, this.radius * 0.8);
        ctx.quadraticCurveTo(-this.radius * 1.1, -this.radius * 0.2, -this.radius * 0.6, -this.radius * 0.9);
        ctx.quadraticCurveTo(0, -this.radius * 1.3, this.radius * 0.6, -this.radius * 0.9);
        ctx.quadraticCurveTo(this.radius * 1.1, -this.radius * 0.2, this.radius * 0.9, this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.9, this.radius * 0.8);
        ctx.fill();

        // Tummy
        ctx.fillStyle = tummyColor;
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.25, this.radius * 0.68, 0, Math.PI * 2);
        ctx.fill();

        // --- DRAW EARS ---
        // Left Ear
        ctx.save();
        ctx.translate(-this.radius * 0.7, -this.radius * 0.95);
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9ebb'; // pink inner ear
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right Ear
        ctx.save();
        ctx.translate(this.radius * 0.7, -this.radius * 0.95);
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9ebb';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- DRAW EYES ---
        const eyeOffset = this.radius * 0.28;
        const eyeY = -this.radius * 0.55;
        const eyeRadius = Math.max(3, this.radius * 0.08);

        ctx.fillStyle = '#110c26';

        // Animate eyes (wince if slapped/closed, chewing, normal)
        if (!this.mouthOpen) {
            // SLAPPED / PAIN EYES: Crosses "X X"
            ctx.strokeStyle = '#110c26';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            // Left Eye cross
            ctx.beginPath();
            ctx.moveTo(-eyeOffset - eyeRadius * 1.2, eyeY - eyeRadius * 1.2);
            ctx.lineTo(-eyeOffset + eyeRadius * 1.2, eyeY + eyeRadius * 1.2);
            ctx.moveTo(-eyeOffset + eyeRadius * 1.2, eyeY - eyeRadius * 1.2);
            ctx.lineTo(-eyeOffset - eyeRadius * 1.2, eyeY + eyeRadius * 1.2);
            ctx.stroke();

            // Right Eye cross
            ctx.beginPath();
            ctx.moveTo(eyeOffset - eyeRadius * 1.2, eyeY - eyeRadius * 1.2);
            ctx.lineTo(eyeOffset + eyeRadius * 1.2, eyeY + eyeRadius * 1.2);
            ctx.moveTo(eyeOffset + eyeRadius * 1.2, eyeY - eyeRadius * 1.2);
            ctx.lineTo(eyeOffset - eyeRadius * 1.2, eyeY + eyeRadius * 1.2);
            ctx.stroke();
        } 
        else if (this.chewTimer > 0) {
            // Happy closed eyes (^ ^)
            ctx.strokeStyle = '#110c26';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            
            // Left Eye happy curve
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, eyeRadius * 1.2, Math.PI, 0, false);
            ctx.stroke();

            // Right Eye happy curve
            ctx.beginPath();
            ctx.arc(eyeOffset, eyeY, eyeRadius * 1.2, Math.PI, 0, false);
            ctx.stroke();
        } 
        else {
            // Wide open cute eyes with shine
            // Left Eye
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            // Right Eye
            ctx.beginPath();
            ctx.arc(eyeOffset, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeOffset - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.3, 0, Math.PI * 2);
            ctx.arc(eyeOffset - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- DRAW HATS / SKIN CUSTOMIZATION ACCESSORIES ---
        if (selectedSkin === 'mafia') {
            // COOL SUNGLASSES
            ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
            ctx.strokeStyle = '#ffcc00'; // gold frame
            ctx.lineWidth = 2;
            // Left lens
            ctx.beginPath();
            ctx.roundRect(-eyeOffset - 12, eyeY - 8, 24, 16, 4);
            ctx.fill();
            ctx.stroke();
            // Right lens
            ctx.beginPath();
            ctx.roundRect(eyeOffset - 12, eyeY - 8, 24, 16, 4);
            ctx.fill();
            ctx.stroke();
            // Bridge
            ctx.beginPath();
            ctx.moveTo(-eyeOffset + 12, eyeY - 2);
            ctx.lineTo(eyeOffset - 12, eyeY - 2);
            ctx.stroke();
        } 
        else if (selectedSkin === 'chef') {
            // CHEF HAT
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#dddddd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Chef hat base
            ctx.roundRect(-this.radius * 0.45, -this.radius * 1.5, this.radius * 0.9, this.radius * 0.25, 4);
            ctx.fill();
            ctx.stroke();

            // Chef hat crown puffy bubbles
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.4, -this.radius * 1.5);
            ctx.bezierCurveTo(-this.radius * 0.7, -this.radius * 2.2, -this.radius * 0.3, -this.radius * 2.3, -this.radius * 0.1, -this.radius * 1.95);
            ctx.bezierCurveTo(0, -this.radius * 2.4, this.radius * 0.3, -this.radius * 2.3, this.radius * 0.15, -this.radius * 1.95);
            ctx.bezierCurveTo(this.radius * 0.3, -this.radius * 2.1, this.radius * 0.6, -this.radius * 2.2, this.radius * 0.4, -this.radius * 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // --- DRAW NOSE ---
        ctx.fillStyle = '#ff7da0';
        ctx.beginPath();
        ctx.arc(0, -this.radius * 0.38, this.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // --- DRAW MOUTH ---
        const mouthY = -this.radius * 0.2;
        if (this.mouthOpen) {
            // Chew animation fluctuates mouth open size
            const chewScale = this.chewTimer > 0 ? (0.5 + Math.sin(globalTime * 0.7) * 0.3) : 1.0;
            
            ctx.fillStyle = '#211333';
            ctx.beginPath();
            ctx.ellipse(0, mouthY, this.radius * 0.22, this.radius * 0.22 * chewScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cute teeth
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.radius * 0.06, mouthY - this.radius * 0.22 * chewScale, this.radius * 0.05, this.radius * 0.07);
            ctx.fillRect(0.01, mouthY - this.radius * 0.22 * chewScale, this.radius * 0.05, this.radius * 0.07);

            // Red tongue
            ctx.fillStyle = '#ff4d6e';
            ctx.beginPath();
            ctx.arc(0, mouthY + this.radius * 0.12 * chewScale, this.radius * 0.12, 0, Math.PI, true);
            ctx.fill();
        } else {
            // Closed/blocked mouth in pain (wobbly squiggly line)
            ctx.strokeStyle = '#110c26';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            const w = this.radius * 0.18;
            ctx.moveTo(-w, mouthY);
            ctx.bezierCurveTo(-w/2, mouthY + 5, 0, mouthY - 5, w/2, mouthY + 3);
            ctx.lineTo(w, mouthY - 2);
            ctx.stroke();

            // Slashed/stressed red cheeks for hit effect
            ctx.fillStyle = '#ff3366';
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.arc(-this.radius * 0.32, mouthY, 5, 0, Math.PI * 2);
            ctx.arc(this.radius * 0.32, mouthY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Draw astronaut space helmet bubble overlay
        if (selectedSkin === 'space') {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
            ctx.fillStyle = 'rgba(0, 240, 255, 0.07)';
            ctx.lineWidth = 3.5;
            
            // Helmet sphere
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.35, this.radius * 1.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Glass highlight arc
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.35, this.radius * 0.9, -Math.PI * 0.7, -Math.PI * 0.35);
            ctx.stroke();
        }

        ctx.restore();
    },

    getMouthX() { return this.x; },
    getMouthY() { return this.y - this.radius * 0.25; },

    slapClosed() {
        if (this.mouthOpen) {
            this.mouthOpen = false;
            this.mouthClosedTimer = this.mouthClosedDuration;
            
            // Set up slap visual effect coords
            showSlapEffect = true;
            slapEffectX = this.getMouthX();
            slapEffectY = this.getMouthY();
            slapEffectTimer = 10;
            
            sounds.playSlap();
        }
    }
};

// ==========================================
// ITEM CLASSES (FOOD, MONEY, POWER-UPS)
// ==========================================
const ITEM_TYPES = {
    // Foods (Score +5)
    CHEESE: { name: 'cheese', score: 5, isMoney: false, color: '#ffcc00' },
    STRAWBERRY: { name: 'strawberry', score: 5, isMoney: false, color: '#ff2d55' },
    GRAPE: { name: 'grape', score: 5, isMoney: false, color: '#aa00ff' },
    GOLDEN_CHEESE: { name: 'golden_cheese', score: 10, isMoney: false, color: '#ffec5c', isSpecial: true },
    
    // Power-ups
    FREEZE_BERRY: { name: 'freeze_berry', score: 0, isMoney: false, color: '#00f0ff', isPowerUp: true },
    MAGNET: { name: 'magnet', score: 0, isMoney: false, color: '#39ff14', isPowerUp: true },
    CHILI: { name: 'chili', score: 0, isMoney: false, color: '#ff5e00', isPowerUp: true },
    
    // Money (Avoid!)
    COIN: { name: 'coin', isMoney: true, color: '#ffd700' },
    BILL: { name: 'bill', isMoney: true, color: '#4cd964' }
};

class GameItem {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 18;
        this.type = null;
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.alpha = 1;
        this.state = 'sucked'; // sucked, bouncing
        
        this.reset();
    }

    reset() {
        const side = Math.random();
        if (side < 0.6) {
            this.x = Math.random() * canvas.width;
            this.y = -30;
        } else if (side < 0.8) {
            this.x = -30;
            this.y = Math.random() * (canvas.height * 0.5);
        } else {
            this.x = canvas.width + 30;
            this.y = Math.random() * (canvas.height * 0.5);
        }

        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1;

        // Fever mode spawns ONLY food items
        if (feverActive) {
            const foodRand = Math.random();
            if (foodRand < 0.3) this.type = ITEM_TYPES.CHEESE;
            else if (foodRand < 0.6) this.type = ITEM_TYPES.STRAWBERRY;
            else if (foodRand < 0.85) this.type = ITEM_TYPES.GRAPE;
            else this.type = ITEM_TYPES.GOLDEN_CHEESE;
        } else {
            // Normal spawner
            const rand = Math.random();
            
            // Adjust money spawn rate based on level to increase difficulty
            let moneyThreshold = 0.70; // Default: 30% money chance (rand >= 0.70)
            if (currentLevel >= 8) {
                moneyThreshold = 0.58; // 42% money chance at Level 8-10
            } else if (currentLevel >= 5) {
                moneyThreshold = 0.64; // 36% money chance at Level 5-7
            }
            
            if (rand < moneyThreshold * 0.785) {
                // Regular food
                const foodRand = Math.random();
                if (foodRand < 0.4) this.type = ITEM_TYPES.CHEESE;
                else if (foodRand < 0.7) this.type = ITEM_TYPES.STRAWBERRY;
                else this.type = ITEM_TYPES.GRAPE;
            } 
            else if (rand < moneyThreshold * 0.885) {
                // Special Golden Cheese
                this.type = ITEM_TYPES.GOLDEN_CHEESE;
            } 
            else if (rand < moneyThreshold) {
                // Power-up items
                const pwRand = Math.random();
                if (pwRand < 0.33) this.type = ITEM_TYPES.FREEZE_BERRY;
                else if (pwRand < 0.66) this.type = ITEM_TYPES.MAGNET;
                else this.type = ITEM_TYPES.CHILI;
            } 
            else {
                // Money items (Avoid!)
                const moneyRand = Math.random();
                this.type = (moneyRand < 0.65) ? ITEM_TYPES.COIN : ITEM_TYPES.BILL;
            }
        }

        this.radius = (this.type.isSpecial || this.type.isPowerUp) ? 22 : 16;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'sucked';
        this.alpha = 1;
    }

    update() {
        const mouthX = rat.getMouthX();
        const mouthY = rat.getMouthY();

        this.angle += this.rotationSpeed;

        if (this.state === 'sucked') {
            const dx = mouthX - this.x;
            const dy = mouthY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 1. INCINERATION CHECK (Super Chili fire destroys money close by)
            if (chiliActive && this.type.isMoney && dist < 220) {
                this.incinerate();
                return true;
            }

            // 2. MOVEMENT SPEEDS (Freeze power-up slows money only)
            let currentSpeedFactor = difficultyFactor;
            if (freezeActive && this.type.isMoney) {
                currentSpeedFactor = 0.15; // Slow down money by 85%
            }

            // Magnet powerup pull calculations
            let basePull = 0.18 * currentSpeedFactor;
            let pullForce = Math.max(0.2, (400 / dist) * basePull);

            if (magnetActive) {
                if (this.type.isMoney) {
                    // Repel money in Magnet Mode (reverse gravity force vector!)
                    pullForce = -Math.max(0.3, (300 / dist) * 0.28);
                } else {
                    // Pull food twice as hard
                    pullForce = Math.max(0.4, (450 / dist) * basePull * 2.2);
                }
            }

            // Apply gravity vector
            this.vx += (dx / dist) * pullForce;
            this.vy += (dy / dist) * pullForce;

            // Dampening to avoid circular orbiting
            this.vx *= 0.95;
            this.vy *= 0.95;

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Collision check
            const collisionDist = rat.radius * 0.35 + this.radius;
            if (dist < collisionDist) {
                // If it is repelled money in magnet mode, block consumption
                if (magnetActive && this.type.isMoney) {
                    this.bounce();
                } else if (rat.mouthOpen) {
                    this.consume();
                } else {
                    this.bounce();
                }
            }
        } 
        else if (this.state === 'bouncing') {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.35; // Gravity pull down
            this.alpha -= 0.035; // Fade out
            
            if (this.alpha <= 0 || this.y > canvas.height + 50) {
                return false;
            }
        }

        if (this.y > canvas.height + 50) {
            return false;
        }

        return true;
    }

    consume() {
        this.alpha = 0;
        this.state = 'eaten';

        if (this.type.isMoney) {
            // Eating money increases size and resets combo!
            ratSizeLevel++;
            shrinkComboCounter = 0;
            combo = 0;
            comboValEl.innerText = `x${combo}`;
            updateDangerUI();
            sounds.playSizeUp();
            triggerScreenShake();
            spawnFloatingText(this.x, this.y - 10, '💰 OUCH!', '#ff003c');
            
            if (ratSizeLevel >= 3) {
                triggerGameOver();
            }
        } 
        else if (this.type.isPowerUp) {
            // EATING POWER-UPS!
            sounds.playPowerUp();
            let text = '';
            let color = '';

            if (this.type.name === 'freeze_berry') {
                freezeActive = true;
                freezeTimer = 300; // 5 seconds (60fps * 5)
                text = '❄️ FREEZE 5s';
                color = '#00f0ff';
            } 
            else if (this.type.name === 'magnet') {
                magnetActive = true;
                magnetTimer = 360; // 6 seconds
                text = '🧲 VEGGIE MAGNET';
                color = '#39ff14';
            } 
            else if (this.type.name === 'chili') {
                chiliActive = true;
                chiliTimer = 180; // 3 seconds (very powerful!)
                text = '🌶️ FIRE BREATH!';
                color = '#ff3700';
            }

            spawnFloatingText(rat.x, rat.y - 80, text, color);
            
            // Pop floating particles around the rat
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x: rat.x,
                    y: rat.y - 30,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8 - 2,
                    radius: Math.random() * 4 + 3,
                    color: color,
                    alpha: 1,
                    decay: 0.04
                });
            }
        } 
        else {
            // Eating regular food
            let pointsGained = this.type.score;
            score += pointsGained;
            // Only increase combo if NOT in Fever Mode and NOT in Cooldown!
            if (!feverActive && feverCooldownTimer <= 0) {
                combo++;
                // TRIGGER FEVER MODE AT 10 COMBO!
                if (combo >= 10) {
                    triggerFeverMode();
                }
            }
            shrinkComboCounter++;

            // Shrink mechanism (5 foods without money decreases size)
            if (shrinkComboCounter >= 5) {
                shrinkComboCounter = 0;
                if (ratSizeLevel > 0) {
                    ratSizeLevel--;
                    updateDangerUI();
                    spawnFloatingText(this.x, this.y - 25, '✨ SIZE DOWN!', '#4cd964');
                }
            }

            rat.chewTimer = 16;
            sounds.playChew();
            
            // Increment statistics
            stats.totalCheeseEaten++;
            saveAchievements();
            checkAchievementsTrigger();
            
            let color = '#fff';
            let bonusText = `+${pointsGained}`;
            if (this.type.isSpecial) {
                bonusText = `🌟 +${pointsGained}`;
                color = '#ffec5c';
                if (ratSizeLevel > 0) {
                    ratSizeLevel--;
                    updateDangerUI();
                }
            }
            if (feverActive) {
                color = '#ffcc00';
                bonusText = `🔥 +${pointsGained}`;
            }
            
            spawnFloatingText(this.x, this.y - 15, bonusText, color);
            
            scoreValEl.innerText = score;
            comboValEl.innerText = `x${combo}`;
            comboValEl.classList.remove('combo-pop');
            void comboValEl.offsetWidth;
            comboValEl.classList.add('combo-pop');
        }
    }

    bounce() {
        this.state = 'bouncing';
        
        const angle = Math.atan2(this.y - rat.getMouthY(), this.x - rat.getMouthX()) + (Math.random() - 0.5) * 0.5;
        const force = Math.random() * 6 + 9;
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force - 4;

        if (this.type.isMoney) {
            // Blocked money successfully! Keep combo, no score reward!
            spawnFloatingText(this.x, this.y - 20, '✨ BLOCKED!', '#4cd964');
            sounds.playCoin();
            
            // Increment statistics
            stats.totalMoneyDeflected++;
            saveAchievements();
            checkAchievementsTrigger();
        } else {
            // Blocked food (mistake). Reset combo!
            combo = 0;
            comboValEl.innerText = `x${combo}`;
            spawnFloatingText(this.x, this.y - 20, 'Opps! Blocked Food', '#ffaa66');
        }

        // Spawn bounce particles
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 3 + 2,
                color: this.type.color,
                alpha: 1,
                decay: 0.05
            });
        }
    }

    incinerate() {
        // Destroyed by Chili fire breath
        this.alpha = 0;
        this.state = 'eaten';
        
        sounds.playIncinerate();
        spawnFloatingText(this.x, this.y - 15, '🔥 BURNED', '#ff5e00');

        // Burst fire debris
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: Math.random() < 0.5 ? '#ff3700' : '#ffcc00',
                alpha: 1,
                decay: 0.08
            });
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Highlight frozen money
        if (freezeActive && this.type.isMoney) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00f0ff';
        } else {
            ctx.shadowBlur = (this.type.isSpecial || this.type.isPowerUp) ? 15 : 6;
            ctx.shadowColor = this.type.color;
        }

        // DRAW ITEMS RENDER TYPES
        if (this.type.name === 'cheese' || this.type.name === 'golden_cheese') {
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.moveTo(-this.radius, this.radius);
            ctx.lineTo(this.radius, this.radius);
            ctx.lineTo(0, -this.radius);
            ctx.closePath();
            ctx.fill();

            // Holes
            ctx.fillStyle = this.type.name === 'golden_cheese' ? '#ffcc00' : '#d4a200';
            ctx.beginPath();
            ctx.arc(-this.radius*0.2, this.radius*0.4, this.radius*0.15, 0, Math.PI*2);
            ctx.arc(this.radius*0.3, this.radius*0.6, this.radius*0.18, 0, Math.PI*2);
            ctx.arc(0, 0, this.radius*0.12, 0, Math.PI*2);
            ctx.fill();
        } 
        else if (this.type.name === 'strawberry') {
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.4);
            ctx.bezierCurveTo(-this.radius*0.8, -this.radius*1.1, -this.radius*1.1, -this.radius*0.2, 0, this.radius);
            ctx.bezierCurveTo(this.radius*1.1, -this.radius*0.2, this.radius*0.8, -this.radius*1.1, 0, -this.radius * 0.4);
            ctx.fill();

            // Leaf
            ctx.fillStyle = '#4cd964';
            ctx.beginPath();
            ctx.ellipse(0, -this.radius * 0.6, this.radius * 0.3, this.radius * 0.15, 0, 0, Math.PI*2);
            ctx.fill();
        } 
        else if (this.type.name === 'grape') {
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(-5, -3, this.radius * 0.45, 0, Math.PI*2);
            ctx.arc(5, -3, this.radius * 0.45, 0, Math.PI*2);
            ctx.arc(0, 5, this.radius * 0.45, 0, Math.PI*2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = '#4cd964';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.quadraticCurveTo(-2, -10, -5, -8);
            ctx.stroke();
        } 
        else if (this.type.name === 'freeze_berry') {
            // Draw Freeze Berry (Frost glowing circle with snowflakes emoji)
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '13px "Fredoka", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❄️', 0, 0);
        } 
        else if (this.type.name === 'magnet') {
            // Draw U Magnet
            ctx.strokeStyle = '#ff3366';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 0, 11, Math.PI, 0, true);
            ctx.stroke();

            // Magnet steel tips
            ctx.strokeStyle = '#dddddd';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-11, 0);
            ctx.lineTo(-11, 8);
            ctx.moveTo(11, 0);
            ctx.lineTo(11, 8);
            ctx.stroke();
        } 
        else if (this.type.name === 'chili') {
            // Red Chili Pepper
            ctx.fillStyle = '#ff2200';
            ctx.beginPath();
            ctx.moveTo(-6, -this.radius * 0.5);
            ctx.quadraticCurveTo(-14, 0, 0, this.radius * 0.8);
            ctx.quadraticCurveTo(8, 0, 6, -this.radius * 0.5);
            ctx.closePath();
            ctx.fill();

            // Stem
            ctx.strokeStyle = '#4cd964';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.45);
            ctx.quadraticCurveTo(-4, -this.radius * 0.8, -8, -this.radius * 0.75);
            ctx.stroke();
        }
        else if (this.type.name === 'coin') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI*2);
            ctx.fill();

            // Inner border
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.75, 0, Math.PI*2);
            ctx.stroke();

            // Dollar sign
            ctx.fillStyle = '#b8860b';
            ctx.font = 'bold 16px "Fredoka", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1.5);
        } 
        else if (this.type.name === 'bill') {
            ctx.fillStyle = '#4cd964';
            ctx.fillRect(-this.radius * 1.3, -this.radius * 0.75, this.radius * 2.6, this.radius * 1.5);

            ctx.strokeStyle = '#2d993f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-this.radius * 1.15, -this.radius * 0.6, this.radius * 2.3, this.radius * 1.2);

            ctx.fillStyle = '#2d993f';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px "Fredoka", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
        }

        // Draw ice cover on frozen coins
        if (freezeActive && this.type.isMoney) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ==========================================
// VORTEX / WIND EFFECT SYSTEMS
// ==========================================
class VortexLine {
    constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.distance = Math.random() * canvas.height * 0.8 + 100;
        this.speed = Math.random() * 4 + 3;
        this.length = Math.random() * 40 + 30;
        this.width = Math.random() * 2 + 1;
        this.color = Math.random() < 0.5 ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 45, 133, 0.1)';
    }

    update() {
        // Pull in towards the mouth coordinate
        this.distance -= this.speed;
        this.angle += 0.008;

        if (this.distance < rat.radius * 0.8) {
            this.distance = Math.random() * canvas.height * 0.8 + 150;
            this.angle = Math.random() * Math.PI * 2;
        }
    }

    draw() {
        const mouthX = rat.getMouthX();
        const mouthY = rat.getMouthY();

        const x1 = mouthX + Math.cos(this.angle) * this.distance;
        const y1 = mouthY + Math.sin(this.angle) * this.distance;
        const x2 = mouthX + Math.cos(this.angle + 0.05) * (this.distance + this.length);
        const y2 = mouthY + Math.sin(this.angle + 0.05) * (this.distance + this.length);

        ctx.save();
        ctx.strokeStyle = feverActive ? 'rgba(255, 204, 0, 0.25)' : this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }
}

const vortexLines = [];
for (let i = 0; i < 24; i++) {
    vortexLines.push(new VortexLine());
}

// ==========================================
// ACTIVE POWER-UPS SYSTEM UPDATES
// ==========================================
function updatePowerUpTimers() {
    if (freezeActive) {
        freezeTimer--;
        if (freezeTimer <= 0) freezeActive = false;
    }
    if (magnetActive) {
        magnetTimer--;
        if (magnetTimer <= 0) magnetActive = false;
    }
    if (chiliActive) {
        chiliTimer--;
        if (chiliTimer <= 0) chiliActive = false;
    }
    if (feverActive) {
        feverTimer--;
        if (feverTimer <= 0) {
            stopFeverMode();
        }
    }
    if (feverCooldownTimer > 0) {
        feverCooldownTimer--;
    }
}

// Draw active powerup hud indicators (simple visual meters on screen sides)
function drawPowerUpHuds() {
    ctx.save();
    let hudY = 170;
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.textAlign = 'right';
    
    if (freezeActive) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`❄️ FREEZE: ${(freezeTimer / 60).toFixed(1)}s`, canvas.width - 15, hudY);
        hudY += 20;
    }
    if (magnetActive) {
        ctx.fillStyle = '#39ff14';
        ctx.fillText(`🧲 MAGNET: ${(magnetTimer / 60).toFixed(1)}s`, canvas.width - 15, hudY);
        hudY += 20;
    }
    if (chiliActive) {
        ctx.fillStyle = '#ff3700';
        ctx.fillText(`🌶️ FIRE: ${(chiliTimer / 60).toFixed(1)}s`, canvas.width - 15, hudY);
        hudY += 20;
    }
    if (feverCooldownTimer > 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`⏳ EASE IN: ${(feverCooldownTimer / 60).toFixed(1)}s`, canvas.width - 15, hudY);
        hudY += 20;
    }
    ctx.restore();
}

// ==========================================
// FEVER MODE ACTIONS
// ==========================================
function triggerFeverMode() {
    feverActive = true;
    feverTimer = 300; // 5 seconds (5 * 60)
    
    feverBanner.classList.add('active');
    gameContainer.classList.add('fever-active');
    sounds.playPowerUp();
    spawnFloatingText(rat.x, rat.y - 90, '🔥 FEVER TIME! x2 POINTS', '#ffcc00');
    
    // Convert all active money in the air to food instantly!
    items.forEach(item => {
        if (item.alpha > 0 && item.type.isMoney) {
            item.type = ITEM_TYPES.CHEESE;
            item.color = ITEM_TYPES.CHEESE.color;
        }
    });
}

function stopFeverMode() {
    feverActive = false;
    feverBanner.classList.remove('active');
    gameContainer.classList.remove('fever-active');
    combo = 0; // Reset combo to restart combo builds
    comboValEl.innerText = 'x0';
    
    // Trigger 2 seconds of speed ease-in / slowdown
    feverCooldownTimer = 120; // 120 frames = 2 seconds at 60fps
    spawnFloatingText(rat.x, rat.y - 80, '⏳ SLOW DOWN!', '#00f0ff');
}

// Draw light flashing border during Fever Mode (extremely performant, fixes mobile/emulator lag)
function drawFeverBgEffects() {
    if (!feverActive) return;

    ctx.save();
    // Pulse alpha
    const alpha = 0.12 + Math.sin(globalTime * 0.15) * 0.06;
    
    // Draw a golden glowing border (vignette)
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 15;
    ctx.globalAlpha = alpha;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Simple pulsing golden overlay
    ctx.fillStyle = '#ffcc00';
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.restore();
}

// Chili Fire Breath visual particles
function drawChiliFireBreath() {
    if (!chiliActive) return;

    const mouthX = rat.getMouthX();
    const mouthY = rat.getMouthY();

    // Spawn 2 flame particles per frame
    for (let i = 0; i < 2; i++) {
        particles.push({
            x: mouthX,
            y: mouthY - 10,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 8 - 4, // Shooting upwards
            radius: Math.random() * 8 + 4,
            color: Math.random() < 0.4 ? '#ff2200' : (Math.random() < 0.7 ? '#ffcc00' : '#ff9900'),
            alpha: 1,
            decay: 0.04
        });
    }
}

// ==========================================
// HELPER EFFECTS SYSTEM (PARTICLES & FLOATING TEXTS)
// ==========================================
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        vy: -1.6,
        alpha: 1.0,
        scale: 1.0
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy;
        t.alpha -= 0.025;
        t.scale += 0.015;

        if (t.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function drawFloatingTexts() {
    ctx.save();
    floatingTexts.forEach(t => {
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 15px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = t.color;
        
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });
    ctx.restore();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// Slap tool/hand block effect
function drawSlapEffect() {
    let drawX = 0;
    let drawY = 0;
    let alpha = 1.0;
    let swingAngle = 0;

    if (showSlapEffect) {
        slapEffectTimer--;
        if (slapEffectTimer <= 0) {
            showSlapEffect = false;
            return;
        }
        drawX = slapEffectX;
        drawY = slapEffectY;
        alpha = 1.0;

        // Calculate swing angle (swing down from -60 deg to 0, then retract)
        if (slapEffectTimer > 4) {
            let t = (10 - slapEffectTimer) / 6; // 0 to 1
            swingAngle = -Math.PI / 3 * (1 - t); 
        } else {
            let t = (4 - slapEffectTimer) / 4; // 0 to 1
            swingAngle = -Math.PI / 4 * t; 
        }
    } else {
        // Idle ghost stance floating next to mouth
        if (!gameActive) return;
        
        drawX = rat.getMouthX();
        drawY = rat.getMouthY();
        alpha = 0.45; // 45% transparency to prevent visual clutter
        
        // Sine wave hover Y offset
        const hoverOffset = Math.sin(performance.now() * 0.005) * 4;
        drawY += hoverOffset;
        
        // Stationary ready angle
        swingAngle = -Math.PI / 4;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Translate to the mouth coordinate
    ctx.translate(drawX, drawY);
    
    // Scale up the tool to make it larger and more prominent!
    ctx.scale(1.9, 1.9); // 90% larger!
    
    // Pivot rotation point offset (above and to the right of the mouth in scaled space)
    ctx.translate(16, -21);
    ctx.rotate(swingAngle);
    ctx.translate(-16, 21); // move back
    
    // Draw the tool based on selectedSkin
    if (selectedSkin === 'default') {
        // Rolled-up newspaper
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        
        // Newspaper body
        ctx.fillStyle = '#e2e2e7';
        ctx.beginPath();
        ctx.rect(5, -45, 14, 50);
        ctx.fill();
        ctx.stroke();
        
        // Text lines in newspaper
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, -40); ctx.lineTo(16, -40);
        ctx.moveTo(8, -35); ctx.lineTo(16, -35);
        ctx.moveTo(8, -30); ctx.lineTo(16, -30);
        ctx.moveTo(8, -25); ctx.lineTo(16, -25);
        ctx.moveTo(8, -20); ctx.lineTo(16, -20);
        ctx.moveTo(8, -15); ctx.lineTo(16, -15);
        ctx.stroke();
        
        // Red rubber band holding the roll
        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(5, -23);
        ctx.lineTo(19, -23);
        ctx.stroke();
    }
    else if (selectedSkin === 'chef') {
        // Chef spatula
        // Wooden handle
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(35, -40);
        ctx.lineTo(12, -15);
        ctx.stroke();
        
        // Metal Spatula Head
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, -15);
        ctx.lineTo(2, -2);
        ctx.lineTo(-8, -12);
        ctx.lineTo(5, -25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Spatula Slits
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(7, -15); ctx.lineTo(1, -9);
        ctx.moveTo(10, -18); ctx.lineTo(4, -12);
        ctx.stroke();
    }
    else if (selectedSkin === 'mafia') {
        // Mafia Gold Hand / Slap
        // Suit sleeve (black)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(50, -50);
        ctx.lineTo(25, -25);
        ctx.lineTo(38, -12);
        ctx.closePath();
        ctx.fill();
        
        // White cuff
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(25, -25);
        ctx.lineTo(18, -18);
        ctx.lineTo(31, -5);
        ctx.lineTo(38, -12);
        ctx.closePath();
        ctx.fill();
        
        // Golden Hand (Radius increased to 13.5)
        ctx.fillStyle = '#ffd700'; 
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(10, -10, 13.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Fingers (longer & thicker, extending closer to 0,0)
        ctx.beginPath();
        ctx.ellipse(6, -11, 11, 4.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(3, -7, 11, 4.0, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(0, -3, 11, 4.0, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(10, -2, 7, 3.5, -Math.PI / 6, 0, Math.PI * 2); // thumb
        ctx.fill();
        ctx.stroke();
        
        // Ruby red ring (larger)
        ctx.fillStyle = '#ff3b30'; 
        ctx.beginPath();
        ctx.arc(3, -7, 3.0, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (selectedSkin === 'space') {
        // Cyber energy shield (Cyan glowing hexagon barrier)
        // Handle grip (black/gray cyber tech, slightly longer)
        ctx.fillStyle = '#333';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(18, -25, 12, 12);
        ctx.fill();
        ctx.stroke();
        
        // Hexagonal glowing shield (Radius increased to 28, centered)
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4; // thicker lines for cyber bar
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00f0ff';
        
        ctx.beginPath();
        const size = 28;
        const centerX = 0;
        const centerY = -5;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            ctx.lineTo(centerX + Math.cos(angle) * size, centerY + Math.sin(angle) * size);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    ctx.restore();

    // Draw comic slap spark impact at the hit frame (frame 4 to 0)
    if (showSlapEffect && slapEffectTimer <= 6) {
        ctx.save();
        ctx.translate(slapEffectX, slapEffectY - 10);
        
        ctx.fillStyle = '#fffc33';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fffc33';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const r = i % 2 === 0 ? 24 : 10;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function triggerRatExplosion() {
    sounds.playExplosion();
    triggerScreenShake();
    
    const colors = ['#a85b82', '#ff4d6e', '#e6bed3', '#ffcc00', '#ffd700'];
    
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        particles.push({
            x: rat.x,
            y: rat.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            radius: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1.0,
            decay: Math.random() * 0.015 + 0.01
        });
    }
}

// ==========================================
// CORE GAME MECHANICS
// ==========================================
function updateDangerUI() {
    const segments = dangerBarEl.querySelectorAll('.danger-segment');
    segments.forEach((seg, index) => {
        if (index < ratSizeLevel) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });
}

function triggerScreenShake() {
    gameContainer.classList.remove('shake');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('shake');
}

function spawnItem() {
    let item = items.find(i => i.alpha === 0);
    if (!item) {
        item = new GameItem();
        items.push(item);
    } else {
        item.reset();
    }
}

function handleScreenTap(e) {
    if (!gameActive) return;
    
    // Prevent double fires on mobile touch
    if (e.type === 'touchstart') {
        e.preventDefault();
    }

    rat.slapClosed();
}

// Bind tap inputs
canvas.addEventListener('mousedown', handleScreenTap);
canvas.addEventListener('touchstart', handleScreenTap, { passive: false });

// ==========================================
// SCENES & OVERLAY MANAGEMENT
// ==========================================
function updateHighScoreUI() {
    const high = parseInt(localStorage.getItem('rat_sucker_highscore') || 0, 10);
    startHighScoreEl.innerText = high;
    bestScoreEl.innerText = high;

    // Check high score to unlock skins on Start Screen
    const skins = document.querySelectorAll('.skin-option');
    skins.forEach(skin => {
        const unlockScore = parseInt(skin.dataset.unlock || 0, 10);
        if (unlockScore > 0) {
            if (high >= unlockScore) {
                skin.classList.remove('locked');
                skin.title = skin.title.replace(' (Locked)', '');
            } else {
                skin.classList.add('locked');
            }
        }
    });
}

function startNewGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // Hide banner ad during gameplay
    if (window.AndroidInterface) {
        window.AndroidInterface.postMessage("hide_banner");
    }

    // Reset core states
    score = 0;
    combo = 0;
    ratSizeLevel = 0;
    shrinkComboCounter = 0;
    items = [];
    particles = [];
    floatingTexts = [];
    difficultyFactor = 1.0;
    
    // Reset level states
    currentLevel = 1;
    levelUpPauseTimer = 0;
    levelValEl.innerText = '1';
    levelUpBanner.classList.remove('active');

    // Reset powerups
    freezeActive = false;
    magnetActive = false;
    chiliActive = false;
    feverActive = false;
    feverBanner.classList.remove('active');
    gameContainer.classList.remove('fever-active');
    
    scoreValEl.innerText = 0;
    comboValEl.innerText = 'x0';
    updateHighScoreUI();
    updateDangerUI();
    
    rat.init();
    sounds.init();
    gameActive = true;

    // Spawner timers setup
    spawnInterval = 1300;
    lastSpawnTime = performance.now();

    // Show tutorial toast
    tutorialToast.style.opacity = 1;
    setTimeout(() => {
        tutorialToast.style.opacity = 0;
    }, 3500);
    
    if (sounds.ctx && sounds.ctx.state === 'suspended') {
        sounds.ctx.resume().then(() => {
            sounds.startBgm();
        });
    } else {
        sounds.startBgm();
    }
}

function triggerGameOver() {
    gameActive = false;
    triggerRatExplosion();

    // Save High Score
    const high = parseInt(localStorage.getItem('rat_sucker_highscore') || 0, 10);
    if (score > high) {
        localStorage.setItem('rat_sucker_highscore', score);
    }

    setTimeout(() => {
        gameScreen.classList.remove('active');
        gameOverScreen.classList.add('active');
        
        finalScoreEl.innerText = score;
        updateHighScoreUI();

        // Update Stats & Achievements
        if (selectedStage === 'void' && score > stats.maxScoreSpace) {
            stats.maxScoreSpace = score;
        }
        if (currentLevel > stats.maxLevelReached) {
            stats.maxLevelReached = currentLevel;
        }
        saveAchievements();
        checkAchievementsTrigger();

        // Check if Top 10 record and prompt name input
        checkAndPromptLeaderboard(score);

        // Show banner ad on Game Over screen
        if (window.AndroidInterface) {
            window.AndroidInterface.postMessage("show_banner");
            
            // Show Interstitial ad every 3 plays
            let playCount = parseInt(localStorage.getItem('rat_sucker_playcount') || 0, 10);
            playCount++;
            localStorage.setItem('rat_sucker_playcount', playCount);
            if (playCount % 3 === 0) {
                window.AndroidInterface.postMessage("show_interstitial");
            }
        }
    }, 1200);
}

// Mute sound toggle click
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sounds.muted = !sounds.muted;
    muteBtn.innerText = sounds.muted ? '🔇' : '🔊';
});

// Stage Selection click bindings
document.querySelectorAll('.stage-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.stage-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedStage = btn.dataset.stage;
        sounds.playSlap();
    });
});

// Skin Selection click bindings
document.querySelectorAll('.skin-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Block choosing if locked!
        if (btn.classList.contains('locked')) {
            sounds.playSizeUp(); // play warning buzz sound
            const unlockScore = btn.dataset.unlock;
            alert(`น้องหนูสกินนี้ยังล็อคอยู่! คุณต้องทำ High Score ให้ได้อย่างน้อย ${unlockScore} คะแนนก่อนจึงจะปลดล็อคได้ครับ!`);
            return;
        }

        document.querySelectorAll('.skin-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSkin = btn.dataset.skin;
        sounds.playCoin(); // happy unlock/select sound
    });
});

// Start button clicks
startBtn.addEventListener('click', startNewGame);
restartBtn.addEventListener('click', startNewGame);
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sounds.playCoin(); // Play click sound
    gameOverScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    startScreen.classList.add('active');
    updateHighScoreUI();

    // Ensure banner is shown on Start screen
    if (window.AndroidInterface) {
        window.AndroidInterface.postMessage("show_banner");
    }
});

// Help modal clicks
if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playCoin(); // Play click sound
        if (helpModal) helpModal.classList.add('active');
    });
}

if (helpCloseBtn) {
    helpCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playSlap(); // Play click sound
        if (helpModal) helpModal.classList.remove('active');
    });
}

updateHighScoreUI();
loadVolumeSettings();
loadLeaderboard();
loadAchievements();

// ==========================================
// INTRO COMIC STORY SCREEN LOGIC
// ==========================================
function showIntroSlide(slideNum) {
    introSlides.forEach(slide => {
        slide.classList.remove('active');
        if (parseInt(slide.dataset.slide, 10) === slideNum) {
            slide.classList.add('active');
        }
    });
    currentIntroSlide = slideNum;
    if (currentIntroSlide === 3) {
        introNextBtn.innerText = 'เริ่มกินชีสกันเลย! 🧀';
    } else {
        introNextBtn.innerText = 'ถัดไป ➡️';
    }
}

function handleIntroNext() {
    sounds.playCoin(); // Play click sound
    if (currentIntroSlide < 3) {
        showIntroSlide(currentIntroSlide + 1);
    } else {
        finishIntro();
    }
}

function finishIntro() {
    localStorage.setItem('rat_sucker_seen_intro', 'true');
    introScreen.classList.remove('active');
    startScreen.classList.add('active');
    sounds.playLevelUp(); // Happy start fanfare sound!
}

function startManualIntro() {
    sounds.playCoin();
    if (helpModal) helpModal.classList.remove('active');
    startScreen.classList.remove('active');
    introScreen.classList.add('active');
    showIntroSlide(1);
}

function checkIntroPlayback() {
    const hasSeenIntro = localStorage.getItem('rat_sucker_seen_intro');
    if (!hasSeenIntro) {
        introScreen.classList.add('active');
        startScreen.classList.remove('active');
        currentIntroSlide = 1;
        showIntroSlide(1);
    } else {
        introScreen.classList.remove('active');
        startScreen.classList.add('active');
    }
}

// Bind Intro Click events
introNextBtn.addEventListener('click', handleIntroNext);
introSkipBtn.addEventListener('click', () => {
    sounds.playSlap();
    finishIntro();
});
if (watchIntroBtn) {
    watchIntroBtn.addEventListener('click', startManualIntro);
}

// Check playback on start
checkIntroPlayback();

// ==========================================
// 🔊 SETTINGS (VOLUME ADJUSTMENT) LOGIC
// ==========================================
function loadVolumeSettings() {
    const sfxVal = localStorage.getItem('rat_sucker_sfx_volume') !== null ? parseInt(localStorage.getItem('rat_sucker_sfx_volume'), 10) : 80;
    const bgmVal = localStorage.getItem('rat_sucker_bgm_volume') !== null ? parseInt(localStorage.getItem('rat_sucker_bgm_volume'), 10) : 50;
    
    sounds.sfxVolume = sfxVal / 100;
    sounds.bgmVolume = bgmVal / 100;
    
    if (sfxVolumeSlider) {
        sfxVolumeSlider.value = sfxVal;
        sfxVolumeVal.innerText = `${sfxVal}%`;
    }
    if (bgmVolumeSlider) {
        bgmVolumeSlider.value = bgmVal;
        bgmVolumeVal.innerText = `${bgmVal}%`;
    }
}

if (sfxVolumeSlider) {
    sfxVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        sfxVolumeVal.innerText = `${val}%`;
        sounds.sfxVolume = val / 100;
        localStorage.setItem('rat_sucker_sfx_volume', val);
    });
    sfxVolumeSlider.addEventListener('change', () => {
        sounds.playChew();
    });
}

if (bgmVolumeSlider) {
    bgmVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        bgmVolumeVal.innerText = `${val}%`;
        sounds.bgmVolume = val / 100;
        localStorage.setItem('rat_sucker_bgm_volume', val);
    });
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playCoin();
        settingsModal.classList.add('active');
    });
}
if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playSlap();
        settingsModal.classList.remove('active');
    });
}

// ==========================================
// 🏆 LOCAL LEADERBOARD LOGIC (TOP 10)
// ==========================================
// 🏆 CLOUD LEADERBOARD LOGIC (FIREBASE TOP 10)
// ==========================================
function loadLeaderboard() {
    // If database is available, set up a real-time listener to fetch and sync leaderboard
    if (db) {
        db.ref('leaderboard').on('value', (snapshot) => {
            const raw = snapshot.val();
            const list = [];
            if (raw) {
                for (let key in raw) {
                    list.push(raw[key]);
                }
            }
            // Sort descending and keep top 10
            list.sort((a, b) => b.score - a.score);
            leaderboardData = list.slice(0, 10);
            
            // Sync to localstorage as fallback
            localStorage.setItem('rat_sucker_leaderboard', JSON.stringify(leaderboardData));
            
            // If the leaderboard modal is active, refresh the displayed list
            if (leaderboardModal && leaderboardModal.classList.contains('active')) {
                displayLeaderboard();
            }
        }, (err) => {
            console.error("Firebase fetch error: ", err);
            loadLocalLeaderboardFallback();
        });
    } else {
        loadLocalLeaderboardFallback();
    }
}

function loadLocalLeaderboardFallback() {
    const raw = localStorage.getItem('rat_sucker_leaderboard');
    if (raw) {
        leaderboardData = JSON.parse(raw);
    } else {
        leaderboardData = [
            { name: "พะโล้", score: 80, stage: "void", skin: "default", date: "05 ก.ค. 12:00" },
            { name: "ชีสซี่", score: 50, stage: "cheese", skin: "chef", date: "05 ก.ค. 10:00" },
            { name: "หนูจี๊ด", score: 30, stage: "sewer", skin: "default", date: "05 ก.ค. 09:00" }
        ];
        saveLeaderboard();
    }
}

function saveLeaderboard() {
    localStorage.setItem('rat_sucker_leaderboard', JSON.stringify(leaderboardData));
}

function displayLeaderboard() {
    leaderboardBody.innerHTML = '';
    
    // Sort descending and keep top 10
    leaderboardData.sort((a, b) => b.score - a.score);
    const top10 = leaderboardData.slice(0, 10);
    
    if (top10.length === 0) {
        leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#888; padding: 20px 0;">ไม่มีประวัติสถิติคะแนน</td></tr>`;
        return;
    }
    
    const stageEmojis = {
        'void': '🌌 อวกาศ',
        'sewer': '🚇 ท่อน้ำ',
        'kitchen': '🍳 ครัว',
        'cheese': '🧀 เมืองชีส'
    };
    
    top10.forEach((entry, idx) => {
        const rank = idx + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';
        
        const stageLabel = stageEmojis[entry.stage] || entry.stage;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="${rankClass}">#${rank}</td>
            <td>${escapeHtml(entry.name)}</td>
            <td class="${rankClass}">${entry.score}</td>
            <td style="font-size: 11px; color:#aaa;">${stageLabel}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function checkAndPromptLeaderboard(finalScore) {
    leaderboardData.sort((a, b) => b.score - a.score);
    const isTop10 = leaderboardData.length < 10 || finalScore > leaderboardData[leaderboardData.length - 1].score;
    
    if (isTop10 && finalScore > 0) {
        scoreWaitingForLeaderboard = finalScore;
        playerNameInput.value = localStorage.getItem('rat_sucker_last_player_name') || 'หนูซ่าส์';
        nameInputModal.classList.add('active');
        return true;
    }
    return false;
}

if (nameSubmitBtn) {
    nameSubmitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const inputName = playerNameInput.value.trim().substring(0, 8) || 'หนูซ่าส์';
        localStorage.setItem('rat_sucker_last_player_name', inputName);
        
        const dateObj = new Date();
        const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const dateString = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        
        const newEntry = {
            name: inputName,
            score: scoreWaitingForLeaderboard,
            stage: selectedStage,
            skin: selectedSkin,
            date: dateString
        };
        
        // Push to Firebase online database (it will auto-trigger sync listener)
        if (db) {
            db.ref('leaderboard').push(newEntry);
        } else {
            // Local fallback
            leaderboardData.push(newEntry);
            leaderboardData.sort((a, b) => b.score - a.score);
            leaderboardData = leaderboardData.slice(0, 10);
            saveLeaderboard();
        }
        
        scoreWaitingForLeaderboard = null;
        nameInputModal.classList.remove('active');
        
        sounds.playLevelUp();
        displayLeaderboard();
        leaderboardModal.classList.add('active');
    });
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playCoin();
        displayLeaderboard();
        leaderboardModal.classList.add('active');
    });
}
if (leaderboardCloseBtn) {
    leaderboardCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playSlap();
        leaderboardModal.classList.remove('active');
    });
}
if (leaderboardResetBtn) {
    leaderboardResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างตารางอันดับคะแนนสูงสุดทั้งหมดบนคลาวด์?")) {
            sounds.playSizeUp();
            if (db) {
                db.ref('leaderboard').remove();
            } else {
                leaderboardData = [];
                saveLeaderboard();
                displayLeaderboard();
            }
        }
    });
}

// ==========================================
// 🎖️ LOCAL ACHIEVEMENTS SYSTEM
// ==========================================
const achievementsConfig = [
    {
        id: "cheese_gobbler",
        title: "🧀 จอมเขมือบชีส",
        desc: "กินชีสสะสมครบ 100 ชิ้นขึ้นไป (ทุกรอบรวมกัน)",
        check: () => stats.totalCheeseEaten >= 100
    },
    {
        id: "money_dodger",
        title: "💸 เครื่องสะบัดเหรียญ",
        desc: "แตะปัดเงิน/เหรียญทองทิ้งครบ 50 ครั้งขึ้นไป",
        check: () => stats.totalMoneyDeflected >= 50
    },
    {
        id: "space_explorer",
        title: "🚀 หนูอวกาศ",
        desc: "ทำคะแนนถึง 100 แต้มขึ้นไปในด่านอวกาศ",
        check: () => stats.maxScoreSpace >= 100
    },
    {
        id: "doctor_level_5",
        title: "🧪 หนูวิทยาศาสตร์",
        desc: "เก็บค่าเติบโตถึงระดับ Level 5 ในการเล่นรอบเดียว",
        check: () => stats.maxLevelReached >= 5
    }
];

function loadAchievements() {
    const rawStats = localStorage.getItem('rat_sucker_stats');
    if (rawStats) stats = JSON.parse(rawStats);
    
    const rawAch = localStorage.getItem('rat_sucker_achievements');
    if (rawAch) achievementsUnlocked = JSON.parse(rawAch);
}

function saveAchievements() {
    localStorage.setItem('rat_sucker_stats', JSON.stringify(stats));
    localStorage.setItem('rat_sucker_achievements', JSON.stringify(achievementsUnlocked));
}

function checkAchievementsTrigger() {
    achievementsConfig.forEach(ach => {
        if (!achievementsUnlocked[ach.id] && ach.check()) {
            achievementsUnlocked[ach.id] = true;
            saveAchievements();
            showAchievementToast(ach);
        }
    });
}

function showAchievementToast(ach) {
    sounds.playLevelUp();
    
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="toast-icon">🎖️</div>
        <div class="toast-info">
            <p class="toast-title">ความสำเร็จใหม่!</p>
            <p class="toast-name">${ach.title}</p>
        </div>
    `;
    
    gameContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, 4000);
}

function displayAchievements() {
    achievementsList.innerHTML = '';
    
    achievementsConfig.forEach(ach => {
        const isUnlocked = !!achievementsUnlocked[ach.id];
        
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? '' : 'locked'}`;
        card.innerHTML = `
            <div class="achievement-icon">${isUnlocked ? '🎖️' : '🔒'}</div>
            <div class="achievement-info">
                <p class="achievement-title">${ach.title}</p>
                <p class="achievement-desc">${ach.desc}</p>
            </div>
            <div class="achievement-status">${isUnlocked ? 'สำเร็จแล้ว' : 'ยังไม่ปลดล็อก'}</div>
        `;
        achievementsList.appendChild(card);
    });
}

if (achievementsBtn) {
    achievementsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playCoin();
        displayAchievements();
        achievementsModal.classList.add('active');
    });
}
if (achievementsCloseBtn) {
    achievementsCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sounds.playSlap();
        achievementsModal.classList.remove('active');
    });
}

// ==========================================
// BACKGROUND STAGES DRAWING LOGIC
// ==========================================
function drawStageBackground() {
    if (selectedStage === 'void') {
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, canvas.height * 0.7);
        grad.addColorStop(0, '#1b1641');
        grad.addColorStop(1, '#080517');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } 
    else if (selectedStage === 'sewer') {
        ctx.fillStyle = '#060d12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Brick lines
        ctx.strokeStyle = 'rgba(20, 40, 50, 0.15)';
        ctx.lineWidth = 1.5;
        const rowHeight = 35;
        const colWidth = 60;
        for (let y = 0; y < canvas.height; y += rowHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            const offset = (y / rowHeight) % 2 === 0 ? 0 : colWidth / 2;
            for (let x = offset; x < canvas.width; x += colWidth) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + rowHeight);
                ctx.stroke();
            }
        }

        // Pipeline system
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.08)';
        ctx.lineWidth = 25;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-50, canvas.height * 0.25);
        ctx.lineTo(canvas.width + 50, canvas.height * 0.25);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 180, 255, 0.08)';
        ctx.shadowColor = 'rgba(0, 180, 255, 0.3)';
        ctx.lineWidth = 35;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.18, -50);
        ctx.lineTo(canvas.width * 0.18, canvas.height + 50);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(0, 255, 130, 0.05)';
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height, canvas.width * 0.7, 50, 0, 0, Math.PI * 2);
        ctx.fill();
    } 
    else if (selectedStage === 'kitchen') {
        ctx.fillStyle = '#0a091a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(100, 100, 180, 0.09)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(canvas.width * 0.05, canvas.height * 0.05, canvas.width * 0.9, canvas.height * 0.22);
        
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.05, canvas.height * 0.16);
        ctx.lineTo(canvas.width * 0.95, canvas.height * 0.16);
        ctx.stroke();

        ctx.strokeRect(canvas.width * 0.65, canvas.height * 0.45, 80, 50);
        ctx.beginPath();
        ctx.arc(canvas.width * 0.65 + 40, canvas.height * 0.45 + 50, 4, 0, Math.PI * 2);
        ctx.arc(canvas.width * 0.65 + 15, canvas.height * 0.45 + 50, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(canvas.width * 0.2, canvas.height * 0.35, 15, 0, Math.PI * 2);
        ctx.moveTo(canvas.width * 0.2, canvas.height * 0.35 - 15);
        ctx.lineTo(canvas.width * 0.2, canvas.height * 0.35 - 35);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(canvas.width * 0.38, canvas.height * 0.33, 11, 0, Math.PI * 2);
        ctx.moveTo(canvas.width * 0.38, canvas.height * 0.33 - 11);
        ctx.lineTo(canvas.width * 0.38, canvas.height * 0.33 - 28);
        ctx.stroke();
    } 
    else if (selectedStage === 'cheese') {
        ctx.fillStyle = '#0d0722';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Crescent moon
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(255, 236, 92, 0.4)';
        ctx.fillStyle = 'rgba(255, 236, 92, 0.12)';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8, canvas.height * 0.15, 30, -Math.PI*0.3, Math.PI*0.7);
        ctx.quadraticCurveTo(canvas.width * 0.8 + 10, canvas.height * 0.15 + 10, canvas.width * 0.8 + 21, canvas.height * 0.15 - 21);
        ctx.fill();
        ctx.restore();

        // City skyline background
        ctx.fillStyle = 'rgba(27, 13, 64, 0.25)';
        ctx.fillRect(canvas.width * 0.05, canvas.height * 0.5, 60, canvas.height * 0.5);
        
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.25, canvas.height * 0.45);
        ctx.lineTo(canvas.width * 0.55, canvas.height * 0.7);
        ctx.lineTo(canvas.width * 0.18, canvas.height * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillRect(canvas.width * 0.6, canvas.height * 0.42, 90, canvas.height * 0.6);
        ctx.fillRect(canvas.width * 0.8, canvas.height * 0.53, 50, canvas.height * 0.5);

        // Foreground city skyline
        ctx.fillStyle = 'rgba(16, 8, 41, 0.5)';
        ctx.fillRect(-10, canvas.height * 0.65, 90, canvas.height * 0.35);
        
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.5, canvas.height * 0.55);
        ctx.lineTo(canvas.width * 0.85, canvas.height * 0.85);
        ctx.lineTo(canvas.width * 0.35, canvas.height * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.fillRect(canvas.width * 0.72, canvas.height * 0.6, 120, canvas.height * 0.4);
    }
}

// ==========================================
// MAIN GAME LOOP
// ==========================================
function gameLoop(timestamp) {
    globalTime++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw stage background
    drawStageBackground();

    // 2. Draw Fever disco rays BGM indicators
    drawFeverBgEffects();

    if (gameActive) {
        // Calculate level based on score
        let newLevel = 1;
        for (let l in LEVEL_CONFIGS) {
            const cfg = LEVEL_CONFIGS[l];
            if (score >= cfg.minScore && score <= cfg.maxScore) {
                newLevel = parseInt(l, 10);
                break;
            }
        }

        // LEVEL UP CHECK
        if (newLevel > currentLevel) {
            currentLevel = newLevel;
            levelValEl.innerText = currentLevel;
            sounds.playLevelUp();
            
            // Show level up banner
            levelUpTitle.innerText = LEVEL_CONFIGS[currentLevel].title;
            levelUpBanner.classList.add('active');
            
            // Pause spawning and slow down items temporarily
            levelUpPauseTimer = 90; // approx 1.5 seconds pause
            
            spawnFloatingText(rat.x, rat.y - 85, '⚡ LEVEL UP! ⚡', '#ffcc00');
        }

        // Manage Level Up Banner countdown
        if (levelUpPauseTimer > 0) {
            levelUpPauseTimer--;
            if (levelUpPauseTimer === 0) {
                levelUpBanner.classList.remove('active');
            }
        }

        // Difficulty factor from current Level
        let targetDifficulty = LEVEL_CONFIGS[currentLevel].speed;
        
        // If in fever cooldown, temporarily reduce difficulty by 40% to ease in
        if (feverCooldownTimer > 0) {
            targetDifficulty *= 0.6;
        }
        // If in Level Up pause, make difficulty extremely slow (15% speed) to let them read the banner
        if (levelUpPauseTimer > 0) {
            targetDifficulty *= 0.15;
        }
        
        difficultyFactor = targetDifficulty;
        
        // Spawns items faster, and MUCH faster in fever mode
        const baseInterval = LEVEL_CONFIGS[currentLevel].interval;
        const currentInterval = feverActive ? 220 : (feverCooldownTimer > 0 ? baseInterval * 1.5 : baseInterval);
        
        const now = performance.now();
        // Do NOT spawn new items if levelUpPauseTimer is active
        if (now - lastSpawnTime > currentInterval && levelUpPauseTimer <= 0) {
            spawnItem();
            lastSpawnTime = now;
        }

        // 3. Update active power-up durations
        updatePowerUpTimers();

        // 4. Draw fire breath if super chili is active
        drawChiliFireBreath();

        // 5. Update and Draw Vortex lines
        vortexLines.forEach(line => {
            line.update();
            line.draw();
        });

        // 6. Update and Draw items
        items.forEach(item => {
            if (item.alpha > 0) {
                const active = item.update();
                if (active) {
                    item.draw();
                }
            }
        });

        // 7. Update and Draw Rat
        rat.update();
        rat.draw();

        // 8. Draw active powerup meters HUD
        drawPowerUpHuds();

        // 9. Update & Draw Floating texts
        updateFloatingTexts();
        drawFloatingTexts();

        // 10. Update & Draw particles
        updateParticles();
        drawParticles();

        // 11. Draw Comic Slap Arc Star
        drawSlapEffect();
    } else {
        // Start menu or Game Over idle loops
        vortexLines.forEach(line => {
            line.update();
            line.draw();
        });
        updateParticles();
        drawParticles();
        
        if (ratSizeLevel >= 3) {
            items.forEach(item => {
                if (item.alpha > 0) {
                    item.update();
                    item.draw();
                }
            });
        }
    }

    requestAnimationFrame(gameLoop);
}

// Start Game Loop
requestAnimationFrame(gameLoop);

// Show initial banner ad on startup if running in Android app
if (window.AndroidInterface) {
    window.AndroidInterface.postMessage("show_banner");
}
