// ==========================================
// STATE & DATA MANAGEMENT
// ==========================================
let brainData = [];
let currentMode = 'explore'; // 'explore' or 'quiz'
let currentQuestionIndex = 0;
let score = 0;
let activeTab = 'explore'; // 'explore', 'diagnostic', or 'flashcards'

// Clinical Case Study Questions for Quiz Mode
const caseQuestions = [
  {
    case: "A 58-year-old patient presents with speech that is fluent and grammatical, but completely devoid of meaning ('word salad'). She cannot comprehend spoken commands. Where is the lesion?",
    targetId: "wernickes-area"
  },
  {
    case: "A 67-year-old man exhibits resting tremors, muscle rigidity, and bradykinesia (slowness of movement). Which subcortical structure system is degenerated?",
    targetId: "basal-ganglia"
  },
  {
    case: "Following a traumatic head injury, a patient exhibits profound changes in personality, impulsivity, poor decision-making, and emotional apathy. Which cortex is damaged?",
    targetId: "prefrontal-cortex"
  },
  {
    case: "A patient complains of severe insomnia, body temperature fluctuations, and disruption in circadian sleep-wake rhythm. Which neuroendocrine gland is impaired?",
    targetId: "pineal-gland"
  },
  {
    case: "An individual cannot form any new declarative episodic memories after surgery, though their short-term memory remains intact. Which structure is damaged?",
    targetId: "hippocampus-limbic"
  },
  {
    case: "A stroke patient exhibits left-sided facial droop, inability to close the left eye, and loss of taste on the anterior two-thirds of the tongue. Which system is affected?",
    targetId: "cranial-nerves-group"
  }
];

// ==========================================
// INITIALIZATION & DATA FETCHING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  fetch('brainData.json')
    .then(response => response.json())
    .then(data => {
      brainData = data;
      setupEventListeners();
      renderTabNavigation();
    })
    .catch(err => console.error("Error loading brainData.json:", err));
});

// ==========================================
// NAVIGATION & TAB SWITCHING ENGINE
// ==========================================
function renderTabNavigation() {
  const navContainer = document.getElementById('tab-nav');
  if (!navContainer) return; // Renders automatically if container exists in index.html

  navContainer.innerHTML = `
    <div style="display: flex; gap: 10px; background: #0f172a; padding: 8px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 20px;">
      <button id="tab-btn-explore" onclick="switchTab('explore')" style="${getTabStyle('explore')}">Brain Explorer & Quiz</button>
      <button id="tab-btn-diagnostic" onclick="switchTab('diagnostic')" style="${getTabStyle('diagnostic')}">Symptom-to-Structure</button>
      <button id="tab-btn-flashcards" onclick="switchTab('flashcards')" style="${getTabStyle('flashcards')}">Flashcards & Anki</button>
    </div>
  `;
}

function getTabStyle(tabId) {
  const isActive = activeTab === tabId;
  return `
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    background: ${isActive ? '#4f46e5' : 'transparent'};
    color: ${isActive ? '#ffffff' : '#94a3b8'};
  `;
}

function switchTab(tabId) {
  activeTab = tabId;
  renderTabNavigation();

  // Hide or show relevant section containers in your index.html
  const exploreSec = document.getElementById('explore-section');
  const diagSec = document.getElementById('diagnostic-section');
  const flashSec = document.getElementById('flashcards-section');

  if (exploreSec) exploreSec.style.display = (tabId === 'explore') ? 'block' : 'none';
  if (diagSec) diagSec.style.display = (tabId === 'diagnostic') ? 'block' : 'none';
  if (flashSec) flashSec.style.display = (tabId === 'flashcards') ? 'block' : 'none';
}

// ==========================================
// CORE BRAIN MAP & INTERACTIVITY LOGIC
// ==========================================
function setupEventListeners() {
  document.querySelectorAll('.brain-region').forEach(element => {
    element.addEventListener('click', (e) => {
      const regionId = e.currentTarget.getAttribute('data-id');
      if (currentMode === 'explore') {
        selectRegion(regionId);
      } else {
        handleQuizAnswer(regionId);
      }
    });
  });

  // Attach search input listener if present
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
}

