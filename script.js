const startBtn = document.getElementById("startBtn");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let timerInterval = null;
let animationFrameId = null;

let target = null;
let hitmarkerFrames = 0;

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

function stopGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  setTimeout(() => {
    alert(`Time over! Final score: ${score}`);
  }, 50);
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
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();
}

function drawHitmarker() {
  if (hitmarkerFrames <= 0) return;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 12);
  ctx.lineTo(cx - 4, cy - 4);

  ctx.moveTo(cx + 12, cy - 12);
  ctx.lineTo(cx + 4, cy - 4);

  ctx.moveTo(cx - 12, cy + 12);
  ctx.lineTo(cx - 4, cy + 4);

  ctx.moveTo(cx + 12, cy + 12);
  ctx.lineTo(cx + 4, cy + 4);
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

startBtn.addEventListener("click", () => {
  canvas.classList.remove("hidden");

  resetGame();
  gameRunning = true;

  startTimer();
  render();
});

canvas.addEventListener("click", () => {
  if (!gameRunning || !target) return;

  const shotX = canvas.width / 2;
  const shotY = canvas.height / 2;

  const dx = shotX - (target.x + target.size / 2);
  const dy = shotY - (target.y + target.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= target.size / 2) {
    score++;
    hitmarkerFrames = 8;
    spawnTarget();
  }
});
