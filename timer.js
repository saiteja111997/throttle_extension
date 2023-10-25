let timerInterval;
let isTimerRunning = false;
let seconds = 0;

function updateTimerDisplay(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  document.getElementById('timer').textContent = formattedTime;
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
  } else {
    timerInterval = setInterval(() => {
      seconds++;
      updateTimerDisplay(seconds);
    }, 1000);
  }
  isTimerRunning = !isTimerRunning;
  document.getElementById('startStopButton').textContent = isTimerRunning ? 'Stop' : 'Start';
}

document.getElementById('startStopButton').addEventListener('click', toggleTimer);
