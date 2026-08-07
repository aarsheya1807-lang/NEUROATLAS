/**
 * enhancements.js
 * ------------------------------------------------------------
 * Four features, all reading from enhancementsData.json and
 * hooking into your real Three.js scene via window.NeuromapCore
 * (exposed by a small addition at the end of app.js — see
 * INTEGRATION_ENHANCEMENTS.md).
 *
 *  1. Vascular territory + stroke simulator
 *  2. Virtual lesion tool
 *  3. Functional network highlighter (DMN / Salience / CEN)
 *  4. Clinical vignette quiz (USMLE-style)
 *
 * Waits for the 'neuromap:ready' event dispatched by app.js
 * once the scene/meshes exist, so load order doesn't matter.
 * ------------------------------------------------------------
 */

(function () {
  "use strict";

  let core = null;       // window.NeuromapCore
  let data = null;       // enhancementsData.json
  let activeMode = null; // 'vascular' | 'lesion' | 'network' | 'vignette' | null
  let lesionedRegion = null;
  let originalHighlightSnapshot = new Map(); // regionId -> {color, opacity}

  const DATA_URL = "enhancementsData.json";

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadData() {
    if (data) return data;
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("enhancements.js: could not load data", err);
      data = { vascular: {}, networks: {}, vignettes: [] };
    }
    return data;
  }

  /* ---------------------------------------------------------------------
     Shared: color regions directly via core.meshesById, bypassing the
     app's own highlight() (which is single-region-only) so we can color
     multiple regions at once for vascular/network views.
     --------------------------------------------------------------------- */
  function snapshotAndColor(regionIds, hexColor, opacity) {
    const three = window.THREE;
    regionIds.forEach((id) => {
      const mesh = core.meshesById[id];
      if (!mesh) return;
      if (!originalHighlightSnapshot.has(id)) {
        originalHighlightSnapshot.set(id, {
          color: mesh.userData.baseColor.clone(),
          opacity: mesh.userData.baseOpacity,
        });
      }
      mesh.material.color.set(hexColor);
      mesh.material.opacity = opacity;
      mesh.userData.wire.material.color.set(hexColor);
    });
  }

  function restoreAllSnapshots() {
    originalHighlightSnapshot.forEach((snap, id) => {
      const mesh = core.meshesById[id];
      if (!mesh) return;
      mesh.material.color.copy(snap.color);
      mesh.material.opacity = snap.opacity;
      mesh.userData.wire.material.color.copy(snap.color);
    });
    originalHighlightSnapshot.clear();
  }

  function exitAllModes() {
    restoreAllSnapshots();
    lesionedRegion = null;
    activeMode = null;
    document.querySelectorAll(".enh-tool-btn").forEach((b) => b.classList.remove("on"));
    hidePanel();
  }

  /* ---------------------------------------------------------------------
     Shared side panel (reused by all 4 tools, one at a time)
     --------------------------------------------------------------------- */
  function ensurePanel() {
    let panel = document.getElementById("enh-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "enh-panel";
    panel.className = "enh-panel enh-hidden";
    panel.innerHTML = `
      <div class="enh-header">
        <span class="enh-title" id="enh-title">—</span>
        <button class="enh-close" aria-label="Close">&times;</button>
      </div>
      <div class="enh-body" id="enh-body"></div>
    `;
    document.body.appendChild(panel);
    panel.querySelector(".enh-close").addEventListener("click", exitAllModes);
    return panel;
  }

  function showPanel(title, bodyHTML) {
    const panel = ensurePanel();
    document.getElementById("enh-title").textContent = title;
    document.getElementById("enh-body").innerHTML = bodyHTML;
    panel.classList.remove("enh-hidden");
  }

  function hidePanel() {
    const panel = document.getElementById("enh-panel");
    if (panel) panel.classList.add("enh-hidden");
  }

  /* ---------------------------------------------------------------------
     1) VASCULAR TERRITORY + STROKE SIMULATOR
     --------------------------------------------------------------------- */
  function openVascularMode() {
    exitAllModes();
    activeMode = "vascular";
    document.getElementById("btn-vascular").classList.add("on");

    const items = Object.entries(data.vascular)
      .map(
        ([key, art]) => `
        <button class="enh-list-item" data-artery="${key}" style="border-left:3px solid ${art.color}">
          ${escapeHTML(art.name)}
        </button>`
      )
      .join("");

    showPanel(
      "Vascular Territory Simulator",
      `<p class="enh-hint">Click an artery to highlight its territory and see occlusion syndromes.</p>
       <div class="enh-list">${items}</div>
       <div id="enh-vascular-detail"></div>`
    );

    document.querySelectorAll("#enh-body .enh-list-item").forEach((btn) => {
      btn.addEventListener("click", () => selectArtery(btn.dataset.artery));
    });
  }

  function selectArtery(key) {
    const art = data.vascular[key];
    if (!art) return;
    restoreAllSnapshots();
    snapshotAndColor(art.territory, art.color, 0.65);

    const syndromeItems = art.syndromes
      .map(
        (s) => `<div class="enh-syndrome"><strong>${escapeHTML(s.occlusion)}</strong><p>${escapeHTML(s.presentation)}</p></div>`
      )
      .join("");

    document.getElementById("enh-vascular-detail").innerHTML = `
      <p class="enh-sublabel">Expected clinical syndromes</p>
      ${syndromeItems}
      <p class="enh-caveat">⚠ ${escapeHTML(art.caveat)}</p>
    `;
  }

  /* ---------------------------------------------------------------------
     2) VIRTUAL LESION TOOL
     --------------------------------------------------------------------- */
  function openLesionMode() {
    exitAllModes();
    activeMode = "lesion";
    document.getElementById("btn-lesion").classList.add("on");
    showPanel(
      "Virtual Lesion Tool",
      `<p class="enh-hint">Click any brain region in the 3D view to place a virtual lesion and see its deficit profile.</p>
       <div id="enh-lesion-detail"><p class="enh-empty">No lesion placed yet.</p></div>`
    );
  }

  function placeLesion(regionId) {
    if (activeMode !== "lesion") return;
    restoreAllSnapshots();
    lesionedRegion = regionId;
    snapshotAndColor([regionId], "#d9607a", 0.85);

    const region = core.regionsById[regionId];
    const clinicalData = window.ClinicalPanel ? null : null; // reserved for future cross-link
    document.getElementById("enh-lesion-detail").innerHTML = `
      <p class="enh-sublabel">Lesioned structure</p>
      <p><strong>${escapeHTML(region.name)}</strong></p>
      <p class="enh-sublabel">Expected deficit (from atlas data)</p>
      <p>${escapeHTML(region.clinical)}</p>
      <p class="enh-caveat">⚠ Real lesions rarely respect clean anatomical boundaries — this shows the classic textbook deficit for full structural loss, not partial/graded damage.</p>
    `;
  }

  /* ---------------------------------------------------------------------
     3) FUNCTIONAL NETWORK HIGHLIGHTER
     --------------------------------------------------------------------- */
  function openNetworkMode() {
    exitAllModes();
    activeMode = "network";
    document.getElementById("btn-network").classList.add("on");

    const items = Object.entries(data.networks)
      .map(
        ([key, net]) => `
        <button class="enh-list-item" data-network="${key}" style="border-left:3px solid ${net.color}">
          ${escapeHTML(net.name)}
        </button>`
      )
      .join("");

    showPanel(
      "Functional Network Explorer",
      `<p class="enh-hint">Click a network to highlight its member regions.</p>
       <div class="enh-list">${items}</div>
       <div id="enh-network-detail"></div>`
    );

    document.querySelectorAll("#enh-body .enh-list-item").forEach((btn) => {
      btn.addEventListener("click", () => selectNetwork(btn.dataset.network));
    });
  }

  function selectNetwork(key) {
    const net = data.networks[key];
    if (!net) return;
    restoreAllSnapshots();
    snapshotAndColor(net.members, net.color, 0.7);

    document.getElementById("enh-network-detail").innerHTML = `
      <p class="enh-sublabel">Function</p>
      <p>${escapeHTML(net.description)}</p>
      <p class="enh-sublabel">Clinical relevance</p>
      <p>${escapeHTML(net.clinical_note)}</p>
      <p class="enh-caveat">⚠ ${escapeHTML(net.caveat)}</p>
    `;
  }

  /* ---------------------------------------------------------------------
     4) CLINICAL VIGNETTE QUIZ
     --------------------------------------------------------------------- */
  let vignettePool = [];
  let vignetteCurrent = null;
  let vignetteScore = { correct: 0, total: 0 };

  function openVignetteMode() {
    exitAllModes();
    activeMode = "vignette";
    document.getElementById("btn-vignette").classList.add("on");
    vignettePool = [...data.vignettes];
    vignetteScore = { correct: 0, total: 0 };
    nextVignette();
  }

  function nextVignette() {
    if (vignettePool.length === 0) vignettePool = [...data.vignettes];
    const idx = Math.floor(Math.random() * vignettePool.length);
    vignetteCurrent = vignettePool.splice(idx, 1)[0];
    renderVignette();
  }

  function renderVignette() {
    showPanel(
      "Clinical Vignette Quiz",
      `<p class="enh-score">${vignetteScore.correct} / ${vignetteScore.total} correct</p>
       <p class="enh-vignette-text">${escapeHTML(vignetteCurrent.text)}</p>
       <p class="enh-hint">Click the brain structure most likely damaged, based on this presentation.</p>
       <div id="enh-vignette-feedback"></div>`
    );
  }

  function answerVignette(regionId) {
    if (activeMode !== "vignette" || !vignetteCurrent) return;
    vignetteScore.total++;
    const correct = regionId === vignetteCurrent.correctRegion;
    if (correct) vignetteScore.correct++;

    restoreAllSnapshots();
    snapshotAndColor([vignetteCurrent.correctRegion], correct ? "#47e0b0" : "#d9607a", 0.85);
    if (!correct && core.meshesById[regionId]) {
      snapshotAndColor([regionId], "#e8a23d", 0.6);
    }

    document.getElementById("enh-vignette-feedback").innerHTML = `
      <p class="enh-feedback ${correct ? "enh-correct" : "enh-wrong"}">
        ${correct ? "✓ Correct" : "✗ Not quite"} — answer: ${escapeHTML(core.regionsById[vignetteCurrent.correctRegion].name)}
      </p>
      <p>${escapeHTML(vignetteCurrent.explanation)}</p>
      <button class="enh-next-btn" id="enh-next-vignette">Next case →</button>
    `;
    document.getElementById("enh-next-vignette").addEventListener("click", nextVignette);
  }

  /* ---------------------------------------------------------------------
     WIRE INTO THE REAL SCENE
     Adds one extra click handler on the same canvas your app.js already
     uses, active only while a tool mode is on — doesn't interfere with
     normal region selection/info-panel behavior when no tool is active.
     --------------------------------------------------------------------- */
  function wireCanvasInteraction() {
    core.renderer.domElement.addEventListener("click", () => {
      if (!activeMode) return; // let app.js's own click handler run normally

      // core.pickRegion() is app.js's own raycast function, exported as-is —
      // it already uses the pointer position kept current by app.js's
      // existing pointermove listener, so this stays in sync automatically.
      const obj = core.pickRegion();
      const regionId = obj ? obj.userData.regionId : null;
      if (!regionId) return;

      if (activeMode === "lesion") placeLesion(regionId);
      if (activeMode === "vignette") answerVignette(regionId);
    });
  }

  /* ---------------------------------------------------------------------
     5) BRAIN-BEHAVIOR MAP (memory / language / problem-solving)
     --------------------------------------------------------------------- */
  function openBrainBehaviorMode() {
    exitAllModes();
    activeMode = "behavior";
    document.getElementById("btn-behavior").classList.add("on");

    const items = Object.entries(data.brainBehaviorLinks)
      .map(
        ([key, domain]) => `
        <button class="enh-list-item" data-domain="${key}" style="border-left:3px solid ${domain.color}">
          ${escapeHTML(domain.label)}
        </button>`
      )
      .join("");

    showPanel(
      "Brain-Behavior Links",
      `<p class="enh-hint">Click a cognitive domain to see which regions support it and why.</p>
       <div class="enh-list">${items}</div>
       <div id="enh-behavior-detail"></div>`
    );

    document.querySelectorAll("#enh-body .enh-list-item").forEach((btn) => {
      btn.addEventListener("click", () => selectBehaviorDomain(btn.dataset.domain));
    });
  }

  function selectBehaviorDomain(key) {
    const domain = data.brainBehaviorLinks[key];
    if (!domain) return;
    restoreAllSnapshots();
    snapshotAndColor(domain.regions, domain.color, 0.7);

    const regionNames = domain.regions
      .map((id) => core.regionsById[id]?.name)
      .filter(Boolean)
      .join(", ");

    document.getElementById("enh-behavior-detail").innerHTML = `
      <p class="enh-sublabel">Regions involved</p>
      <p>${escapeHTML(regionNames)}</p>
      <p class="enh-sublabel">How they work together</p>
      <p>${escapeHTML(domain.summary)}</p>
    `;
  }

  /* ---------------------------------------------------------------------
     6) NERVOUS SYSTEM OVERVIEW (static reference — CNS/PNS/SNS/ANS)
     --------------------------------------------------------------------- */
  function openNervousSystemOverview() {
    exitAllModes();
    activeMode = "nsoverview";
    document.getElementById("btn-nsoverview").classList.add("on");

    const ns = data.nervousSystemOverview;
    const sections = ns.sections
      .map(
        (s) => `
        <div class="enh-syndrome">
          <strong>${escapeHTML(s.title)}</strong>
          <p>${escapeHTML(s.body)}</p>
        </div>`
      )
      .join("");

    showPanel(
      "Nervous System Overview",
      `${sections}
       <p class="enh-caveat">⚠ ${escapeHTML(ns.caveat)}</p>`
    );
  }

  /* ---------------------------------------------------------------------
     TOOLBAR
     --------------------------------------------------------------------- */
  function buildToolbar() {
    if (document.getElementById("enh-toolbar")) return;
    const bar = document.createElement("div");
    bar.id = "enh-toolbar";
    bar.className = "enh-toolbar";
    bar.innerHTML = `
      <button class="enh-tool-btn" id="btn-vascular">🩸 Vascular</button>
      <button class="enh-tool-btn" id="btn-lesion">⚡ Lesion Tool</button>
      <button class="enh-tool-btn" id="btn-network">🕸 Networks</button>
      <button class="enh-tool-btn" id="btn-vignette">📋 Case Quiz</button>
      <button class="enh-tool-btn" id="btn-behavior">🧭 Brain-Behavior Map</button>
      <button class="enh-tool-btn" id="btn-nsoverview">🫀 CNS/PNS Overview</button>
    `;
    document.getElementById("viewport").appendChild(bar);

    document.getElementById("btn-vascular").addEventListener("click", () => {
      activeMode === "vascular" ? exitAllModes() : openVascularMode();
    });
    document.getElementById("btn-lesion").addEventListener("click", () => {
      activeMode === "lesion" ? exitAllModes() : openLesionMode();
    });
    document.getElementById("btn-network").addEventListener("click", () => {
      activeMode === "network" ? exitAllModes() : openNetworkMode();
    });
    document.getElementById("btn-vignette").addEventListener("click", () => {
      activeMode === "vignette" ? exitAllModes() : openVignetteMode();
    });
    document.getElementById("btn-behavior").addEventListener("click", () => {
      activeMode === "behavior" ? exitAllModes() : openBrainBehaviorMode();
    });
    document.getElementById("btn-nsoverview").addEventListener("click", () => {
      activeMode === "nsoverview" ? exitAllModes() : openNervousSystemOverview();
    });
  }

  /* ---------------------------------------------------------------------
     INIT
     --------------------------------------------------------------------- */
  window.addEventListener("neuromap:ready", async () => {
    core = window.NeuromapCore;
    await loadData();
    buildToolbar();
    wireCanvasInteraction();
  });
})();
