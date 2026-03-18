/**
 * Snake - Juego clasico
 * Canvas 520x520, grid 26x26 celdas de 20px
 */

(function () {
  'use strict';

  const GRID_SIZE   = 26;
  const CELL_SIZE   = 20;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

  // Velocidad adaptativa: sube un nivel cada 5 comidas rojas (50 pts)
  const SPEED_TIERS = [
    { minScore: 0,   tickMs: 120 },
    { minScore: 50,  tickMs: 110 },
    { minScore: 100, tickMs: 98  },
    { minScore: 150, tickMs: 85  },
    { minScore: 200, tickMs: 74  },
    { minScore: 250, tickMs: 64  },
  ];

  const FOOD_SHRINK_CHANCE         = 0.2;
  const SHRINK_MULTIPLIERS         = [1, 2, 3];
  const MIN_SNAKE_LENGTH           = 3;
  const COLLECT_EFFECT_DURATION_MS = 550;
  const PARTICLE_COUNT             = 16;
  const SHRINK_EFFECT_DURATION_MS  = 560;
  const DEATH_FLASH_DURATION_MS    = 520;

  // Power-ups
  const POWERUP_SPAWN_CHANCE = 0.20;  // 20% tras cada comida roja
  const POWERUP_LIFESPAN_MS  = 6000;  // tiempo visible en tablero
  const POWERUP_DURATION_MS  = 7000;  // duracion del efecto
  const POWERUP_TYPES        = ['shield', 'slow', 'double'];

  // Combo
  const COMBO_WINDOW_MS = 2500;

  // Level-up banner
  const LEVELUP_BANNER_MS = 1600;

  const HIGH_SCORE_KEY          = 'snake-high-score';
  const GAME_STATS_KEY          = 'snake-game-stats';
  const MAX_STORED_GAMES        = 100;
  const OBSTACLE_CELLS_PER_FOOD = 1;
  const OBSTACLE_MAX            = 16;  // limite de obstaculos en tablero
  const SOUND_FILES = {
    normalFood: 'audio/comida_roja.mp3',
    shrinkFood: 'audio/comida_verde.mp3',
    gameOver:   'audio/game_over.mp3',
    pause:      'audio/pause.mp3',
    shield:     'audio/escudo.mp3',
    levelUp:    'audio/subir_nivel.mp3',
  };

  const Direction = {
    UP:    { dx:  0, dy: -1 },
    DOWN:  { dx:  0, dy:  1 },
    LEFT:  { dx: -1, dy:  0 },
    RIGHT: { dx:  1, dy:  0 },
  };

  const KEY = {
    UP:      ['ArrowUp',    'KeyW'],
    DOWN:    ['ArrowDown',  'KeyS'],
    LEFT:    ['ArrowLeft',  'KeyA'],
    RIGHT:   ['ArrowRight', 'KeyD'],
    PAUSE:   'Space',
    RESTART: 'Escape',
  };

  const canvas          = document.getElementById('game-canvas');
  const ctx             = canvas.getContext('2d');
  const canvasContainer = canvas.closest('.canvas-container');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = CANVAS_SIZE * dpr;
  canvas.height = CANVAS_SIZE * dpr;
  ctx.scale(dpr, dpr);

  const scoreEl            = document.getElementById('score');
  const highScoreEl        = document.getElementById('high-score');
  const speedLevelEl       = document.getElementById('speed-level');
  const finalScoreEl       = document.getElementById('final-score');
  const goFoodsEatenEl     = document.getElementById('go-foods-eaten');
  const goObstaclesCountEl = document.getElementById('go-obstacles-count');
  const goTimePlayedEl     = document.getElementById('go-time-played');
  const goDeltaScoreEl     = document.getElementById('go-delta-score');
  const newRecordBadge     = document.getElementById('new-record-badge');
  const gameLogoEl         = document.getElementById('game-logo');

  const startScreen    = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const pauseOverlay   = document.getElementById('pause-overlay');
  const statsOverlay   = document.getElementById('stats-overlay');
  const rulesOverlay   = document.getElementById('rules-overlay');

  const startBtn   = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const shareBtn   = document.getElementById('share-btn');
  const rulesBtn   = document.getElementById('rules-btn');
  const rulesClose = document.getElementById('rules-close');

  const touchUpBtn    = document.getElementById('touch-up');
  const touchDownBtn  = document.getElementById('touch-down');
  const touchLeftBtn  = document.getElementById('touch-left');
  const touchRightBtn = document.getElementById('touch-right');
  const touchPauseBtn = document.getElementById('touch-pause');

  const playerNameInput  = document.getElementById('player-name');
  const playerBadge      = document.getElementById('player-badge');
  const gameOverPlayerEl = document.getElementById('game-over-player');
  const bestPlayerNameEl = document.getElementById('best-player-name');
  const leaderboardEl    = document.getElementById('leaderboard');
  const leaderboardList  = document.getElementById('leaderboard-list');

  let playerName    = '';
  let snake         = [];
  let direction     = Direction.RIGHT;
  let nextDirection = Direction.RIGHT;
  let food          = null;
  let obstacles     = [];
  let powerUp       = null;          // { x, y, type, spawnTime }
  let powerUpExpireTimer = null;

  // Estados de power-up activos
  let activeShield  = false;
  let slowEndTime   = 0;
  let doubleEndTime = 0;

  // Combo
  let comboCount = 0;
  let comboTimer = null;

  let score                   = 0;
  let highScore               = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  let previousHighScore       = highScore;
  let foodsEatenCount         = 0;
  let obstaclesGeneratedCount = 0;
  let gameDurationSec         = 0;

  let gameLoopId    = null;
  let isRunning     = false;
  let isPaused      = false;
  let lastTick      = 0;
  let gameStartTime = 0;

  let touchStartX = null;
  let touchStartY = null;
  let touchLastX  = null;
  let touchLastY  = null;

  let collectEffects = [];
  let shrinkEffects  = [];
  let floatingTexts  = [];
  let levelUpBanner  = null;   // { level, startTime }
  let lastSpeedLevel = 1;

  let audioUnlocked = false;
  const audioPool   = {};

  highScoreEl.textContent = highScore;

  // ----- Audio -----

  function preloadAudio() {
    Object.keys(SOUND_FILES).forEach(function (key) {
      try {
        const audio = new Audio(SOUND_FILES[key]);
        audio.preload = 'auto';
        audioPool[key] = audio;
      } catch (_) {}
    });
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    preloadAudio();
  }

  function playSoundEffect(soundKey) {
    if (!audioUnlocked) return;
    const src = SOUND_FILES[soundKey];
    if (!src) return;
    try {
      const audio = audioPool[soundKey] ? audioPool[soundKey].cloneNode() : new Audio(src);
      audio.play().catch(function () {});
    } catch (_) {}
  }

  // ----- Velocidad adaptativa -----

  function getSpeedLevel() {
    let level = 1;
    for (let i = 0; i < SPEED_TIERS.length; i++) {
      if (score >= SPEED_TIERS[i].minScore) level = i + 1;
    }
    return level;
  }

  function getTickMs() {
    let tickMs = SPEED_TIERS[0].tickMs;
    for (let i = 0; i < SPEED_TIERS.length; i++) {
      if (score >= SPEED_TIERS[i].minScore) tickMs = SPEED_TIERS[i].tickMs;
    }
    if (performance.now() < slowEndTime) tickMs = Math.round(tickMs * 1.55);
    return tickMs;
  }

  function getPointsMultiplier() {
    return performance.now() < doubleEndTime ? 2 : 1;
  }

  function updateSpeedDisplay() {
    const newLevel = getSpeedLevel();
    if (speedLevelEl) speedLevelEl.textContent = String(newLevel);
    if (isRunning && newLevel > lastSpeedLevel) {
      levelUpBanner = { level: newLevel, startTime: performance.now() };
      playSoundEffect('levelUp');
    }
    lastSpeedLevel = newLevel;
  }

  // ----- Utilidades -----

  function getStoredHighScore() {
    const parsed = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getStoredStats() {
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return !!target.closest('input, textarea, select, [contenteditable="true"]');
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  function randomShrinkMultiplier() {
    return SHRINK_MULTIPLIERS[Math.floor(Math.random() * SHRINK_MULTIPLIERS.length)];
  }

  function isCellBlockedForFood(cx, cy) {
    if (snake.some(function (s) { return s.x === cx && s.y === cy; })) return true;
    if (obstacles.some(function (o) { return o.x === cx && o.y === cy; })) return true;
    return false;
  }

  function createFoodForCell(cell) {
    const isShrinkFood = Math.random() < FOOD_SHRINK_CHANCE;
    return {
      x: cell.x,
      y: cell.y,
      type: isShrinkFood ? 'shrink' : 'normal',
      multiplier: isShrinkFood ? randomShrinkMultiplier() : null,
    };
  }

  function spawnFood() {
    const maxAttempts = GRID_SIZE * GRID_SIZE;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const cell = randomCell();
      if (!isCellBlockedForFood(cell.x, cell.y)) {
        food = createFoodForCell(cell);
        return true;
      }
      attempts++;
    }
    const freeCells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!isCellBlockedForFood(x, y)) freeCells.push({ x, y });
      }
    }
    if (!freeCells.length) { food = null; return false; }
    food = createFoodForCell(freeCells[Math.floor(Math.random() * freeCells.length)]);
    return true;
  }

  function isCellFree(cx, cy) {
    if (snake.some(function (s) { return s.x === cx && s.y === cy; })) return false;
    if (food && food.x === cx && food.y === cy) return false;
    if (powerUp && powerUp.x === cx && powerUp.y === cy) return false;
    if (obstacles.some(function (o) { return o.x === cx && o.y === cy; })) return false;
    return true;
  }

  function spawnObstacle() {
    if (obstacles.length >= OBSTACLE_MAX) return 0;
    let created = 0;
    for (let n = 0; n < OBSTACLE_CELLS_PER_FOOD; n++) {
      let attempts = 0;
      while (attempts < GRID_SIZE * GRID_SIZE) {
        const cell = randomCell();
        if (isCellFree(cell.x, cell.y)) {
          obstacles.push({ x: cell.x, y: cell.y });
          created++;
          break;
        }
        attempts++;
      }
    }
    return created;
  }

  // ----- Power-ups -----

  function clearPowerUpExpireTimer() {
    if (powerUpExpireTimer) { clearTimeout(powerUpExpireTimer); powerUpExpireTimer = null; }
  }

  function removePowerUpFromBoard() {
    clearPowerUpExpireTimer();
    powerUp = null;
  }

  function trySpawnPowerUp() {
    if (powerUp) return;
    if (Math.random() > POWERUP_SPAWN_CHANCE) return;
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    let attempts = 0;
    while (attempts < GRID_SIZE * GRID_SIZE) {
      const cell = randomCell();
      if (isCellFree(cell.x, cell.y)) {
        powerUp = { x: cell.x, y: cell.y, type, spawnTime: performance.now() };
        powerUpExpireTimer = setTimeout(removePowerUpFromBoard, POWERUP_LIFESPAN_MS);
        return;
      }
      attempts++;
    }
  }

  function activatePowerUp(type) {
    const now = performance.now();
    if (type === 'shield') {
      activeShield = true;
      playSoundEffect('shield');
    } else if (type === 'slow') {
      slowEndTime = now + POWERUP_DURATION_MS;
    } else if (type === 'double') {
      doubleEndTime = now + POWERUP_DURATION_MS;
    }
  }

  // ----- Combo -----

  function incrementCombo() {
    comboCount++;
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(function () { comboCount = 0; }, COMBO_WINDOW_MS);
  }

  function resetCombo() {
    comboCount = 0;
    if (comboTimer) { clearTimeout(comboTimer); comboTimer = null; }
  }

  // ----- Floating texts -----

  function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color: color || '#ffffff', startTime: performance.now() });
  }

  // ----- Nombre de jugador -----

  function abbreviatePlayerName(name) {
    const normalized = (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .toUpperCase();
    if (!normalized) return 'JUG';
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const initials = parts.map(function (p) { return p[0]; }).join('');
      if (initials.length >= 3) return initials.slice(0, 3);
      let compact = initials;
      for (const ch of parts[0].slice(1)) {
        if (compact.length >= 3) break;
        compact += ch;
      }
      return compact.slice(0, 3);
    }
    const base = parts[0];
    if (base.length <= 3) return base;
    const middleConsonants = base.slice(1, -1).replace(/[AEIOU]/g, '');
    let compact = base[0] + middleConsonants;
    if (compact.length >= 3) return compact.slice(0, 3);
    compact += base[base.length - 1];
    if (compact.length >= 3) return compact.slice(0, 3);
    for (const ch of base.slice(1)) {
      if (compact.length >= 3) break;
      compact += ch;
    }
    return compact.slice(0, 3);
  }

  function collapsePlayerBadge() {
    if (!playerBadge) return;
    playerBadge.classList.remove('is-expanded');
    playerBadge.setAttribute('aria-expanded', 'false');
  }

  function setPlayerBadgeName(name) {
    if (!playerBadge) return;
    const fullName = (name || 'Jugador').trim().slice(0, 30);
    playerBadge.textContent = abbreviatePlayerName(fullName);
    playerBadge.dataset.fullName = fullName;
    playerBadge.setAttribute('aria-label', 'Jugador actual: ' + fullName);
    playerBadge.setAttribute('aria-expanded', 'false');
    playerBadge.setAttribute('role', 'button');
    playerBadge.setAttribute('tabindex', '0');
    playerBadge.removeAttribute('aria-hidden');
    collapsePlayerBadge();
  }

  // ----- Leaderboard -----

  function updateLeaderboard() {
    if (!leaderboardEl || !leaderboardList) return;
    const stats = getStoredStats();
    if (!stats.length) {
      leaderboardEl.classList.add('hidden');
      return;
    }
    const playerBests = {};
    stats.forEach(function (g) {
      const name = (g.playerName || 'Jugador').toString().slice(0, 30);
      if (!playerBests[name] || g.score > playerBests[name]) {
        playerBests[name] = g.score;
      }
    });
    const sorted = Object.entries(playerBests)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 5);

    leaderboardList.innerHTML = '';
    sorted.forEach(function (entry, i) {
      const li = document.createElement('li');
      li.className = 'leaderboard-item' + (i === 0 ? ' leader' : '');
      const rankSpan  = document.createElement('span'); rankSpan.className  = 'lb-rank';  rankSpan.textContent  = String(i + 1);
      const nameSpan  = document.createElement('span'); nameSpan.className  = 'lb-name';  nameSpan.textContent  = entry[0];
      const scoreSpan = document.createElement('span'); scoreSpan.className = 'lb-score'; scoreSpan.textContent = entry[1].toLocaleString('es');
      li.appendChild(rankSpan);
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      leaderboardList.appendChild(li);
    });
    leaderboardEl.classList.remove('hidden');
  }

  function updateBestPlayerFromStats() {
    if (!bestPlayerNameEl) return;
    const stats = getStoredStats();
    if (!stats.length) {
      bestPlayerNameEl.textContent = 'Aun sin registros';
      if (playerNameInput && playerNameInput.dataset.prefilledByBest === 'true') {
        playerNameInput.value = '';
        delete playerNameInput.dataset.prefilledByBest;
      }
      updateLeaderboard();
      return;
    }
    let best = stats[0];
    for (let i = 1; i < stats.length; i++) {
      if (stats[i].score > best.score) best = stats[i];
    }
    const name = (best.playerName || 'Jugador').toString().slice(0, 30);
    bestPlayerNameEl.textContent = name;
    if (playerNameInput && !playerNameInput.value.trim()) {
      playerNameInput.value = name;
      playerNameInput.dataset.prefilledByBest = 'true';
    }
    updateLeaderboard();
  }

  // ----- Init -----

  function initGame() {
    collectEffects = [];
    shrinkEffects  = [];
    floatingTexts  = [];
    levelUpBanner  = null;
    obstacles      = [];
    powerUp        = null;
    clearPowerUpExpireTimer();
    activeShield  = false;
    slowEndTime   = 0;
    doubleEndTime = 0;
    resetCombo();
    lastSpeedLevel  = 1;
    foodsEatenCount = 0;
    obstaclesGeneratedCount = 0;
    gameDurationSec = 0;
    if (goFoodsEatenEl)     goFoodsEatenEl.textContent     = '0';
    if (goObstaclesCountEl) goObstaclesCountEl.textContent = '0';

    const head = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
    snake = [
      { ...head },
      { x: head.x - 1, y: head.y },
      { x: head.x - 2, y: head.y },
    ];

    direction     = Direction.RIGHT;
    nextDirection = Direction.RIGHT;
    score = 0;
    scoreEl.textContent = '0';
    previousHighScore = highScore;
    updateSpeedDisplay();
    spawnFood();
    isRunning = true;
    isPaused  = false;
  }

  // ----- Helper dibujo -----

  function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  // ----- Render -----

  function drawGrid() {
    ctx.strokeStyle = 'rgba(46, 213, 115, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const p = i * CELL_SIZE;
      ctx.beginPath(); ctx.moveTo(p, 0);         ctx.lineTo(p, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p);         ctx.lineTo(CANVAS_SIZE, p); ctx.stroke();
    }
  }

  function drawSnake() {
    const totalLen = snake.length;
    snake.forEach(function (segment, i) {
      const x      = segment.x * CELL_SIZE;
      const y      = segment.y * CELL_SIZE;
      const isHead = i === 0;
      const t      = 1 - (i / Math.max(totalLen - 1, 1));
      const radius = isHead
        ? CELL_SIZE / 2 - 1
        : Math.max(3, (CELL_SIZE / 2 - 2) * (0.45 + 0.55 * t));
      const cx = x + CELL_SIZE / 2;
      const cy = y + CELL_SIZE / 2;

      if (isHead && activeShield) {
        ctx.shadowColor = 'rgba(192, 215, 235, 1)';
        ctx.shadowBlur  = 20;
      } else if (isHead) {
        ctx.shadowColor = 'rgba(46, 213, 115, 0.7)';
        ctx.shadowBlur  = 14;
      }

      const alpha    = 0.3 + 0.7 * t;
      ctx.fillStyle  = isHead ? '#4ade80' : 'rgba(46, 213, 115, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle  = 'rgba(10, 14, 20, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        if (activeShield) {
          // Anillo metalico del escudo (plata/acero)
          const shieldGrad = ctx.createLinearGradient(cx - CELL_SIZE / 2, cy, cx + CELL_SIZE / 2, cy);
          shieldGrad.addColorStop(0,    'rgba(180, 200, 220, 0.7)');
          shieldGrad.addColorStop(0.35, 'rgba(230, 245, 255, 1)');
          shieldGrad.addColorStop(0.65, 'rgba(200, 218, 235, 0.9)');
          shieldGrad.addColorStop(1,    'rgba(160, 185, 210, 0.7)');
          ctx.strokeStyle = shieldGrad;
          ctx.lineWidth   = 3;
          ctx.shadowColor = 'rgba(220, 235, 255, 0.9)';
          ctx.shadowBlur  = 14;
          ctx.beginPath();
          ctx.arc(cx, cy, CELL_SIZE / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    });
  }

  function drawObstacles() {
    obstacles.forEach(function (obs) {
      const x     = obs.x * CELL_SIZE;
      const y     = obs.y * CELL_SIZE;
      const inset = 2;
      const w     = CELL_SIZE - inset * 2;
      const h     = CELL_SIZE - inset * 2;
      const left  = x + inset;
      const top   = y + inset;

      ctx.save();
      ctx.fillStyle   = '#151a1f';
      ctx.shadowColor = 'rgba(255, 176, 67, 0.42)';
      ctx.shadowBlur  = 16;
      ctx.fillRect(left, top, w, h);
      ctx.shadowBlur  = 0;

      ctx.save();
      ctx.beginPath(); ctx.rect(left, top, w, h); ctx.clip();
      for (let stripe = -h; stripe < w + h; stripe += 7) {
        ctx.strokeStyle = stripe % 14 === 0 ? 'rgba(255, 190, 79, 0.92)' : 'rgba(41, 32, 18, 0.96)';
        ctx.lineWidth   = 4;
        ctx.beginPath();
        ctx.moveTo(left + stripe, top);
        ctx.lineTo(left + stripe + h, top + h);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 214, 127, 0.95)';
      ctx.lineWidth   = 1.3;
      ctx.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);

      ctx.strokeStyle = 'rgba(255, 88, 88, 0.88)';
      ctx.lineWidth   = 1.8;
      ctx.beginPath();
      ctx.moveTo(left + 4, top + 4);     ctx.lineTo(left + w - 4, top + h - 4);
      ctx.moveTo(left + w - 4, top + 4); ctx.lineTo(left + 4,     top + h - 4);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawFood(now) {
    if (!food) return;
    const pulse  = 1 + Math.sin(now / 280) * 0.1;
    const cx     = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy     = food.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = (CELL_SIZE / 2 - 2) * pulse;

    if (food.type === 'shrink') {
      const grad = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, radius + 2);
      grad.addColorStop(0, '#bae6fd');
      grad.addColorStop(1, '#2563eb');
      ctx.shadowColor = 'rgba(125, 211, 252, 0.65)';
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = '#0c1a3a';
      ctx.font         = 'bold 10px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('x' + food.multiplier, cx, cy);
      return;
    }

    ctx.shadowColor = 'rgba(255, 107, 107, 0.65)';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPowerUp(now) {
    if (!powerUp) return;
    const elapsed   = now - powerUp.spawnTime;
    const remaining = POWERUP_LIFESPAN_MS - elapsed;
    if (remaining < 2000 && Math.floor(now / 220) % 2 === 0) return;

    const pulse  = 1 + Math.sin(now / 200) * 0.13;
    const cx     = powerUp.x * CELL_SIZE + CELL_SIZE / 2;
    const cy     = powerUp.y * CELL_SIZE + CELL_SIZE / 2;
    const r      = (CELL_SIZE / 2 - 1) * pulse;

    const colors = {
      shield: { fill: null,      glow: 'rgba(210, 230, 255, 0.8)',  label: 'ESC' },
      slow:   { fill: '#f472b6', glow: 'rgba(244, 114, 182, 0.7)', label: 'LEN' },
      double: { fill: '#60a5fa', glow: 'rgba(96,  165, 250, 0.7)', label: '2X'  },
    };
    const c = colors[powerUp.type] || colors.slow;

    ctx.save();
    ctx.shadowColor = c.glow;
    ctx.shadowBlur  = 18;

    if (powerUp.type === 'shield') {
      // Degradado metalico plata/acero
      const mg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
      mg.addColorStop(0,    '#ffffff');
      mg.addColorStop(0.35, '#d0e4f4');
      mg.addColorStop(0.7,  '#8fafc8');
      mg.addColorStop(1,    '#4d6e8a');
      ctx.fillStyle = mg;
    } else {
      ctx.fillStyle = c.fill;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur   = 0;
    ctx.fillStyle    = 'rgba(10, 14, 20, 0.95)';
    ctx.font         = 'bold 9px Outfit, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, cx, cy);
    ctx.restore();
  }

  function drawPowerUpIndicators(now) {
    const indicators = [];
    if (activeShield) {
      indicators.push({ label: 'ESCUDO', color: '#c8dff0', progress: 1 });
    }
    if (now < slowEndTime) {
      indicators.push({ label: 'LENTO',  color: '#f472b6', progress: (slowEndTime  - now) / POWERUP_DURATION_MS });
    }
    if (now < doubleEndTime) {
      indicators.push({ label: '2X PTS', color: '#60a5fa', progress: (doubleEndTime - now) / POWERUP_DURATION_MS });
    }
    if (!indicators.length) return;

    indicators.forEach(function (ind, i) {
      const pw = 70;
      const ph = 18;
      const px = CANVAS_SIZE - pw - 6;
      const py = 6 + i * (ph + 5);

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle   = 'rgba(10, 14, 20, 0.78)';
      roundRect(ctx, px, py, pw, ph, 5);
      ctx.fill();

      ctx.fillStyle   = ind.color;
      ctx.globalAlpha = 0.38;
      roundRect(ctx, px + 1, py + 1, (pw - 2) * Math.max(0, ind.progress), ph - 2, 4);
      ctx.fill();

      ctx.globalAlpha  = 0.95;
      ctx.fillStyle    = ind.color;
      ctx.font         = 'bold 9px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ind.label, px + pw / 2, py + ph / 2);
      ctx.restore();
    });
  }

  function drawComboIndicator() {
    if (comboCount < 2) return;
    ctx.save();
    ctx.font         = 'bold 11px Outfit, sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = '#f0c040';
    ctx.shadowColor  = 'rgba(240, 192, 64, 0.85)';
    ctx.shadowBlur   = 10;
    ctx.fillText('COMBO x' + comboCount, 6, 6);
    ctx.restore();
  }

  function triggerCollectEffect(centerX, centerY) {
    collectEffects.push({ x: centerX, y: centerY, startTime: performance.now() });
  }

  function drawCollectEffects(now) {
    const toRemove = [];
    collectEffects.forEach(function (eff, i) {
      const elapsed = now - eff.startTime;
      if (elapsed >= COLLECT_EFFECT_DURATION_MS) { toRemove.push(i); return; }
      const t = elapsed / COLLECT_EFFECT_DURATION_MS;

      ctx.strokeStyle = 'rgba(46, 213, 115, ' + Math.max(0, (1 - t) * 0.9) + ')';
      ctx.lineWidth   = 3;
      ctx.shadowColor = 'rgba(46, 213, 115, 0.9)';
      ctx.shadowBlur  = 14;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, 8 + t * 65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, ' + Math.max(0, (1 - t * 1.2) * 0.5) + ')';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, 12 + t * 50, 0, Math.PI * 2);
      ctx.stroke();

      for (let p = 0; p < PARTICLE_COUNT; p++) {
        const angle = (p / PARTICLE_COUNT) * Math.PI * 2 + t * 0.5;
        const dist  = t * 42;
        ctx.fillStyle = p % 3 === 0
          ? 'rgba(255, 255, 255, ' + Math.max(0, 1 - t * 1.1) + ')'
          : 'rgba(46, 213, 115, '  + Math.max(0, 1 - t * 1.1) + ')';
        ctx.shadowColor = 'rgba(46, 213, 115, 0.8)';
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(eff.x + Math.cos(angle) * dist, eff.y + Math.sin(angle) * dist,
                2 + (1 - t) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });
    toRemove.reverse().forEach(function (idx) { collectEffects.splice(idx, 1); });
  }

  function triggerShrinkEffect(removedSegments, removedAmount) {
    if (!removedSegments.length || removedAmount <= 0) return;
    const anchor = removedSegments[0];
    shrinkEffects.push({
      removedAmount,
      startTime: performance.now(),
      anchorX: anchor.x * CELL_SIZE + CELL_SIZE / 2,
      anchorY: anchor.y * CELL_SIZE + CELL_SIZE / 2,
      segments: removedSegments.map(function (seg) {
        return { cx: seg.x * CELL_SIZE + CELL_SIZE / 2, cy: seg.y * CELL_SIZE + CELL_SIZE / 2 };
      }),
    });
  }

  function drawShrinkEffects(now) {
    const toRemove = [];
    shrinkEffects.forEach(function (eff, i) {
      const elapsed = now - eff.startTime;
      if (elapsed >= SHRINK_EFFECT_DURATION_MS) { toRemove.push(i); return; }
      const t     = elapsed / SHRINK_EFFECT_DURATION_MS;
      const alpha = Math.max(0, 0.8 - t * 0.9);

      eff.segments.forEach(function (seg, idx) {
        const offset = idx * 0.6;
        const radius = Math.max(2.5, CELL_SIZE / 2 - 3 + t * 5 - offset * 0.06);
        const y      = seg.cy - t * 12 - offset;
        ctx.fillStyle   = 'rgba(124, 250, 145, ' + Math.max(0, alpha - idx * 0.05) + ')';
        ctx.shadowColor = 'rgba(124, 250, 145, 0.65)';
        ctx.shadowBlur  = 8;
        ctx.beginPath(); ctx.arc(seg.cx, y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(13, 38, 22, ' + Math.max(0, 0.55 - t * 0.35) + ')';
        ctx.lineWidth   = 1.4;
        ctx.beginPath();
        ctx.moveTo(seg.cx - radius * 0.55, y - radius * 0.45);
        ctx.lineTo(seg.cx + radius * 0.55, y + radius * 0.45);
        ctx.stroke();
      });
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = 'rgba(173, 255, 191, ' + Math.max(0, 1 - t * 1.1) + ')';
      ctx.font         = 'bold 16px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('-' + eff.removedAmount, eff.anchorX, eff.anchorY - 18 - t * 26);
    });
    toRemove.reverse().forEach(function (idx) { shrinkEffects.splice(idx, 1); });
  }

  function drawFloatingTexts(now) {
    const DURATION = 900;
    const toRemove = [];
    floatingTexts.forEach(function (ft, i) {
      const elapsed = now - ft.startTime;
      if (elapsed >= DURATION) { toRemove.push(i); return; }
      const t     = elapsed / DURATION;
      const alpha = Math.max(0, 1 - t * 1.1);
      ctx.save();
      ctx.globalAlpha  = alpha;
      ctx.fillStyle    = ft.color;
      ctx.font         = 'bold 17px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = ft.color;
      ctx.shadowBlur   = 8;
      ctx.fillText(ft.text, ft.x, ft.y - t * 34);
      ctx.restore();
    });
    toRemove.reverse().forEach(function (idx) { floatingTexts.splice(idx, 1); });
  }

  function drawLevelUpBanner(now) {
    if (!levelUpBanner) return;
    const elapsed = now - levelUpBanner.startTime;
    if (elapsed >= LEVELUP_BANNER_MS) { levelUpBanner = null; return; }
    const t = elapsed / LEVELUP_BANNER_MS;

    let alpha;
    if (t < 0.12)      alpha = t / 0.12;
    else if (t > 0.65) alpha = 1 - (t - 0.65) / 0.35;
    else               alpha = 1;

    const scale = t < 0.12 ? 0.75 + 0.25 * (t / 0.12) : 1;
    const text  = 'NIVEL ' + levelUpBanner.level;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.scale(scale, scale);
    ctx.font         = 'bold 26px Outfit, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const tw = ctx.measureText(text).width;
    const ph = 42;
    const pw = tw + 44;

    ctx.fillStyle   = 'rgba(10, 18, 26, 0.82)';
    ctx.shadowColor = 'rgba(46, 213, 115, 0.7)';
    ctx.shadowBlur  = 24;
    roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(46, 213, 115, 0.9)';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    ctx.fillStyle   = '#ffffff';
    ctx.shadowColor = 'rgba(46, 213, 115, 0.9)';
    ctx.shadowBlur  = 12;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function draw(now) {
    const frameTime = now || performance.now();
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid();
    drawObstacles();
    drawFood(frameTime);
    drawPowerUp(frameTime);
    drawSnake();
    drawCollectEffects(frameTime);
    drawShrinkEffects(frameTime);
    drawFloatingTexts(frameTime);
    drawComboIndicator();
    drawPowerUpIndicators(frameTime);
    drawLevelUpBanner(frameTime);
  }

  // ----- Overlays -----

  function isOverlayVisible(el, visibleClass) {
    return !!(el && el.classList.contains(visibleClass));
  }

  function hasBlockingOverlayOpen() {
    return isOverlayVisible(rulesOverlay, 'visible') || isOverlayVisible(statsOverlay, 'visible');
  }

  // ----- Game logic -----

  function tick() {
    if (!isRunning || isPaused) return;
    direction = nextDirection;
    const head    = snake[0];
    const newHead = {
      x: (head.x + direction.dx + GRID_SIZE) % GRID_SIZE,
      y: (head.y + direction.dy + GRID_SIZE) % GRID_SIZE,
    };

    // Colision con cuerpo
    if (snake.some(function (s, i) { return i > 0 && s.x === newHead.x && s.y === newHead.y; })) {
      if (activeShield) { activeShield = false; }
      else { gameOver(); return; }
    }

    // Colision con obstaculos
    if (obstacles.some(function (o) { return o.x === newHead.x && o.y === newHead.y; })) {
      if (activeShield) { activeShield = false; }
      else { gameOver(); return; }
    }

    snake.unshift(newHead);

    // Power-up pickup
    if (powerUp && newHead.x === powerUp.x && newHead.y === powerUp.y) {
      const type = powerUp.type;
      removePowerUpFromBoard();
      activatePowerUp(type);
      const labels = { shield: '+ESCUDO', slow: '+LENTO', double: '+2X PTS' };
      const colors = { shield: '#c8dff0', slow: '#f472b6', double: '#60a5fa' };
      spawnFloatingText(
        newHead.x * CELL_SIZE + CELL_SIZE / 2,
        newHead.y * CELL_SIZE + CELL_SIZE / 2,
        labels[type] || '+PWR',
        colors[type] || '#fff'
      );
    }

    // Comida
    if (food && newHead.x === food.x && newHead.y === food.y) {
      foodsEatenCount += 1;
      triggerCollectEffect(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2);

      if (food.type === 'shrink') {
        playSoundEffect('shrinkFood');
        resetCombo();
        const shrinkBy       = food.multiplier || 1;
        const removable      = Math.max(0, snake.length - MIN_SNAKE_LENGTH);
        const removedCount   = Math.min(shrinkBy, removable);
        const removedSegments = [];
        for (let i = 0; i < removedCount; i++) {
          const removed = snake.pop();
          if (removed) removedSegments.push(removed);
        }
        triggerShrinkEffect(removedSegments, removedCount);
      } else {
        playSoundEffect('normalFood');
        incrementCombo();
        const comboMulti  = Math.min(comboCount, 4);
        const pointsMulti = getPointsMultiplier();
        const pts         = 10 * comboMulti * pointsMulti;
        score += pts;
        scoreEl.textContent = score;
        updateSpeedDisplay();
        obstaclesGeneratedCount += spawnObstacle();
        trySpawnPowerUp();

        const textColor = pointsMulti > 1
          ? '#60a5fa'
          : (comboMulti > 1 ? '#f0c040' : '#ffffff');
        spawnFloatingText(
          food.x * CELL_SIZE + CELL_SIZE / 2,
          food.y * CELL_SIZE + CELL_SIZE / 2,
          '+' + pts,
          textColor
        );

        if (score > highScore) {
          highScore = score;
          highScoreEl.textContent = highScore;
          localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        }
      }

      if (!spawnFood()) { gameOver(); return; }
      return;
    }
    snake.pop();
  }

  function runLoop(timestamp) {
    if (!isRunning) return;
    if (timestamp - lastTick >= getTickMs()) {
      lastTick = timestamp;
      tick();
    }
    draw(timestamp);
    gameLoopId = requestAnimationFrame(runLoop);
  }

  // ----- Estadisticas -----

  function saveGameStats() {
    gameDurationSec = Math.round((performance.now() - gameStartTime) / 1000);
    const entry = {
      score,
      playerName: playerName || 'Jugador',
      date: new Date().toISOString(),
      duration: gameDurationSec,
    };
    let stats = [];
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      if (raw) stats = JSON.parse(raw);
    } catch (_) { stats = []; }
    stats.unshift(entry);
    if (stats.length > MAX_STORED_GAMES) stats = stats.slice(0, MAX_STORED_GAMES);
    try { localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats)); } catch (_) {}
  }

  // ----- Pantallas -----

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? m + 'm ' + s + 's' : s + 's';
  }

  function showGameOverScreen() {
    finalScoreEl.textContent = score;
    if (goFoodsEatenEl)     goFoodsEatenEl.textContent     = String(foodsEatenCount);
    if (goObstaclesCountEl) goObstaclesCountEl.textContent = String(obstaclesGeneratedCount);
    if (goTimePlayedEl)     goTimePlayedEl.textContent     = formatTime(gameDurationSec);
    if (gameOverPlayerEl)   gameOverPlayerEl.textContent   = playerName ? playerName + ', ' : '';

    if (goDeltaScoreEl) {
      const delta = score - previousHighScore;
      if (delta > 0 && previousHighScore > 0) {
        goDeltaScoreEl.textContent = '+' + delta + ' vs record';
        goDeltaScoreEl.className   = 'go-delta positive';
      } else if (delta < 0) {
        goDeltaScoreEl.textContent = delta + ' vs record';
        goDeltaScoreEl.className   = 'go-delta negative';
      } else {
        goDeltaScoreEl.textContent = '';
        goDeltaScoreEl.className   = 'go-delta';
      }
    }

    const isNewRecord = score > 0 && score > previousHighScore;
    if (newRecordBadge) {
      newRecordBadge.classList.toggle('visible', isNewRecord);
      newRecordBadge.setAttribute('aria-hidden', isNewRecord ? 'false' : 'true');
    }
    gameOverScreen.classList.add('overlay-visible');
  }

  function gameOver() {
    isRunning = false;
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    playSoundEffect('gameOver');
    saveGameStats();

    // Screen shake
    if (canvasContainer) {
      canvasContainer.classList.add('shake');
      setTimeout(function () { canvasContainer.classList.remove('shake'); }, 520);
    }

    // Flash rojo al morir
    const flashStart = performance.now();
    function flashLoop(ts) {
      const t = Math.min(1, (ts - flashStart) / DEATH_FLASH_DURATION_MS);
      draw(ts);
      ctx.fillStyle = 'rgba(220, 30, 30, ' + ((1 - t) * 0.55) + ')';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      if (t < 1) {
        requestAnimationFrame(flashLoop);
      } else {
        showGameOverScreen();
      }
    }
    requestAnimationFrame(flashLoop);
  }

  function showStartScreen() {
    isRunning = false;
    isPaused  = false;
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    clearPowerUpExpireTimer();
    gameOverScreen.classList.remove('overlay-visible');
    pauseOverlay.classList.remove('overlay-visible');
    if (newRecordBadge) {
      newRecordBadge.classList.remove('visible');
      newRecordBadge.setAttribute('aria-hidden', 'true');
    }
    updateBestPlayerFromStats();
    startScreen.classList.add('overlay-visible');
  }

  function restart() {
    showStartScreen();
  }

  function startGame() {
    const inputName = (playerNameInput && playerNameInput.value && playerNameInput.value.trim()) || 'Jugador';
    playerName = inputName.trim().slice(0, 30);
    if (playerNameInput) {
      playerNameInput.value = playerName;
      delete playerNameInput.dataset.prefilledByBest;
    }
    startScreen.classList.remove('overlay-visible');
    setPlayerBadgeName(playerName);
    initGame();
    draw();
    lastTick      = performance.now();
    gameStartTime = performance.now();
    gameLoopId    = requestAnimationFrame(runLoop);
  }

  // ----- Pausa -----

  function setPaused(nextPaused) {
    if (!isRunning) return false;
    if (isPaused === nextPaused) return false;
    isPaused = nextPaused;
    if (isPaused) playSoundEffect('pause');
    pauseOverlay.classList.toggle('overlay-visible', isPaused);
    if (!isPaused) lastTick = performance.now();
    return true;
  }

  function togglePause() {
    if (!isRunning) return;
    setPaused(!isPaused);
  }

  // ----- Input -----

  function handleKeydown(e) {
    if (isEditableTarget(e.target)) return;
    if (e.repeat) return;
    const blockingOverlayOpen = hasBlockingOverlayOpen();

    if (e.code === KEY.PAUSE) {
      e.preventDefault();
      if (blockingOverlayOpen) return;
      if (isRunning) togglePause();
      return;
    }

    if (e.code === KEY.RESTART) {
      if (blockingOverlayOpen) return;
      e.preventDefault();
      if (isRunning || gameOverScreen.classList.contains('overlay-visible')) {
        showStartScreen();
      }
      return;
    }

    if (blockingOverlayOpen || isPaused) return;

    if (KEY.UP.includes(e.code))         { e.preventDefault(); changeDirection(Direction.UP);    }
    else if (KEY.DOWN.includes(e.code))  { e.preventDefault(); changeDirection(Direction.DOWN);  }
    else if (KEY.LEFT.includes(e.code))  { e.preventDefault(); changeDirection(Direction.LEFT);  }
    else if (KEY.RIGHT.includes(e.code)) { e.preventDefault(); changeDirection(Direction.RIGHT); }
  }

  function changeDirection(newDir) {
    if (!isRunning || isPaused || hasBlockingOverlayOpen()) return;
    if (newDir === Direction.UP    && direction !== Direction.DOWN)   nextDirection = Direction.UP;
    else if (newDir === Direction.DOWN  && direction !== Direction.UP)    nextDirection = Direction.DOWN;
    else if (newDir === Direction.LEFT  && direction !== Direction.RIGHT) nextDirection = Direction.LEFT;
    else if (newDir === Direction.RIGHT && direction !== Direction.LEFT)  nextDirection = Direction.RIGHT;
  }

  // ----- Touch swipe -----

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY;
    touchLastX  = t.clientX; touchLastY  = t.clientY;
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    touchLastX = e.touches[0].clientX;
    touchLastY = e.touches[0].clientY;
    e.preventDefault();
  }

  function handleTouchEnd() {
    if (touchStartX == null || touchLastX == null) return;
    const dx   = touchLastX - touchStartX;
    const dy   = touchLastY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 24 && absY < 24) { touchStartX = touchStartY = touchLastX = touchLastY = null; return; }
    if (absX > absY) { changeDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT); }
    else             { changeDirection(dy > 0 ? Direction.DOWN  : Direction.UP);   }
    touchStartX = touchStartY = touchLastX = touchLastY = null;
  }

  function bindDirectionButton(button, dir) {
    if (!button) return;
    const onPress = function (e) { e.preventDefault(); changeDirection(dir); };
    button.addEventListener('touchstart', onPress, { passive: false });
    button.addEventListener('click', onPress);
  }

  // ----- Reglas -----

  function openRules()  {
    if (!rulesOverlay) return;
    rulesOverlay.classList.add('visible');
    rulesOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeRules() {
    if (!rulesOverlay) return;
    rulesOverlay.classList.remove('visible');
    rulesOverlay.setAttribute('aria-hidden', 'true');
  }

  // ----- Compartir resultado -----

  function shareResult() {
    const text = [
      'Sn4k3 G4m3',
      (playerName ? playerName + ': ' : '') + score + ' pts',
      'Comidas: ' + foodsEatenCount + ' | Obstaculos: ' + obstaclesGeneratedCount,
      'Tiempo: ' + formatTime(gameDurationSec),
    ].join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Sn4k3 G4m3', text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        if (shareBtn) {
          const orig = shareBtn.textContent;
          shareBtn.textContent = 'Copiado!';
          setTimeout(function () { shareBtn.textContent = orig; }, 2000);
        }
      }).catch(function () {});
    }
  }

  // ----- Event listeners -----

  if (gameLogoEl) {
    gameLogoEl.addEventListener('error', function () { gameLogoEl.style.display = 'none'; });
  }

  if (playerNameInput) {
    playerNameInput.addEventListener('focus', unlockAudio);
    playerNameInput.addEventListener('input', function () { delete playerNameInput.dataset.prefilledByBest; });
  }

  if (playerBadge) {
    playerBadge.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      const next = !playerBadge.classList.contains('is-expanded');
      playerBadge.classList.toggle('is-expanded', next);
      playerBadge.setAttribute('aria-expanded', next ? 'true' : 'false');
    });
    playerBadge.addEventListener('keydown', function (e) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault(); e.stopPropagation();
        const next = !playerBadge.classList.contains('is-expanded');
        playerBadge.classList.toggle('is-expanded', next);
        playerBadge.setAttribute('aria-expanded', next ? 'true' : 'false');
      } else if (e.code === 'Escape') { collapsePlayerBadge(); }
    });
  }

  document.addEventListener('click', function (e) {
    if (!playerBadge || playerBadge.getAttribute('aria-hidden') === 'true') return;
    if (!playerBadge.contains(e.target)) collapsePlayerBadge();
  });

  startBtn.addEventListener('click',  function () { unlockAudio(); startGame(); });
  restartBtn.addEventListener('click', function () { unlockAudio(); restart();   });
  if (shareBtn) shareBtn.addEventListener('click', shareResult);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('pointerdown', unlockAudio, { passive: true });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  handleTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   handleTouchEnd,   { passive: false });

  bindDirectionButton(touchUpBtn,    Direction.UP);
  bindDirectionButton(touchDownBtn,  Direction.DOWN);
  bindDirectionButton(touchLeftBtn,  Direction.LEFT);
  bindDirectionButton(touchRightBtn, Direction.RIGHT);

  if (touchPauseBtn) {
    touchPauseBtn.addEventListener('touchstart', function (e) { e.preventDefault(); togglePause(); }, { passive: false });
    touchPauseBtn.addEventListener('click', togglePause);
  }

  if (rulesBtn)   rulesBtn.addEventListener('click', openRules);
  if (rulesClose) rulesClose.addEventListener('click', closeRules);
  if (rulesOverlay) {
    rulesOverlay.addEventListener('click', function (e) { if (e.target === rulesOverlay) closeRules(); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && rulesOverlay && rulesOverlay.classList.contains('visible')) closeRules();
  });

  window.snakeGameControls = {
    isRunning:  function () { return isRunning; },
    isPaused:   function () { return isPaused;  },
    pause:      function () { return setPaused(true);  },
    resume:     function () { return setPaused(false); },
    syncPersistedState: function () {
      highScore = getStoredHighScore();
      highScoreEl.textContent = String(highScore);
      updateBestPlayerFromStats();
      collapsePlayerBadge();
    },
  };

  updateBestPlayerFromStats();
})();
