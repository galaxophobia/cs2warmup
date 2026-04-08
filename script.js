const startBtn = document.getElementById("startBtn");
const nicknameInput = document.getElementById("nicknameInput");
const currentNick = document.getElementById("currentNick");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreText = document.getElementById("scoreText");
const bestText = document.getElementById("bestText");
const nickText = document.getElementById("nickText");
const challengeStatusText = document.getElementById("challengeStatusText");
const dailyChallengeText = document.getElementById("dailyChallengeText");
const playAgainBtn = document.getElementById("playAgainBtn");
const leaderboardList = document.getElementById("leaderboardList");

const BEST_SCORE_KEY = "cs2warmup-best-score";
const NICKNAME_KEY = "cs2warmup-nickname";
const LEADERBOARD_KEY = "cs2warmup-top-scores";
const DEFAULT_NICKNAME = "Player";
const DAILY_CHALLENGE_TEXT = "Score 25 or more in one run";
const DAILY_CHALLENGE_MIN_SCORE = 25;
const LEADERBOARD_LIMIT = 5;

let score = 0;
let bestScore = 0;
let timeLeft = 60;
let gameRunning = false;
let countdownActive = false;
let countdownValue = "";
let timerInterval = null;
let countdownInterval = null;
let animationFrameId = null;
let playerNickname = DEFAULT_NICKNAME;
let leaderboardEntries = [];

let target = null;
let hitmarkerFrames = 0;
let hitmarkerPosition = null;
let targetHitEffect = null;
let hitPulseEffect = null;
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

function normalizeLeaderboardEntries(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const nickname = sanitizeNickname(entry && entry.nickname ? entry.nickname : DEFAULT_NICKNAME);
      const entryScore = Number(entry && entry.score);

      if (!Number.isFinite(entryScore) || entryScore < 0) return null;

      return {
        nickname,
        score: Math.floor(entryScore)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_LIMIT);
}

function loadLeaderboard() {
  try {
    const rawEntries = localStorage.getItem(LEADERBOARD_KEY);
    if (!rawEntries) {
      leaderboardEntries = [];
      return;
    }

    leaderboardEntries = normalizeLeaderboardEntries(JSON.parse(rawEntries));
  } catch (error) {
    leaderboardEntries = [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboardEntries));
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";

  if (leaderboardEntries.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "leaderboard-empty";
    emptyItem.textContent = "No scores yet. Play your first round!";
    leaderboardList.appendChild(emptyItem);
    return;
  }

  leaderboardEntries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "leaderboard-item";

    const place = document.createElement("span");
    place.className = "leaderboard-place";
    place.textContent = `${index + 1}.`;

    const nick = document.createElement("span");
    nick.className = "leaderboard-nick";
    nick.textContent = entry.nickname;

    const entryScore = document.createElement("span");
    entryScore.className = "leaderboard-score";
    entryScore.textContent = String(entry.score);

    item.appendChild(place);
    item.appendChild(nick);
    item.appendChild(entryScore);
    leaderboardList.appendChild(item);
  });
}

function trySaveLeaderboardScore() {
  const qualifies =
    leaderboardEntries.length < LEADERBOARD_LIMIT ||
    score > leaderboardEntries[leaderboardEntries.length - 1].score;

  if (!qualifies) return;

  leaderboardEntries.push({
    nickname: playerNickname,
    score
  });
  leaderboardEntries = normalizeLeaderboardEntries(leaderboardEntries);
  saveLeaderboard();
  renderLeaderboard();
}

function isDailyChallengeCompleted() {
  return score >= DAILY_CHALLENGE_MIN_SCORE;
}

function updateChallengeStatusUI() {
  const completed = isDailyChallengeCompleted();

  challengeStatusText.textContent = completed
    ? "Challenge completed"
    : "Challenge not completed";
  challengeStatusText.style.color = completed ? "#57f287" : "#ff7b72";
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
  targetHitEffect = null;
  hitPulseEffect = null;
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
  gameRunning = false;

  startCountdown(() => {
    gameRunning = true;
    startTimer();
  });
  startRenderLoop();
}

