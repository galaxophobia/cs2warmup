const startBtn = document.getElementById("startBtn");
const nicknameInput = document.getElementById("nicknameInput");
const currentNick = document.getElementById("currentNick");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreText = document.getElementById("scoreText");
const bestText = document.getElementById("bestText");
const nickText = document.getElementById("nickText");
const playAgainBtn = document.getElementById("playAgainBtn");

const BEST_SCORE_KEY = "cs2warmup-best-score";
const NICKNAME_KEY = "cs2warmup-nickname";
const DEFAULT_NICKNAME = "Player";

let score = 0;
let bestScore = 0;
let timeLeft = 60;
let gameRunning = false;
let timerInterval = null;
let animationFrameId = null;
let playerNickname = DEFAULT_NICKNAME;

let target = null;
let hitmarkerFrames = 0;
let hitmarkerPosition = null;
let crosshairPosition = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

function sanitizeNickname(value) {
  const trimmed = value.trim();
  return trimmed || DEFAULT_NICKNAME;
}

function updateNicknameUI() {
  currentNick.textContent = `Nick: ${playerNickname}`;
  nickText.textContent = `Nick: ${playerNickname}`;
}

function loadNickname() {
  const savedNickname = localStorage.getItem(NICKNAME_KEY);
  playerNickname = sanitizeNickname(savedNickname || DEFAULT_NICKNAME);
  nicknameInput.value = playerNickname;
  updateNicknameUI();
}

function saveNickname() {
  playerNickname = sanitizeNickname(nicknameInput.value);
  nicknameInput.value = playerNickname;
  localStorage.setItem(NICKNAME_KEY, playerNickname);
  updateNicknameUI();
}

function loadBestScore() {
  const savedBestScore = Number(localStorage.getItem(BEST_SCORE_KEY));
  bestScore = Number.isFinite(savedBestScore) ? savedBestScore : 0;
}

function saveBestScore() {
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

function spawnTarget() {
  const size = 24;
  const edgePadding = 20;
  const minX = edgePadding;
  const maxX = canvas.width - size - edgePadding;
  const minY = edgePadding;
  const maxY = canvas.height - size - edgePadding;

  const hudSafeZone = {
    x: 10,
    y: 10,
    width: 250,
    height: 98
  };
  const hudPadding = 20;
  const topLeftSafePadding = 70;

  function isInsideRect(pointX, pointY, rect) {
    return (
      pointX >= rect.x &&
      pointX <= rect.x + rect.width &&
      pointY >= rect.y &&
      pointY <= rect.y + rect.height
    );
  }

  for (let attempt = 0; attempt < 80; attempt++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    const isNearTopLeftCorner =
      centerX < topLeftSafePadding && centerY < topLeftSafePadding;

    const isOnHud = isInsideRect(centerX, centerY, {
      x: hudSafeZone.x - hudPadding,
      y: hudSafeZone.y - hudPadding,
      width: hudSafeZone.width + hudPadding * 2,
      height: hudSafeZone.height + hudPadding * 2
    });

    if (!isNearTopLeftCorner && !isOnHud) {
      target = { x, y, size };
      return;
    }
  }

  target = {
    x: (canvas.width - size) / 2,
    y: (canvas.height - size) / 2,
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
  saveNickname();

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

  scoreText.textContent = `Score: ${score}`;
  bestText.textContent = `Best: ${bestScore}`;
  nickText.textContent = `Nick: ${playerNickname}`;
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

function drawHudBox(x, y, width, height) {
  ctx.fillStyle = "rgba(8, 12, 18, 0.85)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(135, 168, 196, 0.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

function drawHud() {
  drawHudBox(10, 10, 250, 98);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial";
  ctx.fillText(`Score: ${score}`, 20, 42);

  ctx.fillStyle = "#ffd166";
  ctx.font = "700 26px Arial";
  ctx.fillText(`Time: ${timeLeft}s`, 20, 74);

  ctx.fillStyle = "#9bd7ff";
  ctx.font = "600 15px Arial";
  ctx.fillText(`Best: ${bestScore}`, 20, 96);

  ctx.textAlign = "right";
  ctx.fillStyle = "#9bd7ff";
  ctx.font = "600 15px Arial";
  ctx.fillText(`Nick: ${playerNickname}`, canvas.width - 16, 30);
  ctx.textAlign = "start";
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

nicknameInput.addEventListener("change", saveNickname);
nicknameInput.addEventListener("blur", saveNickname);

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
loadNickname();
