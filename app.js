let brainData = [];
let currentMode = 'explore'; // 'explore' or 'quiz'
let currentQuestionIndex = 0;
let score = 0;

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

// Fetch Brain Master Data
fetch('brainData.json')
  .then(response => response.json())
  .then(data => {
    brainData = data;
    setupEventListeners();
  })
  .catch(err => console.error("Error loading brainData.json:", err));

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
}

function selectRegion(regionId) {
  document.querySelectorAll('.brain-region').forEach(el => el.classList.remove('selected'));
  
  const element = document.querySelector(`[data-id="${regionId}"]`);
  if (element) element.classList.add('selected');

  const regionInfo = brainData.find(item => item.id === regionId);
  if (regionInfo) {
    document.getElementById('region-name').innerText = regionInfo.name;
    document.getElementById('region-lobe').innerText = regionInfo.lobe;
    document.getElementById('region-ba').innerText = regionInfo.broadmannArea;
    document.getElementById('region-function').innerText = regionInfo.function;
    document.getElementById('deficit-title').innerText = regionInfo.clinicalDeficit.condition;
    document.getElementById('deficit-desc').innerText = regionInfo.clinicalDeficit.symptoms;
  }
}

// Search & Filter Logic
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

// Layer Toggle Filtering
function filterLayer(layerClass, buttonEl) {
  document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
  buttonEl.classList.add('active');

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

// Clinical Mode Switcher
function toggleMode() {
  if (currentMode === 'explore') {
    currentMode = 'quiz';
    score = 0;
    currentQuestionIndex = 0;
    document.getElementById('mode-btn').innerText = "Exit Case Mode";
    document.getElementById('quiz-banner').style.display = "block";
    loadQuestion();
  } else {
    currentMode = 'explore';
    document.getElementById('mode-btn').innerText = "Switch to Clinical Case Mode";
    document.getElementById('quiz-banner').style.display = "none";
  }
}

function loadQuestion() {
  if (currentQuestionIndex < caseQuestions.length) {
    const q = caseQuestions[currentQuestionIndex];
    document.getElementById('quiz-question').innerText = `PATIENT CASE: ${q.case}`;
    document.getElementById('quiz-score').innerText = score;
  } else {
    document.getElementById('quiz-question').innerText = `Case Exam Completed! Final Score: ${score}/${caseQuestions.length}`;
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

// Export Anki Deck (.txt format ready for Anki Import)
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


