// ==========================================
// STATE & DATA MANAGEMENT
// ==========================================
let brainData = [];
let currentMode = 'explore'; // 'explore' or 'quiz'
let activeTab = 'explore'; 
let isOcclusionMode = false;
let currentFlashcardIndex = 0;

// DSM-5 Quiz Engine Questions
const dsmCases = [
  {
    title: "Case #201: Progressive Personality & Behavioral Change",
    description: "A 54-year-old patient exhibits socially inappropriate behavior, profound apathy, loss of empathy, and sudden hyperorality (obsessive food preference changes). Brain MRI shows anterior lobar atrophy. What is the diagnosis and primary structure involved?",
    options: [
      { text: "Behavioral Variant Frontotemporal Neurocognitive Disorder — Orbitofrontal Cortex", correct: true },
      { text: "Alzheimer's Neurocognitive Disorder — Hippocampus", correct: false },
      { text: "Major Depressive Disorder — Dorsolateral Prefrontal Cortex", correct: false }
    ],
    explanation: "Early behavioral disinhibition and loss of empathy are cardinal DSM-5 criteria for Behavioral Variant Frontotemporal Neurocognitive Disorder, mapping to the Orbitofrontal Cortex."
  },
  {
    title: "Case #202: Visual Object Agnosia & Prosopagnosia",
    description: "Following a stroke, a patient can describe facial features (e.g., 'eyes, nose, mouth') but cannot recognize her daughter's face visually. Basic visual acuity is 20/20. Where is the lesion and pathway?",
    options: [
      { text: "Primary Visual Cortex (V1) — Calcarine Sulcus", correct: false },
      { text: "Ventral Temporal Stream ('What' Pathway) — Fusiform Gyrus", correct: true },
      { text: "Dorsal Motion Area — MT / V5", correct: false }
    ],
    explanation: "The Ventral Temporal Visual Stream processes visual identity (objects, faces). Lesions cause prosopagnosia under DSM-5 visual perception deficits."
  }
];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  fetch('brainData.json')
    .then(res => res.json())
    .then(data => {
      brainData = data;
      setupEventListeners();
      renderTabNavigation();
      renderMicroanatomyExplorer();
      initThreeJsEngine();
      loadDsmCase(0);
    })
    .catch(err => console.error("Error loading brainData.json:", err));
});

// ==========================================
// NAVIGATION ENGINE
// ==========================================
function renderTabNavigation() {
  const navContainer = document.getElementById('tab-nav');
  if (!navContainer) return;

  navContainer.innerHTML = `
    <div style="display: flex; gap: 8px;">
      <button class="tab-btn ${activeTab==='explore'?'active':''}" onclick="switchTab('explore')">Brain Explorer & SVG</button>
      <button class="tab-btn ${activeTab==='diagnostic'?'active':''}" onclick="switchTab('diagnostic')">DSM-5 Diagnostic Simulator</button>
      <button class="tab-btn ${activeTab==='flashcards'?'active':''}" onclick="switchTab('flashcards')">Flashcards & Spaced Repetition</button>
    </div>
  `;
}

function switchTab(tabId) {
  activeTab = tabId;
  renderTabNavigation();

  document.getElementById('explore-section').style.display = (tabId === 'explore') ? 'block' : 'none';
  document.getElementById('diagnostic-section').style.display = (tabId === 'diagnostic') ? 'block' : 'none';
  document.getElementById('flashcards-section').style.display = (tabId === 'flashcards') ? 'block' : 'none';
}

// ==========================================
// CORE MAP INTERACTIVITY & DSM-5 RENDERING
// ==========================================
function setupEventListeners() {
  document.querySelectorAll('.brain-region').forEach(element => {
    element.addEventListener('click', (e) => {
      const regionId = e.currentTarget.getAttribute('data-id');
      selectRegion(regionId);
    });
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.addEventListener('input', handleSearch);
}

function selectRegion(regionId) {
  document.querySelectorAll('.brain-region').forEach(el => el.classList.remove('selected'));
  const element = document.querySelector(`[data-id="${regionId}"]`);
  if (element) element.classList.add('selected');

  const info = brainData.find(item => item.id === regionId);
  if (info) {
    document.getElementById('region-name').innerText = info.name;
    document.getElementById('region-lobe').innerText = info.lobe;
    document.getElementById('region-ba').innerText = info.broadmannArea;
    document.getElementById('region-function').innerText = info.function;
    document.getElementById('deficit-title').innerText = info.clinicalDeficit.condition;
    document.getElementById('deficit-desc').innerText = info.clinicalDeficit.symptoms;

    // DSM-5 Mapping
    if (info.dsm5Mapping) {
      document.getElementById('dsm-disorders').innerText = info.dsm5Mapping.disorders.join(", ");
      document.getElementById('dsm-criteria').innerText = info.dsm5Mapping.criteria;
    }

    // PubMed / DOI Link
    if (info.doiLink) {
      document.getElementById('research-link').innerHTML = `<a href="${info.doiLink}" target="_blank" style="color: #6366f1;">Read Seminal Research Paper (DOI) →</a>`;
    }
  }
}

// Search Filter supporting DSM-5 text
function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  brainData.forEach(item => {
    const match = item.name.toLowerCase().includes(query) ||
                  item.function.toLowerCase().includes(query) ||
                  item.clinicalDeficit.condition.toLowerCase().includes(query) ||
                  (item.dsm5Mapping && item.dsm5Mapping.disorders.some(d => d.toLowerCase().includes(query)));
    
    const element = document.querySelector(`[data-id="${item.id}"]`);
    if (element) {
      if (match || !query) element.classList.remove('dimmed');
      else element.classList.add('dimmed');
    }
  });
}

// ==========================================
// NETWORK OVERLAYS & OCCLUSION
// ==========================================
function toggleNetworkOverlay(networkName, isChecked) {
  brainData.forEach(item => {
    if (item.network === networkName) {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (el) {
        el.style.fill = isChecked ? '#f59e0b' : '#334155';
      }
    }
  });
}

function toggleOcclusionMode() {
  isOcclusionMode = !isOcclusionMode;
  alert(isOcclusionMode ? "Image Occlusion Mode ENABLED: Region names are now hidden for self-testing." : "Image Occlusion Mode DISABLED.");
  document.getElementById('region-name').style.filter = isOcclusionMode ? 'blur(8px)' : 'none';
}

// ==========================================
// DSM-5 DIAGNOSTIC SIMULATOR ENGINE
// ==========================================
function loadDsmCase(index) {
  const q = dsmCases[index];
  if (!q) return;

  document.getElementById('dsm-case-title').innerText = q.title;
  document.getElementById('dsm-case-desc').innerText = q.description;
  
  const optionsContainer = document.getElementById('dsm-options');
  optionsContainer.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.style.cssText = "padding: 12px; background: #1e293b; color: white; border: 1px solid #334155; text-align: left; border-radius: 6px; cursor: pointer;";
    btn.innerText = opt.text;
    btn.onclick = () => {
      if (opt.correct) {
        alert("CORRECT DIAGNOSIS!\n\n" + q.explanation);
      } else {
        alert("INCORRECT. Review the DSM-5 criteria and neural circuitry.");
      }
    };
    optionsContainer.appendChild(btn);
  });
}

