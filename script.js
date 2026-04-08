const startBtn = document.getElementById("startBtn");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreText = document.getElementById("scoreText");
const bestText = document.getElementById("bestText");
const playAgainBtn = document.getElementById("playAgainBtn");

const BEST_SCORE_KEY = "cs2warmup-best-score";

let score = 0;
let bestScore = 0;
let timeLeft = 60;
let gameRunning = false;
let timerInterval = null;
let animationFrameId = null;

let target = null;
let hitmarkerFrames = 0;
let hitmarkerPosition = null;
let crosshairPosition = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

function loadBestScore() {
  const savedBestScore = Number(localStorage.getItem(BEST_SCORE_KEY));
  bestScore = Number.isFinite(savedBestScore) ? savedBestScore : 0;
}

function saveBestScore() {
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

function spawnTarget() {
  const size = 30;

  target = {
    x: Math.random() * (canvas.width - size),
    y: Math.random() * (canvas.height - size),
    size
  };
}

function resetGame() {
  score = 0;
  timeLeft = 60;
  hitmarkerFrames = 0;
  hitmarkerPosition = null;
  crosshairPosition = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
  spawnTarget();
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;

    if (timeLeft <= 0) {
      timeLeft = 0;
      stopGame();
    }
  }, 1000);
}

function startGame() {
  canvas.classList.remove("hidden");
  gameOverOverlay.classList.add("hidden");

  resetGame();
  gameRunning = true;

  startTimer();
  render();
}

function stopGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }

  scoreText.textContent = `Your score: ${score}`;
  bestText.textContent = `Best: ${bestScore}`;
  gameOverOverlay.classList.remove("hidden");

  render();
}

function drawTarget() {
  if (!target) return;

  ctx.fillStyle = "#ff3b3b";
  ctx.beginPath();
  ctx.arc(
    target.x + target.size / 2,
    target.y + target.size / 2,
    target.size / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawHud() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 12, 30);
  ctx.fillText(`Time: ${timeLeft}`, 12, 58);
}

function drawCrosshair() {
  const { x, y } = crosshairPosition;

  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
}

function drawHitmarker() {
  if (hitmarkerFrames <= 0 || !hitmarkerPosition) return;

  const { x, y } = hitmarkerPosition;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x - 4, y - 4);

  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x + 4, y - 4);

  ctx.moveTo(x - 12, y + 12);
  ctx.lineTo(x - 4, y + 4);

  ctx.moveTo(x + 12, y + 12);
  ctx.lineTo(x + 4, y + 4);
  ctx.stroke();

  hitmarkerFrames--;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0a0f15";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawTarget();
  drawHud();
  drawCrosshair();
  drawHitmarker();

  if (gameRunning) {
    animationFrameId = requestAnimationFrame(render);
  }
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

canvas.addEventListener("mousemove", (event) => {
  if (!gameRunning) return;

  crosshairPosition = {
    x: Math.max(0, Math.min(canvas.width, event.offsetX)),
    y: Math.max(0, Math.min(canvas.height, event.offsetY))
  };
});

canvas.addEventListener("click", () => {
  if (!gameRunning || !target) return;

  const shotX = crosshairPosition.x;
  const shotY = crosshairPosition.y;

  const dx = shotX - (target.x + target.size / 2);
  const dy = shotY - (target.y + target.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= target.size / 2) {
    score++;
    hitmarkerFrames = 8;
    hitmarkerPosition = { x: shotX, y: shotY };
    spawnTarget();
  }
});

loadBestScore();
