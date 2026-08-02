let brainData = [];
let currentMode = 'explorer';
let currentTargetRegion = null;
let score = 0;

async function initApp() {
  try {
    const response = await fetch('./brainData.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    brainData = await response.json();
    setupSVGInteractivity();
  } catch (error) {
    console.error("Error loading brain data:", error);
    document.getElementById('region-function').innerText = 
      "Failed to load brain data. Make sure brainData.json is in the exact same folder.";
  }
}

function setupSVGInteractivity() {
  const regionElements = document.querySelectorAll('.brain-region');
  
  regionElements.forEach(element => {
    const regionId = element.getAttribute('data-id');
    const regionObj = brainData.find(item => item.id === regionId);

    if (!regionObj) return;

    element.addEventListener('click', () => {
      highlightRegion(element);
      if (currentMode === 'explorer') {
        displayRegionDetails(regionObj);
      } else if (currentMode === 'quiz') {
        checkAnswer(regionObj, element);
      }
    });
  });
}

function highlightRegion(targetElement) {
  document.querySelectorAll('.brain-region').forEach(el => el.classList.remove('selected'));
  targetElement.classList.add('selected');
}

function displayRegionDetails(region) {
  document.getElementById('region-name').innerText = region.name;
  document.getElementById('region-lobe').innerText = region.lobe;
  document.getElementById('region-ba').innerText = region.broadmannArea;
  document.getElementById('region-function').innerText = region.function;
  document.getElementById('deficit-title').innerText = region.clinicalDeficit.condition;
  document.getElementById('deficit-desc').innerText = region.clinicalDeficit.symptoms;
}

function toggleMode() {
  const modeBtn = document.getElementById('mode-btn');
  const quizBanner = document.getElementById('quiz-banner');

  if (currentMode === 'explorer') {
    currentMode = 'quiz';
    score = 0;
    document.getElementById('quiz-score').innerText = score;
    if (modeBtn) modeBtn.innerText = 'Switch to Explorer Mode';
    if (quizBanner) quizBanner.style.display = 'block';
    nextQuestion();
  } else {
    currentMode = 'explorer';
    if (modeBtn) modeBtn.innerText = 'Switch to Quiz Mode';
    if (quizBanner) quizBanner.style.display = 'none';
    resetRegionFills();
  }
}

function nextQuestion() {
  resetRegionFills();
  
  const randomIndex = Math.floor(Math.random() * brainData.length);
  currentTargetRegion = brainData[randomIndex];

  const questionType = Math.random() > 0.5 ? 'location' : 'deficit';
  const qTextElement = document.getElementById('quiz-question');

  if (qTextElement) {
    if (questionType === 'location') {
      qTextElement.innerText = `Click on: ${currentTargetRegion.name}`;
    } else {
      qTextElement.innerText = `Which region leads to: "${currentTargetRegion.clinicalDeficit.condition}"?`;
    }
  }
}

function checkAnswer(selectedRegion, element) {
  if (!currentTargetRegion) return;

  if (selectedRegion.id === currentTargetRegion.id) {
    score += 10;
    document.getElementById('quiz-score').innerText = score;
    
    const originalFill = element.getAttribute('fill');
    element.style.fill = '#22c55e'; 
    displayRegionDetails(selectedRegion);

    setTimeout(() => {
      element.style.fill = originalFill || ''; 
      nextQuestion();
    }, 1200);
  } else {
    const originalFill = element.getAttribute('fill');
    element.style.fill = '#ef4444'; 
    
    setTimeout(() => {
      element.style.fill = originalFill || ''; 
    }, 600);
  }
}

function resetRegionFills() {
  document.querySelectorAll('.brain-region').forEach(el => {
    el.classList.remove('selected');
    el.style.fill = '';
  });
}

initApp();
