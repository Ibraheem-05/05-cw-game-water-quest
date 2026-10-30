const DIFFICULTIES = {
  easy: { goal: 15, duration: 40, fireChance: 0.15, spawnInterval: 1800 },
  normal: { goal: 20, duration: 30, fireChance: 0.25, spawnInterval: 1400 },
  hard: { goal: 25, duration: 20, fireChance: 0.35, spawnInterval: 950 }
};

let selectedDifficulty = 'normal';

const WIN_MESSAGES = [
  'Amazing work! You reached the goal!',
  'You did it! Every drop counts!',
  'Incredible collecting. You are a Water Quest champion!'
];
const LOSE_MESSAGES = [
  'Nice try! Play again and see if you can reach {goal}.',
  'So close! Every can counts - give it another try.',
  'Keep going! You can reach the goal next time.'
];

let currentCans = 0;
let timeLeft = DIFFICULTIES.normal.duration;
let currentStreak = 0;
let lastSpawnCell = null;
let gameActive = false;
let spawnInterval;
let timerInterval;
let confettiTimeout;

const grid = document.querySelector('.game-grid');
const scoreDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
const goalDisplay = document.getElementById('goal-cans');
const instructionsDisplay = document.getElementById('game-instructions');
const milestonesDisplay = document.getElementById('milestones');
const difficultySelect = document.getElementById('difficulty');
const messageDisplay = document.getElementById('achievements');
const startButton = document.getElementById('start-game');
const resetButton = document.getElementById('reset-game');
const confettiContainer = document.getElementById('confetti');

function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid.appendChild(cell);
  }
}

createGrid();

function renderMilestones() {
  const goal = DIFFICULTIES[selectedDifficulty].goal;
  const milestones = [Math.ceil(goal / 4), Math.ceil(goal / 2), goal];
  milestonesDisplay.classList.toggle('streak-hot', currentStreak >= 3);
  milestonesDisplay.replaceChildren();

  milestones.forEach((milestone, index) => {
    const marker = document.createElement('span');
    marker.className = 'milestone';
    marker.classList.toggle('completed', currentCans >= milestone);
    marker.textContent = index === 2 ? `${milestone} goal` : `${milestone} cans`;
    milestonesDisplay.appendChild(marker);
  });
}

renderMilestones();

function showCatchFeedback(cell, hitFire) {
  const feedback = document.createElement('span');
  feedback.className = hitFire ? 'catch-feedback loss' : 'catch-feedback gain';
  feedback.textContent = hitFire ? '-1' : '+1';
  feedback.setAttribute('aria-hidden', 'true');
  cell.appendChild(feedback);
  setTimeout(() => feedback.remove(), 700);
}

function spawnWaterCan() {
  if (!gameActive) return;
  const cells = [...grid.querySelectorAll('.grid-cell')];
  cells.forEach(cell => {
    cell.querySelectorAll('.water-can, .fire-hazard').forEach(item => item.remove());
  });
  const availableCells = cells.filter(cell => cell !== lastSpawnCell);
  const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)] || cells[0];
  lastSpawnCell = randomCell;
  const can = document.createElement('button');
  can.type = 'button';
  if (Math.random() < DIFFICULTIES[selectedDifficulty].fireChance) {
    can.className = 'fire-hazard';
    can.setAttribute('aria-label', 'Fire hazard: tap to lose one point');
    can.textContent = '🔥';
  } else {
    const image = document.createElement('img');
    can.className = 'water-can';
    can.setAttribute('aria-label', 'Collect water can for one point');
    image.src = 'img/water-jug.png';
    image.alt = '';
    can.appendChild(image);
  }
  randomCell.appendChild(can);
}