function selectRegion(regionId) {
  document.querySelectorAll('.brain-region').forEach(el => el.classList.remove('selected'));
  
  const element = document.querySelector(`[data-id="${regionId}"]`);
  if (element) element.classList.add('selected');

  const regionInfo = brainData.find(item => item.id === regionId);
  if (regionInfo) {
    const elName = document.getElementById('region-name');
    const elLobe = document.getElementById('region-lobe');
    const elBa = document.getElementById('region-ba');
    const elFunc = document.getElementById('region-function');
    const elDefTitle = document.getElementById('deficit-title');
    const elDefDesc = document.getElementById('deficit-desc');

    if (elName) elName.innerText = regionInfo.name;
    if (elLobe) elLobe.innerText = regionInfo.lobe;
    if (elBa) elBa.innerText = regionInfo.broadmannArea;
    if (elFunc) elFunc.innerText = regionInfo.function;
    if (elDefTitle) elDefTitle.innerText = regionInfo.clinicalDeficit.condition;
    if (elDefDesc) elDefDesc.innerText = regionInfo.clinicalDeficit.symptoms;
  }
}

// ==========================================
// SEARCH & LAYER FILTERING
// ==========================================
function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  if (!query) {
    document.querySelectorAll('.brain-region').forEach(el => el.classList.remove('dimmed'));
    return;
  }

  brainData.forEach(item => {
    const match = item.name.toLowerCase().includes(query) ||
                  item.function.toLowerCase().includes(query) ||
                  item.broadmannArea.toLowerCase().includes(query) ||
                  item.clinicalDeficit.condition.toLowerCase().includes(query);
    
    const element = document.querySelector(`[data-id="${item.id}"]`);
    if (element) {
      if (match) {
        element.classList.remove('dimmed');
      } else {
        element.classList.add('dimmed');
      }
    }
  });
}

function filterLayer(layerClass, buttonEl) {
  document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');

  document.querySelectorAll('.brain-region').forEach(el => {
    if (layerClass === 'all') {
      el.style.display = 'block';
    } else {
      if (el.classList.contains(`layer-${layerClass}`)) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    }
  });
}

// ==========================================
// CLINICAL CASE / QUIZ MODE LOGIC
// ==========================================
function toggleMode() {
  const modeBtn = document.getElementById('mode-btn');
  const quizBanner = document.getElementById('quiz-banner');

  if (currentMode === 'explore') {
    currentMode = 'quiz';
    score = 0;
    currentQuestionIndex = 0;
    if (modeBtn) modeBtn.innerText = "Exit Case Mode";
    if (quizBanner) quizBanner.style.display = "block";
    loadQuestion();
  } else {
    currentMode = 'explore';
    if (modeBtn) modeBtn.innerText = "Switch to Clinical Case Mode";
    if (quizBanner) quizBanner.style.display = "none";
  }
}

function loadQuestion() {
  const qQuestion = document.getElementById('quiz-question');
  const qScore = document.getElementById('quiz-score');

  if (currentQuestionIndex < caseQuestions.length) {
    const q = caseQuestions[currentQuestionIndex];
    if (qQuestion) qQuestion.innerText = `PATIENT CASE: ${q.case}`;
    if (qScore) qScore.innerText = score;
  } else {
    if (qQuestion) qQuestion.innerText = `Case Exam Completed! Final Score: ${score}/${caseQuestions.length}`;
  }
}

function handleQuizAnswer(selectedId) {
  const targetId = caseQuestions[currentQuestionIndex].targetId;
  if (selectedId === targetId) {
    alert("Correct Diagnosis!");
    score++;
  } else {
    alert(`Incorrect. Target region was: ${caseQuestions[currentQuestionIndex].targetId}`);
  }
  currentQuestionIndex++;
  loadQuestion();
}

// ==========================================
// EXPORT ANKI DECK (.TXT FORMAT)
// ==========================================
function exportAnkiDeck() {
  if (!brainData.length) return alert("Data loading... please try again in a moment.");
  
  let txtContent = "#separator:tab\n#html:true\n#deck:Neuromap Neuroanatomy\n";
  brainData.forEach(item => {
    const front = `<b>Structure / Area:</b> ${item.name} (${item.broadmannArea})`;
    const back = `<b>Lobe:</b> ${item.lobe}<br><b>Function:</b> ${item.function}<br><b>Clinical Deficit:</b> ${item.clinicalDeficit.condition} (${item.clinicalDeficit.symptoms})`;
    txtContent += `${front}\t${back}\n`;
  });

  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Neuromap_Anki_Deck.txt");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