function stopGame() {
  gameRunning = false;
  countdownActive = false;
  countdownValue = "";
  clearInterval(timerInterval);
  timerInterval = null;
  clearInterval(countdownInterval);
  countdownInterval = null;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }
  trySaveLeaderboardScore();

  scoreText.textContent = `Score: ${score}`;
  bestText.textContent = `Best: ${bestScore}`;
  nickText.textContent = `Nick: ${playerNickname}`;
  updateChallengeStatusUI();
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

function drawTargetHitEffect() {
  if (!targetHitEffect) return;

  const progress = targetHitEffect.frame / targetHitEffect.maxFrames;
  const alpha = (1 - progress) * 0.55;
  const radius = targetHitEffect.radius + progress * 7;

  ctx.fillStyle = `rgba(255, 245, 245, ${alpha})`;
  ctx.beginPath();
  ctx.arc(targetHitEffect.x, targetHitEffect.y, radius, 0, Math.PI * 2);
  ctx.fill();

  targetHitEffect.frame++;
  if (targetHitEffect.frame > targetHitEffect.maxFrames) {
    targetHitEffect = null;
  }
}

function drawHitPulseEffect() {
  if (!hitPulseEffect) return;

  const progress = hitPulseEffect.frame / hitPulseEffect.maxFrames;
  const alpha = (1 - progress) * 0.45;
  const radius = 8 + progress * 20;

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hitPulseEffect.x, hitPulseEffect.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  hitPulseEffect.frame++;
  if (hitPulseEffect.frame > hitPulseEffect.maxFrames) {
    hitPulseEffect = null;
  }
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

function drawCountdown() {
  if (!countdownActive || !countdownValue) return;

  ctx.fillStyle = "rgba(10, 15, 21, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = countdownValue === "GO" ? "#00ff66" : "#ffffff";
  ctx.font = countdownValue === "GO" ? "900 88px Arial" : "900 100px Arial";
  ctx.fillText(countdownValue, canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function startCountdown(onFinish) {
  clearInterval(countdownInterval);

  const steps = ["3", "2", "1", "GO"];
  let stepIndex = 0;

  countdownActive = true;
  countdownValue = steps[stepIndex];

  countdownInterval = setInterval(() => {
    stepIndex++;

    if (stepIndex >= steps.length) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownActive = false;
      countdownValue = "";
      onFinish();
      return;
    }

    countdownValue = steps[stepIndex];
  }, 600);
}

function startRenderLoop() {
  if (!animationFrameId) {
    render();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0a0f15";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawTarget();
  drawTargetHitEffect();
  drawHud();
  drawHitPulseEffect();
  drawCrosshair();
  drawHitmarker();
  drawCountdown();

  if (gameRunning || countdownActive) {
    animationFrameId = requestAnimationFrame(render);
  } else {
    animationFrameId = null;
  }
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

nicknameInput.addEventListener("change", saveNickname);
nicknameInput.addEventListener("blur", saveNickname);

canvas.addEventListener("mousemove", (event) => {
  if (!gameRunning && !countdownActive) return;

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
    const targetCenterX = target.x + target.size / 2;
    const targetCenterY = target.y + target.size / 2;

    score++;
    hitmarkerFrames = 8;
    hitmarkerPosition = { x: shotX, y: shotY };
    targetHitEffect = {
      x: targetCenterX,
      y: targetCenterY,
      radius: target.size / 2,
      frame: 0,
      maxFrames: 8
    };
    hitPulseEffect = {
      x: shotX,
      y: shotY,
      frame: 0,
      maxFrames: 10
    };
    spawnTarget();
  }
});

dailyChallengeText.textContent = DAILY_CHALLENGE_TEXT;
updateChallengeStatusUI();
loadBestScore();
loadNickname();
loadLeaderboard();
renderLeaderboard();
