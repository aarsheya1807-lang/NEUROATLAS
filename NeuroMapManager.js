import { NeuroMapOverlayManager } from './NeuroMapOverlayManager.js';

// Initialize after loading JSON and Three.js scene
async function initNeuroMap() {
  const response = await fetch('./neuromap_data.json');
  const neuromapData = await response.json();

  // Assuming `scene` is your active Three.js Scene instance
  const overlayManager = new NeuroMapOverlayManager(scene, neuromapData);

  // 1. Populate Symptom Reverse Lookup Select Dropdown
  const symptomSelect = document.getElementById('symptom-select');
  neuromapData.symptoms.forEach(symptom => {
    const opt = document.createElement('option');
    opt.value = symptom.id;
    opt.textContent = `[${symptom.category}] ${symptom.label}`;
    symptomSelect.appendChild(opt);
  });

  // Handle Symptom Selection
  symptomSelect.addEventListener('change', (e) => {
    const symptomId = e.target.value;
    if (!symptomId) {
      overlayManager.resetVisuals();
      return;
    }

    const symptomData = overlayManager.highlightSymptom(symptomId);
    updateClinicalPanel(symptomData);
  });

  // 2. Handle Network Button Toggles
  document.querySelectorAll('.network-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const networkId = e.target.dataset.network;
      const networkData = overlayManager.highlightNetwork(networkId);
      updateNetworkInfoCard(networkData);
    });
  });
}

// Render dynamic info cards in side panel
function updateClinicalPanel(symptom) {
  const panel = document.getElementById('info-panel');
  panel.innerHTML = `
    <div class="card clinical-alert">
      <h3>${symptom.label}</h3>
      <p><strong>Clinical Manifestation:</strong> ${symptom.description}</p>
      <hr/>
      <p><strong>Vascular Territory:</strong> ${symptom.vascularTerritory}</p>
      <p><strong>DSM-5-TR:</strong> ${symptom.dsm5}</p>
      <p><strong>ICD-11:</strong> ${symptom.icd11}</p>
    </div>
  `;
}
