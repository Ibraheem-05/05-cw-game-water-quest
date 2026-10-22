const GOAL_CANS = 20;
const GAME_DURATION = 30;
const FIRE_CHANCE = 0.25;
const SPAWN_INTERVAL_MS = 1400;
const WIN_MESSAGES = [
  'Amazing work! You reached the goal!',
  'You did it! Every drop counts!',
  'Incredible collecting. You are a Water Quest champion!'
];
const LOSE_MESSAGES = [
  'Nice try! Play again and see if you can reach 20.',
  'So close! Every can counts - give it another try.',
  'Keep going! You can reach the goal next time.'
];

let currentCans = 0;
let timeLeft = GAME_DURATION;
let gameActive = false;
let spawnInterval;
let timerInterval;
let confettiTimeout;

const grid = document.querySelector('.game-grid');
const scoreDisplay = document.getElementById('current-cans');
const timerDisplay = document.getElementById('timer');
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

function spawnWaterCan() {
  if (!gameActive) return;
  const cells = grid.querySelectorAll('.grid-cell');
  cells.forEach(cell => {
    cell.replaceChildren();
  });
  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const can = document.createElement('button');
  can.type = 'button';
  if (Math.random() < FIRE_CHANCE) {
    can.className = 'fire-hazard';
    can.setAttribute('aria-label', 'Fire hazard: tap to lose one point');
    can.textContent = '🔥';
  } else {
    const image = document.createElement('img');
    can.className = 'water-can';
    can.setAttribute('aria-label', 'Collect water can for one point');
    image.src = 'img/water-can.png';
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
  currentCans = 0;
  timeLeft = GAME_DURATION;
  scoreDisplay.textContent = currentCans;
  timerDisplay.textContent = timeLeft;
  timerDisplay.classList.remove('time-warning');
  messageDisplay.textContent = 'Go! Tap the cans to score.';
  startButton.disabled = true;
  startButton.textContent = 'Game in progress';
  createGrid();
  spawnWaterCan();
  spawnInterval = setInterval(spawnWaterCan, SPAWN_INTERVAL_MS);
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
  grid.querySelectorAll('.water-can, .fire-hazard').forEach(item => item.remove());
  const messages = currentCans >= GOAL_CANS ? WIN_MESSAGES : LOSE_MESSAGES;
  const gameWon = currentCans >= GOAL_CANS;
  messageDisplay.textContent = messages[Math.floor(Math.random() * messages.length)];
  messageDisplay.classList.toggle('game-won', gameWon);
  if (gameWon) celebrateWin();
  startButton.disabled = false;
  startButton.textContent = 'Play Again';
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearConfetti();
  currentCans = 0;
  timeLeft = GAME_DURATION;
  scoreDisplay.textContent = currentCans;
  timerDisplay.textContent = timeLeft;
  timerDisplay.classList.remove('time-warning');
  messageDisplay.textContent = 'Game reset. Start when you are ready!';
  messageDisplay.classList.remove('game-won');
  grid.querySelectorAll('.water-can, .fire-hazard').forEach(item => item.remove());
  grid.querySelectorAll('.collected, .hit-fire').forEach(cell => {
    cell.classList.remove('collected', 'hit-fire');
  });
  startButton.disabled = false;
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
  scoreDisplay.textContent = currentCans;
  scoreDisplay.classList.remove('score-pop');
  requestAnimationFrame(() => scoreDisplay.classList.add('score-pop'));
  const cell = target.closest('.grid-cell');
  cell.classList.add(hitFire ? 'hit-fire' : 'collected');
  messageDisplay.textContent = hitFire
    ? 'Fire! You lost one point. Watch out!'
    : 'Nice catch! +1 point.';
  setTimeout(() => {
    cell.classList.remove('collected', 'hit-fire');
  }, 250);
  spawnWaterCan();
});

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
