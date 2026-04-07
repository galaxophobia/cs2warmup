const startButton = document.getElementById('startButton');
const gameWrapper = document.getElementById('gameWrapper');
const gameMessage = document.getElementById('gameMessage');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const GAME_DURATION_SECONDS = 60;
const HITMARKER_DURATION_MS = 140;

const target = {
  x: 100,
  y: 100,
  radius: 24,
};

let score = 0;
let timeLeft = GAME_DURATION_SECONDS;
let gameStarted = false;
let timerIntervalId = null;
let gameEndTimestamp = 0;
let hitmarkerVisibleUntil = 0;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function placeTargetRandomly() {
  target.x = randomRange(target.radius, canvasWidth - target.radius);
  target.y = randomRange(target.radius, canvasHeight - target.radius);
}

function drawBackground() {
  ctx.fillStyle = '#0a0f15';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawScore() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, 16, 34);
}

function drawTimer() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  const timerText = `Time: ${timeLeft}s`;
  const timerTextWidth = ctx.measureText(timerText).width;
  ctx.fillText(timerText, canvasWidth - timerTextWidth - 16, 34);
}

function drawTarget() {
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff3b3b';
  ctx.fill();
  ctx.closePath();
}

function drawCrosshair() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const size = 12;
  const gap = 4;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX - size, centerY);
  ctx.lineTo(centerX - gap, centerY);
  ctx.moveTo(centerX + gap, centerY);
  ctx.lineTo(centerX + size, centerY);
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX, centerY - gap);
  ctx.moveTo(centerX, centerY + gap);
  ctx.lineTo(centerX, centerY + size);
  ctx.stroke();
  ctx.closePath();
}

function drawHitmarker() {
  if (performance.now() > hitmarkerVisibleUntil) {
    return;
  }

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const innerGap = 8;
  const outerSize = 18;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX - innerGap, centerY - innerGap);
  ctx.lineTo(centerX - outerSize, centerY - outerSize);
  ctx.moveTo(centerX + innerGap, centerY - innerGap);
  ctx.lineTo(centerX + outerSize, centerY - outerSize);
  ctx.moveTo(centerX - innerGap, centerY + innerGap);
  ctx.lineTo(centerX - outerSize, centerY + outerSize);
  ctx.moveTo(centerX + innerGap, centerY + innerGap);
  ctx.lineTo(centerX + outerSize, centerY + outerSize);
  ctx.stroke();
  ctx.closePath();
}

function render() {
  drawBackground();
  drawScore();
  drawTimer();

  if (gameStarted) {
    drawTarget();
  }

  drawCrosshair();
  drawHitmarker();
}

function isTargetHit(clickX, clickY) {
  const dx = clickX - target.x;
  const dy = clickY - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= target.radius;
}

function onCanvasClick(event) {
  if (!gameStarted || timeLeft <= 0) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvasWidth / rect.width;
  const scaleY = canvasHeight / rect.height;

  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  if (isTargetHit(clickX, clickY)) {
    score += 1;
    hitmarkerVisibleUntil = performance.now() + HITMARKER_DURATION_MS;
    placeTargetRandomly();
    render();
  }
}

function stopGame() {
  gameStarted = false;
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  hitmarkerVisibleUntil = 0;
  startButton.disabled = false;
  startButton.textContent = 'START';
  gameMessage.textContent = `Koniec czasu! Twój końcowy wynik: ${score}`;
  render();
}

function updateTimeLeft() {
  const remainingMilliseconds = Math.max(0, gameEndTimestamp - Date.now());
  timeLeft = Math.ceil(remainingMilliseconds / 1000);
}

function startTimer() {
  clearInterval(timerIntervalId);

  gameEndTimestamp = Date.now() + GAME_DURATION_SECONDS * 1000;
  timerIntervalId = setInterval(() => {
    updateTimeLeft();

    if (timeLeft <= 0) {
      timeLeft = 0;
      stopGame();
      return;
    }

    render();
  }, 100);
}

function startGame() {
  clearInterval(timerIntervalId);
  score = 0;
  timeLeft = GAME_DURATION_SECONDS;
  gameStarted = true;
  hitmarkerVisibleUntil = 0;
  gameMessage.textContent = '';
  gameWrapper.classList.remove('hidden');
  startButton.disabled = true;
  startButton.textContent = 'STARTED';

  placeTargetRandomly();
  render();
  startTimer();
}

startButton.addEventListener('click', startGame);
canvas.addEventListener('click', onCanvasClick);