// ==========================================
// SPACED REPETITION FLASHCARDS & ANKI
// ==========================================
function revealCard() {
  if (!brainData.length) return;
  const card = brainData[currentFlashcardIndex];
  document.getElementById('fc-front').innerText = `${card.name} (${card.broadmannArea})`;
  document.getElementById('fc-back').innerHTML = `<strong>Function:</strong> ${card.function}<br><br><strong>Clinical Deficit:</strong> ${card.clinicalDeficit.condition}`;
  document.getElementById('fc-back').style.display = 'block';
  document.getElementById('fc-rating-btns').style.display = 'flex';
}

function rateCard(rating) {
  if (rating === 'hard') {
    // Save to LocalStorage for repetition
    let hardCards = JSON.parse(localStorage.getItem('neuromap_hard') || '[]');
    hardCards.push(brainData[currentFlashcardIndex].id);
    localStorage.setItem('neuromap_hard', JSON.stringify(hardCards));
  }
  currentFlashcardIndex = (currentFlashcardIndex + 1) % brainData.length;
  document.getElementById('fc-back').style.display = 'none';
  document.getElementById('fc-rating-btns').style.display = 'none';
  document.getElementById('fc-front').innerText = `Next Card Ready. Click Reveal.`;
}

function exportAnkiDeck() {
  if (!brainData.length) return alert("Data loading...");
  let txtContent = "#separator:tab\n#html:true\n#deck:Neuromap Neuroanatomy DSM5\n";
  brainData.forEach(item => {
    const front = `<b>Structure:</b> ${item.name} (${item.broadmannArea})`;
    const back = `<b>Function:</b> ${item.function}<br><b>Deficit:</b> ${item.clinicalDeficit.condition}<br><b>DSM-5:</b> ${item.dsm5Mapping ? item.dsm5Mapping.disorders.join(', ') : 'N/A'}`;
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

// ==========================================
// 3D CANVAS ENGINE & MICROANATOMY
// ==========================================
function switchViewMode(mode) {
  document.getElementById('view-2d').style.display = (mode === '2d') ? 'block' : 'none';
  document.getElementById('view-3d').style.display = (mode === '3d') ? 'block' : 'none';
  document.getElementById('btn-view-2d').classList.toggle('active', mode === '2d');
  document.getElementById('btn-view-3d').classList.toggle('active', mode === '3d');
}

function initThreeJsEngine() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Lightweight 3D Canvas Rendering Fallback Engine
  let angle = 0;
  function render3DPose() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(150 + Math.cos(angle) * 40, 100 + Math.sin(angle) * 20, 30, 0, Math.PI * 2);
    ctx.fill();
    angle += 0.03;
    requestAnimationFrame(render3DPose);
  }
  render3DPose();
}

function renderMicroanatomyExplorer() {
  const container = document.getElementById('microanatomy-container');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="margin-top: 20px;">
      <h3 style="color: var(--accent);">Microanatomy & Functional Cellular Zones</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
        <div style="background: #020617; padding: 15px; border-radius: 6px;">
          <h4 style="color: #38bdf8; margin: 0 0 10px 0;">Input Zone</h4>
          <p style="font-size: 0.85rem; color: var(--text-sub);">Dendrites & Spines. Receives synaptic contacts. Smooth dendrites indicate inhibitory cells.</p>
        </div>
        <div style="background: #020617; padding: 15px; border-radius: 6px;">
          <h4 style="color: #38bdf8; margin: 0 0 10px 0;">Conducting Zone</h4>
          <p style="font-size: 0.85rem; color: var(--text-sub);">Axons. Generates and regenerates action potentials toward synaptic terminals.</p>
        </div>
        <div style="background: #020617; padding: 15px; border-radius: 6px;">
          <h4 style="color: #38bdf8; margin: 0 0 10px 0;">Output Zone</h4>
          <p style="font-size: 0.85rem; color: var(--text-sub);">Synaptic Boutons / Terminals. Releases chemical neurotransmitters across clefts.</p>
        </div>
      </div>
    </div>
  `;
}
