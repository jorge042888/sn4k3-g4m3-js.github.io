/**
 * Snake - Juego clasico
 * Canvas 520x520, grid 26x26 celdas de 20px
 */

(function () {
  'use strict';

  const GRID_SIZE = 26;
  const CELL_SIZE = 20;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
  const TICK_MS = 120;

  const FOOD_SHRINK_CHANCE = 0.2;
  const SHRINK_MULTIPLIERS = [1, 2, 3];
  const MIN_SNAKE_LENGTH = 3;

  const COLLECT_EFFECT_DURATION_MS = 550;
  const PARTICLE_COUNT = 16;
  const SHRINK_EFFECT_DURATION_MS = 560;

  const HIGH_SCORE_KEY = 'snake-high-score';
  const GAME_STATS_KEY = 'snake-game-stats';
  const MAX_STORED_GAMES = 100;
  const OBSTACLE_CELLS_PER_FOOD = 1;
  const SOUND_FILES = {
    normalFood: 'audio/comida_roja.mp3',
    shrinkFood: 'audio/comida_verde.mp3',
    gameOver: 'audio/game_over.mp3',
    pause: 'audio/pause.mp3',
  };

  const Direction = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
  };

  const KEY = {
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    PAUSE: 'Space',
    RESTART: 'Escape',
  };

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const finalScoreEl = document.getElementById('final-score');
  const goFoodsEatenEl = document.getElementById('go-foods-eaten');
  const goObstaclesCountEl = document.getElementById('go-obstacles-count');
  const gameLogoEl = document.getElementById('game-logo');

  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const pauseOverlay = document.getElementById('pause-overlay');
  const statsOverlay = document.getElementById('stats-overlay');
  const rulesOverlay = document.getElementById('rules-overlay');

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const rulesBtn = document.getElementById('rules-btn');
  const rulesClose = document.getElementById('rules-close');

  const touchUpBtn = document.getElementById('touch-up');
  const touchDownBtn = document.getElementById('touch-down');
  const touchLeftBtn = document.getElementById('touch-left');
  const touchRightBtn = document.getElementById('touch-right');

  const playerNameInput = document.getElementById('player-name');
  const playerBadge = document.getElementById('player-badge');
  const gameOverPlayerEl = document.getElementById('game-over-player');
  const bestPlayerNameEl = document.getElementById('best-player-name');

  let playerName = '';
  let snake = [];
  let direction = Direction.RIGHT;
  let nextDirection = Direction.RIGHT;
  let food = null;
  let obstacles = [];

  let score = 0;
  let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  let foodsEatenCount = 0;
  let obstaclesGeneratedCount = 0;

  let gameLoopId = null;
  let isRunning = false;
  let isPaused = false;
  let lastTick = 0;
  let gameStartTime = 0;

  // Swipe tracking sobre canvas
  let touchStartX = null;
  let touchStartY = null;
  let touchLastX = null;
  let touchLastY = null;

  let collectEffects = [];
  let shrinkEffects = [];
  let audioUnlocked = false;

  highScoreEl.textContent = highScore;

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
    const editable = target.closest('input, textarea, select, [contenteditable="true"]');
    return !!editable;
  }

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
      const initials = parts.map((part) => part[0]).join('');
      if (initials.length >= 3) return initials.slice(0, 3);

      const firstWord = parts[0];
      let compact = initials;
      for (const ch of firstWord.slice(1)) {
        if (compact.length >= 3) break;
        compact += ch;
      }
      return compact.slice(0, 3);
    }

    const base = parts[0];
    if (base.length <= 3) return base;

    const middleConsonants = base.slice(1, -1).replace(/[AEIOU]/g, '');
    let compact = base[0] + middleConsonants;

    if (compact.length >= 3) {
      return compact.slice(0, 3);
    }

    compact += base[base.length - 1];
    if (compact.length >= 3) {
      return compact.slice(0, 3);
    }

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
    const abbreviatedName = abbreviatePlayerName(fullName);

    playerBadge.textContent = abbreviatedName;
    playerBadge.dataset.fullName = fullName;
    playerBadge.setAttribute('aria-label', `Jugador actual: ${fullName}`);
    playerBadge.setAttribute('aria-expanded', 'false');
    playerBadge.setAttribute('role', 'button');
    playerBadge.setAttribute('tabindex', '0');
    playerBadge.removeAttribute('aria-hidden');
    collapsePlayerBadge();
  }

  function unlockAudio() {
    audioUnlocked = true;
  }

  function playSoundEffect(soundKey) {
    if (!audioUnlocked) return;

    const src = SOUND_FILES[soundKey];
    if (!src) return;

    const sound = new Audio(src);
    sound.preload = 'auto';
    sound.play().catch(function () {});
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  function randomShrinkMultiplier() {
    const idx = Math.floor(Math.random() * SHRINK_MULTIPLIERS.length);
    return SHRINK_MULTIPLIERS[idx];
  }

  function isCellBlockedForFood(cx, cy) {
    if (snake.some((s) => s.x === cx && s.y === cy)) return true;
    if (obstacles.some((o) => o.x === cx && o.y === cy)) return true;
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
        if (!isCellBlockedForFood(x, y)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (!freeCells.length) {
      food = null;
      return false;
    }

    const fallbackCell = freeCells[Math.floor(Math.random() * freeCells.length)];
    food = createFoodForCell(fallbackCell);
    return true;
  }

  function isCellFree(cx, cy) {
    if (snake.some((s) => s.x === cx && s.y === cy)) return false;
    if (food && food.x === cx && food.y === cy) return false;
    if (obstacles.some((o) => o.x === cx && o.y === cy)) return false;
    return true;
  }

  function spawnObstacle() {
    let created = 0;

    for (let n = 0; n < OBSTACLE_CELLS_PER_FOOD; n++) {
      let attempts = 0;
      const maxAttempts = GRID_SIZE * GRID_SIZE;
      while (attempts < maxAttempts) {
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

  function initGame() {
    collectEffects = [];
    shrinkEffects = [];
    obstacles = [];

    foodsEatenCount = 0;
    obstaclesGeneratedCount = 0;
    if (goFoodsEatenEl) goFoodsEatenEl.textContent = '0';
    if (goObstaclesCountEl) goObstaclesCountEl.textContent = '0';

    const head = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
    snake = [
      { ...head },
      { x: head.x - 1, y: head.y },
      { x: head.x - 2, y: head.y },
    ];

    direction = Direction.RIGHT;
    nextDirection = Direction.RIGHT;
    score = 0;
    scoreEl.textContent = '0';
    spawnFood();
    isRunning = true;
    isPaused = false;
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(56, 205, 235, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const p = i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(CANVAS_SIZE, p);
      ctx.stroke();
    }
  }

  function drawSnake() {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    gradient.addColorStop(0, '#5dd4f0');
    gradient.addColorStop(0.5, '#38CDEB');
    gradient.addColorStop(1, '#2ab8d4');

    snake.forEach((segment, i) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const isHead = i === 0;
      const radius = isHead ? CELL_SIZE / 2 - 1 : CELL_SIZE / 2 - 2;
      const cx = x + CELL_SIZE / 2;
      const cy = y + CELL_SIZE / 2;

      if (isHead) {
        ctx.shadowColor = 'rgba(56, 205, 235, 0.6)';
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(10, 14, 20, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawObstacles() {
    obstacles.forEach((obs) => {
      const x = obs.x * CELL_SIZE;
      const y = obs.y * CELL_SIZE;
      const inset = 2;
      const w = CELL_SIZE - inset * 2;
      const h = CELL_SIZE - inset * 2;

      const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
      grad.addColorStop(0, '#EB8DFC');
      grad.addColorStop(0.5, '#f4b4ff');
      grad.addColorStop(1, '#c05ae3');

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(235, 141, 252, 0.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.rect(x + inset, y + inset, w, h);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(235, 141, 252, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, w - 1, h - 1);
    });
  }

  function drawFood() {
    if (!food) return;

    const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2;

    if (food.type === 'shrink') {
      const grad = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, CELL_SIZE / 2 + 2);
      grad.addColorStop(0, '#8cff95');
      grad.addColorStop(1, '#22a352');

      ctx.shadowColor = 'rgba(106, 255, 143, 0.55)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#072314';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${food.multiplier}`, cx, cy);
      return;
    }

    ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function triggerCollectEffect(centerX, centerY) {
    collectEffects.push({
      x: centerX,
      y: centerY,
      startTime: performance.now(),
    });
  }

  function drawCollectEffects(now) {
    const toRemove = [];

    collectEffects.forEach((eff, i) => {
      const elapsed = now - eff.startTime;
      if (elapsed >= COLLECT_EFFECT_DURATION_MS) {
        toRemove.push(i);
        return;
      }

      const t = elapsed / COLLECT_EFFECT_DURATION_MS;
      const ringRadius = 8 + t * 65;
      const ringAlpha = Math.max(0, (1 - t) * 0.9);

      ctx.strokeStyle = `rgba(56, 205, 235, ${ringAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(56, 205, 235, 0.9)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const ring2Radius = 12 + t * 50;
      const ring2Alpha = Math.max(0, (1 - t * 1.2) * 0.5);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ring2Alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, ring2Radius, 0, Math.PI * 2);
      ctx.stroke();

      for (let p = 0; p < PARTICLE_COUNT; p++) {
        const angle = (p / PARTICLE_COUNT) * Math.PI * 2 + t * 0.5;
        const dist = t * 42;
        const px = eff.x + Math.cos(angle) * dist;
        const py = eff.y + Math.sin(angle) * dist;
        const particleAlpha = Math.max(0, 1 - t * 1.1);
        const size = 2 + (1 - t) * 2;

        ctx.fillStyle = p % 3 === 0
          ? `rgba(255, 255, 255, ${particleAlpha})`
          : `rgba(56, 205, 235, ${particleAlpha})`;
        ctx.shadowColor = 'rgba(56, 205, 235, 0.8)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    toRemove.reverse().forEach((idx) => collectEffects.splice(idx, 1));
  }

  // Efecto de reduccion: dibuja "fantasmas" de segmentos removidos y un texto flotante (-N).
  function triggerShrinkEffect(removedSegments, removedAmount) {
    if (!removedSegments.length || removedAmount <= 0) return;

    const anchor = removedSegments[0];
    shrinkEffects.push({
      removedAmount,
      startTime: performance.now(),
      anchorX: anchor.x * CELL_SIZE + CELL_SIZE / 2,
      anchorY: anchor.y * CELL_SIZE + CELL_SIZE / 2,
      segments: removedSegments.map((seg) => ({
        cx: seg.x * CELL_SIZE + CELL_SIZE / 2,
        cy: seg.y * CELL_SIZE + CELL_SIZE / 2,
      })),
    });
  }

  function drawShrinkEffects(now) {
    const toRemove = [];

    shrinkEffects.forEach((eff, i) => {
      const elapsed = now - eff.startTime;
      if (elapsed >= SHRINK_EFFECT_DURATION_MS) {
        toRemove.push(i);
        return;
      }

      const t = elapsed / SHRINK_EFFECT_DURATION_MS;
      const alpha = Math.max(0, 0.8 - t * 0.9);

      eff.segments.forEach((seg, idx) => {
        const offset = idx * 0.6;
        const radius = Math.max(2.5, CELL_SIZE / 2 - 3 + t * 5 - offset * 0.06);
        const y = seg.cy - t * 12 - offset;

        ctx.fillStyle = `rgba(124, 250, 145, ${Math.max(0, alpha - idx * 0.05)})`;
        ctx.shadowColor = 'rgba(124, 250, 145, 0.65)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(seg.cx, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(13, 38, 22, ${Math.max(0, 0.55 - t * 0.35)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(seg.cx - radius * 0.55, y - radius * 0.45);
        ctx.lineTo(seg.cx + radius * 0.55, y + radius * 0.45);
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(173, 255, 191, ${Math.max(0, 1 - t * 1.1)})`;
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`-${eff.removedAmount}`, eff.anchorX, eff.anchorY - 18 - t * 26);
    });

    toRemove.reverse().forEach((idx) => shrinkEffects.splice(idx, 1));
  }

  function draw(now) {
    const frameTime = now || performance.now();

    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid();
    drawObstacles();
    drawFood();
    drawSnake();
    drawCollectEffects(frameTime);
    drawShrinkEffects(frameTime);
  }

  function isOverlayVisible(el, visibleClass) {
    return !!(el && el.classList.contains(visibleClass));
  }

  function hasBlockingOverlayOpen() {
    return (
      isOverlayVisible(rulesOverlay, 'visible') ||
      isOverlayVisible(statsOverlay, 'visible')
    );
  }

  function tick() {
    if (!isRunning || isPaused) return;

    direction = nextDirection;
    const head = snake[0];
    const newHead = {
      x: (head.x + direction.dx + GRID_SIZE) % GRID_SIZE,
      y: (head.y + direction.dy + GRID_SIZE) % GRID_SIZE,
    };

    if (snake.some((s, i) => i > 0 && s.x === newHead.x && s.y === newHead.y)) {
      gameOver();
      return;
    }
    if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (food && newHead.x === food.x && newHead.y === food.y) {
      foodsEatenCount += 1;

      const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
      triggerCollectEffect(cx, cy);

      if (food.type === 'shrink') {
        playSoundEffect('shrinkFood');
        const shrinkBy = food.multiplier || 1;
        const removable = Math.max(0, snake.length - MIN_SNAKE_LENGTH);
        const removedCount = Math.min(shrinkBy, removable);
        const removedSegments = [];

        // Removemos cola y guardamos segmentos para animar la reduccion.
        for (let i = 0; i < removedCount; i++) {
          const removed = snake.pop();
          if (removed) removedSegments.push(removed);
        }
        triggerShrinkEffect(removedSegments, removedCount);
      } else {
        playSoundEffect('normalFood');
        score += 10;
        scoreEl.textContent = score;
        obstaclesGeneratedCount += spawnObstacle();

        if (score > highScore) {
          highScore = score;
          highScoreEl.textContent = highScore;
          localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        }
      }

      if (!spawnFood()) {
        gameOver();
        return;
      }
      return;
    }

    snake.pop();
  }

  function runLoop(timestamp) {
    if (!isRunning) return;

    if (timestamp - lastTick >= TICK_MS) {
      lastTick = timestamp;
      tick();
    }
    draw(timestamp);
    gameLoopId = requestAnimationFrame(runLoop);
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
    lastTick = performance.now();
    gameStartTime = performance.now();
    gameLoopId = requestAnimationFrame(runLoop);
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
      return;
    }

    let best = stats[0];
    for (let i = 1; i < stats.length; i++) {
      if (stats[i].score > best.score) {
        best = stats[i];
      }
    }

    const name = (best.playerName || 'Jugador').toString().slice(0, 30);
    bestPlayerNameEl.textContent = name;
    if (playerNameInput && !playerNameInput.value.trim()) {
      playerNameInput.value = name;
      playerNameInput.dataset.prefilledByBest = 'true';
    }
  }

  function saveGameStats() {
    const durationSec = Math.round((performance.now() - gameStartTime) / 1000);
    const entry = {
      score,
      playerName: playerName || 'Jugador',
      date: new Date().toISOString(),
      duration: durationSec,
    };

    let stats = [];
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      if (raw) stats = JSON.parse(raw);
    } catch (_) {
      stats = [];
    }

    stats.unshift(entry);
    if (stats.length > MAX_STORED_GAMES) stats = stats.slice(0, MAX_STORED_GAMES);

    try {
      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
    } catch (_) {}
  }

  function gameOver() {
    isRunning = false;
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }

    playSoundEffect('gameOver');
    saveGameStats();
    finalScoreEl.textContent = score;
    if (goFoodsEatenEl) goFoodsEatenEl.textContent = String(foodsEatenCount);
    if (goObstaclesCountEl) goObstaclesCountEl.textContent = String(obstaclesGeneratedCount);
    if (gameOverPlayerEl) gameOverPlayerEl.textContent = playerName ? `${playerName}, ` : '';
    gameOverScreen.classList.add('overlay-visible');
  }

  function restart() {
    gameOverScreen.classList.remove('overlay-visible');
    startGame();
  }

  function setPaused(nextPaused) {
    if (!isRunning) return false;
    if (isPaused === nextPaused) return false;

    isPaused = nextPaused;
    if (isPaused) playSoundEffect('pause');
    pauseOverlay.classList.toggle('overlay-visible', isPaused);
    if (!isPaused) {
      lastTick = performance.now();
    }
    return true;
  }

  function togglePause() {
    if (!isRunning) return;
    setPaused(!isPaused);
  }

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
      if (isRunning && !isPaused) {
        restart();
      }
      return;
    }

    if (blockingOverlayOpen || isPaused) return;

    if (KEY.UP.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.UP);
    } else if (KEY.DOWN.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.DOWN);
    } else if (KEY.LEFT.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.LEFT);
    } else if (KEY.RIGHT.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.RIGHT);
    }
  }

  function changeDirection(newDir) {
    if (!isRunning || isPaused || hasBlockingOverlayOpen()) return;

    if (newDir === Direction.UP && direction !== Direction.DOWN) {
      nextDirection = Direction.UP;
    } else if (newDir === Direction.DOWN && direction !== Direction.UP) {
      nextDirection = Direction.DOWN;
    } else if (newDir === Direction.LEFT && direction !== Direction.RIGHT) {
      nextDirection = Direction.LEFT;
    } else if (newDir === Direction.RIGHT && direction !== Direction.LEFT) {
      nextDirection = Direction.RIGHT;
    }
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLastX = touchStartX;
    touchLastY = touchStartY;
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchLastX = t.clientX;
    touchLastY = t.clientY;
    e.preventDefault();
  }

  function handleTouchEnd() {
    if (touchStartX == null || touchLastX == null) return;

    const dx = touchLastX - touchStartX;
    const dy = touchLastY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;

    if (absX < threshold && absY < threshold) {
      touchStartX = touchStartY = touchLastX = touchLastY = null;
      return;
    }

    if (absX > absY) {
      if (dx > 0) {
        changeDirection(Direction.RIGHT);
      } else {
        changeDirection(Direction.LEFT);
      }
    } else if (dy > 0) {
      changeDirection(Direction.DOWN);
    } else {
      changeDirection(Direction.UP);
    }

    touchStartX = touchStartY = touchLastX = touchLastY = null;
  }

  // Botones tactiles y swipe conviven; ambos reutilizan changeDirection().
  function bindDirectionButton(button, dir) {
    if (!button) return;

    const onPress = function (e) {
      e.preventDefault();
      changeDirection(dir);
    };

    button.addEventListener('touchstart', onPress, { passive: false });
    button.addEventListener('click', onPress);
  }

  function openRules() {
    if (!rulesOverlay) return;
    rulesOverlay.classList.add('visible');
    rulesOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeRules() {
    if (!rulesOverlay) return;
    rulesOverlay.classList.remove('visible');
    rulesOverlay.setAttribute('aria-hidden', 'true');
  }

  if (gameLogoEl) {
    gameLogoEl.addEventListener('error', function () {
      gameLogoEl.style.display = 'none';
    });
  }

  if (playerNameInput) {
    playerNameInput.addEventListener('focus', unlockAudio);
    playerNameInput.addEventListener('input', function () {
      delete playerNameInput.dataset.prefilledByBest;
    });
  }

  if (playerBadge) {
    playerBadge.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const nextExpanded = !playerBadge.classList.contains('is-expanded');
      playerBadge.classList.toggle('is-expanded', nextExpanded);
      playerBadge.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    });

    playerBadge.addEventListener('keydown', function (e) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        const nextExpanded = !playerBadge.classList.contains('is-expanded');
        playerBadge.classList.toggle('is-expanded', nextExpanded);
        playerBadge.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      } else if (e.code === 'Escape') {
        collapsePlayerBadge();
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (!playerBadge || playerBadge.getAttribute('aria-hidden') === 'true') return;
    if (playerBadge.contains(e.target)) return;
    collapsePlayerBadge();
  });

  startBtn.addEventListener('click', function () {
    unlockAudio();
    startGame();
  });
  restartBtn.addEventListener('click', function () {
    unlockAudio();
    restart();
  });
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('pointerdown', unlockAudio, { passive: true });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  bindDirectionButton(touchUpBtn, Direction.UP);
  bindDirectionButton(touchDownBtn, Direction.DOWN);
  bindDirectionButton(touchLeftBtn, Direction.LEFT);
  bindDirectionButton(touchRightBtn, Direction.RIGHT);

  if (rulesBtn) {
    rulesBtn.addEventListener('click', openRules);
  }
  if (rulesClose) {
    rulesClose.addEventListener('click', closeRules);
  }
  if (rulesOverlay) {
    rulesOverlay.addEventListener('click', function (e) {
      if (e.target === rulesOverlay) closeRules();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && rulesOverlay && rulesOverlay.classList.contains('visible')) {
      closeRules();
    }
  });

  window.snakeGameControls = {
    isRunning: function () {
      return isRunning;
    },
    isPaused: function () {
      return isPaused;
    },
    pause: function () {
      return setPaused(true);
    },
    resume: function () {
      return setPaused(false);
    },
    syncPersistedState: function () {
      highScore = getStoredHighScore();
      highScoreEl.textContent = String(highScore);
      updateBestPlayerFromStats();
      collapsePlayerBadge();
    },
  };

  updateBestPlayerFromStats();
})();
