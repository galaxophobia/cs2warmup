const startButton = document.getElementById('startButton');
const gameWrapper = document.getElementById('gameWrapper');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const target = {
  x: 100,
  y: 100,
  radius: 24,
};

let score = 0;
let gameStarted = false;

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

function render() {
  drawBackground();
  drawScore();
  drawTarget();
  drawCrosshair();
}

function isTargetHit(clickX, clickY) {
  const dx = clickX - target.x;
  const dy = clickY - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= target.radius;
}

function onCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvasWidth / rect.width;
  const scaleY = canvasHeight / rect.height;

  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  if (isTargetHit(clickX, clickY)) {
    score += 1;
    placeTargetRandomly();
    render();
  }
}

function startGame() {
  if (gameStarted) {
    return;
  }

  gameStarted = true;
  gameWrapper.classList.remove('hidden');
  startButton.disabled = true;
  startButton.textContent = 'STARTED';

  placeTargetRandomly();
  render();
}

startButton.addEventListener('click', startGame);
canvas.addEventListener('click', onCanvasClick);