function startGame() {
  if (gameActive) return;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearConfetti();
  gameActive = true;
  const difficulty = DIFFICULTIES[selectedDifficulty];
  currentCans = 0;
  currentStreak = 0;
  timeLeft = difficulty.duration;
  scoreDisplay.textContent = currentCans;
  renderMilestones();
  timerDisplay.textContent = timeLeft;
  timerDisplay.classList.remove('time-warning');
  messageDisplay.textContent = 'Go! Tap the cans to score.';
  grid.classList.add('game-running');
  startButton.disabled = true;
  difficultySelect.disabled = true;
  startButton.textContent = 'Game in progress';
  createGrid();
  spawnWaterCan();
  spawnInterval = setInterval(spawnWaterCan, DIFFICULTIES[selectedDifficulty].spawnInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 10) timerDisplay.classList.add('time-warning');
    if (timeLeft === 0) endGame();
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  grid.classList.remove('game-running');
  grid.querySelectorAll('.water-can, .fire-hazard').forEach(item => item.remove());
  const goal = DIFFICULTIES[selectedDifficulty].goal;
  const messages = currentCans >= goal ? WIN_MESSAGES : LOSE_MESSAGES;
  const gameWon = currentCans >= goal;
  messageDisplay.textContent = messages[Math.floor(Math.random() * messages.length)]
    .replace('{goal}', goal);
  messageDisplay.classList.toggle('game-won', gameWon);
  if (gameWon) celebrateWin();
  startButton.disabled = false;
  difficultySelect.disabled = false;
  startButton.textContent = 'Play Again';
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearConfetti();
  grid.classList.remove('game-running');
  const difficulty = DIFFICULTIES[selectedDifficulty];
  currentCans = 0;
  currentStreak = 0;
  lastSpawnCell = null;
  timeLeft = difficulty.duration;
  scoreDisplay.textContent = currentCans;
  renderMilestones();
  goalDisplay.textContent = difficulty.goal;
  timerDisplay.textContent = timeLeft;
  instructionsDisplay.textContent = `Tap water cans to score and avoid fire. Reach ${difficulty.goal} points in ${difficulty.duration} seconds!`;
  timerDisplay.classList.remove('time-warning');
  messageDisplay.textContent = 'Game reset. Start when you are ready!';
  messageDisplay.classList.remove('game-won');
  grid.querySelectorAll('.water-can, .fire-hazard').forEach(item => item.remove());
  grid.querySelectorAll('.collected, .hit-fire').forEach(cell => {
    cell.classList.remove('collected', 'hit-fire');
  });
  startButton.disabled = false;
  difficultySelect.disabled = false;
  startButton.textContent = 'Start Game';
}

function celebrateWin() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  clearConfetti();
  const colors = ['#ffc907', '#2e9df7', '#4fcb53', '#ff902a', '#f16061', '#8bd1cb'];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 100; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--x', `${Math.random() * 100}%`);
    piece.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
    piece.style.setProperty('--spin', `${Math.random() * 900 - 450}deg`);
    piece.style.setProperty('--duration', `${2 + Math.random() * 2}s`);
    piece.style.setProperty('--delay', `${Math.random() * 0.7}s`);
    piece.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
    fragment.appendChild(piece);
  }
  confettiContainer.appendChild(fragment);
  confettiTimeout = setTimeout(clearConfetti, 5000);
}

function clearConfetti() {
  clearTimeout(confettiTimeout);
  confettiContainer.replaceChildren();
}

grid.addEventListener('click', event => {
  const target = event.target.closest('.water-can, .fire-hazard');
  if (!gameActive || !target) return;

  const hitFire = target.classList.contains('fire-hazard');
  currentCans = hitFire ? Math.max(0, currentCans - 1) : currentCans + 1;
  currentStreak = hitFire ? 0 : currentStreak + 1;
  if (hitFire) milestonesDisplay.classList.remove('streak-hot');
  scoreDisplay.textContent = currentCans;
  renderMilestones();
  milestonesDisplay.classList.toggle('streak-hot', currentStreak >= 3);
  scoreDisplay.classList.remove('score-pop');
  requestAnimationFrame(() => scoreDisplay.classList.add('score-pop'));
  const cell = target.closest('.grid-cell');
  cell.classList.add(hitFire ? 'hit-fire' : 'collected');
  spawnWaterCan();
  showCatchFeedback(cell, hitFire);
  messageDisplay.textContent = hitFire
    ? 'Fire! You lost one point. Watch out!'
    : currentStreak >= 3
      ? `${currentStreak} catch streak! Keep going!`
      : 'Nice catch! +1 point.';
  setTimeout(() => {
    cell.classList.remove('collected', 'hit-fire');
  }, 250);
});

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
difficultySelect.addEventListener('change', () => {
  if (gameActive) return;
  selectedDifficulty = difficultySelect.value;
  resetGame();
  messageDisplay.textContent = `${difficultySelect.options[difficultySelect.selectedIndex].text} mode selected.`;
});
