/* ==========================================================================
   NEUROMAP — Application Logic
   Loads region/connection data from brainData.json, then builds the
   Three.js scene, sidebar, search, info panel, and quiz mode.
   Sections: 0) Data load  1) Scene setup  2) Region meshes  3) Connections
             4) Raycasting/selection  5) Sidebar + search  6) Quiz mode
   ========================================================================== */

(async function () {
  "use strict";

  /* ---------------------------------------------------------------------
     0) DATA LOAD
     --------------------------------------------------------------------- */
  let REGION_CATEGORIES, REGIONS, CONNECTIONS;
  try {
    const res = await fetch("brainData.json");
    if (!res.ok) throw new Error(`brainData.json request failed: ${res.status}`);
    const data = await res.json();
    REGION_CATEGORIES = data.categories;
    REGIONS = data.regions;
    CONNECTIONS = data.connections;
  } catch (err) {
    console.error("Neuromap: failed to load brainData.json —", err);
    document.getElementById("canvas-host").innerHTML =
      '<p style="color:#e8a23d;font-family:monospace;padding:24px;">Could not load brainData.json. Check the browser console for details.</p>';
    return; // stop here — nothing below can run without data
  }

  const host = document.getElementById("canvas-host");
  const regionsById = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const meshesById = {};

  /* ---------------------------------------------------------------------
     1) SCENE SETUP
     --------------------------------------------------------------------- */
  if (typeof THREE === "undefined") {
    console.error("Neuromap: THREE is not defined — the Three.js CDN script did not load.");
    host.innerHTML =
      '<p style="color:#e8a23d;font-family:monospace;padding:24px;">3D library failed to load. Check your internet connection / ad blocker and reload.</p>';
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0d12);
  scene.fog = new THREE.FogExp2(0x0a0d12, 0.18);

  const camera = new THREE.PerspectiveCamera(
    42,
    host.clientWidth / host.clientHeight,
    0.1,
    100
  );
  const DEFAULT_CAM_POS = new THREE.Vector3(2.6, 1.4, 3.2);
  camera.position.copy(DEFAULT_CAM_POS);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 7;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x2a3140, 1.6));
  const key = new THREE.DirectionalLight(0x9fb4ff, 1.1);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x47e0b0, 0.5);
  rim.position.set(-3, -2, -3);
  scene.add(rim);

  // subtle starfield / particle atmosphere behind the brain
  (function addAtmosphere() {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x2a3140,
      size: 0.02,
      transparent: true,
      opacity: 0.7,
    });
    scene.add(new THREE.Points(geo, mat));
  })();

  /* ---------------------------------------------------------------------
     2) REGION MESHES
     Each region is a translucent "glass" ellipsoid + a wireframe shell,
     grouped so the whole brain rotates as one rigid body via `brainGroup`.
     --------------------------------------------------------------------- */
  const brainGroup = new THREE.Group();
  scene.add(brainGroup);

  const baseSphereGeo = new THREE.SphereGeometry(1, 24, 18);

  REGIONS.forEach((region) => {
    const cat = REGION_CATEGORIES[region.category];
    const color = new THREE.Color(cat.color);

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0.38,
      shininess: 40,
      specular: 0x223344,
    });
    const mesh = new THREE.Mesh(baseSphereGeo, material);
    mesh.position.set(...region.pos);
    mesh.scale.set(...region.scale);
    mesh.userData.regionId = region.id;
    mesh.userData.baseOpacity = 0.38;
    mesh.userData.baseColor = color.clone();

    const wire = new THREE.Mesh(
      baseSphereGeo,
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
    );
    mesh.add(wire);
    mesh.userData.wire = wire;

    brainGroup.add(mesh);
    meshesById[region.id] = mesh;
  });

  /* ---------------------------------------------------------------------
     3) CONNECTION LINES (signature interaction)
     Drawn only for the selected region's links; pulses via opacity.
     --------------------------------------------------------------------- */
  const connectionGroup = new THREE.Group();
  brainGroup.add(connectionGroup);
  let pulseClock = 0;

  function buildConnectionsFor(regionId) {
    connectionGroup.clear();
    const links = CONNECTIONS.filter((c) => c.includes(regionId));
    links.forEach(([a, b]) => {
      const other = a === regionId ? b : a;
      if (!meshesById[other]) return;
      const pA = new THREE.Vector3(...regionsById[a].pos);
      const pB = new THREE.Vector3(...regionsById[b].pos);
      const mid = pA.clone().lerp(pB, 0.5);
      mid.y += 0.35; // arc upward like a synapse

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const points = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x47e0b0,
        transparent: true,
        opacity: 0.7,
      });
      const line = new THREE.Line(geo, mat);
      connectionGroup.add(line);
    });
  }

  /* ---------------------------------------------------------------------
     4) RAYCASTING / SELECTION
     --------------------------------------------------------------------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedId = null;
  let hoveredMesh = null;

  function setPointerFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
  }

  function pickRegion() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(brainGroup.children, false);
    return hits.length ? hits[0].object : null;
  }

  function highlight(mesh, on) {
    if (!mesh || !mesh.userData.baseColor) return;
    if (on) {
      mesh.material.color.set(0x47e0b0);
      mesh.material.opacity = 0.75;
      mesh.userData.wire.material.color.set(0x47e0b0);
    } else {
      mesh.material.color.copy(mesh.userData.baseColor);
      mesh.material.opacity = mesh.userData.baseOpacity;
      mesh.userData.wire.material.color.copy(mesh.userData.baseColor);
    }
  }

  function selectRegion(regionId, { fromUser = true } = {}) {
    if (selectedId && meshesById[selectedId]) highlight(meshesById[selectedId], false);
    selectedId = regionId;
    const mesh = meshesById[regionId];
    if (mesh) highlight(mesh, true);
    buildConnectionsFor(regionId);
    showInfoPanel(regionId);
    setActiveListItem(regionId);
    if (fromUser && window.__quizActive) checkQuizAnswer(regionId);

    // Keep the DSM-5/ICD-11 + sociocultural panel in sync (add-on module).
    if (window.ClinicalPanel) window.ClinicalPanel.setCurrentRegion(regionId);
  }

  function deselect() {
    if (selectedId && meshesById[selectedId]) highlight(meshesById[selectedId], false);
    selectedId = null;
    connectionGroup.clear();
    hideInfoPanel();
    setActiveListItem(null);

    // Close the clinical panel too so it doesn't show stale data (add-on module).
    if (window.ClinicalPanel) window.ClinicalPanel.hide();
  }

  renderer.domElement.addEventListener("pointermove", (e) => {
    setPointerFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(brainGroup.children, false);
    const obj = hits.length ? hits[0].object : null;

    if (hoveredMesh && hoveredMesh !== obj && hoveredMesh.userData.regionId !== selectedId) {
      highlight(hoveredMesh, false);
    }
    if (obj && obj.userData.regionId !== selectedId) {
      highlight(obj, true);
      obj.material.opacity = 0.55; // hover is slightly dimmer than selected
    }
    hoveredMesh = obj;
    renderer.domElement.style.cursor = obj ? "pointer" : "grab";
  });

  renderer.domElement.addEventListener("click", () => {
    const obj = pickRegion();
    if (obj) {
      selectRegion(obj.userData.regionId);
    }
  });

  document.getElementById("info-close").addEventListener("click", deselect);

  /* ---------------------------------------------------------------------
     5) SIDEBAR + SEARCH
     --------------------------------------------------------------------- */
  const listEl = document.getElementById("region-list");
  const searchEl = document.getElementById("search");
  const countEl = document.getElementById("region-count");

  function buildSidebar(filterText = "") {
    listEl.innerHTML = "";
    const q = filterText.trim().toLowerCase();
    const groups = {};

    REGIONS.forEach((r) => {
      const haystack = `${r.name} ${r.function} ${r.clinical} ${r.group}`.toLowerCase();
      if (q && !haystack.includes(q)) return;
      (groups[r.group] = groups[r.group] || []).push(r);
    });

    let shown = 0;
    Object.entries(groups).forEach(([groupName, regions]) => {
      const groupEl = document.createElement("div");
      groupEl.className = "category-group";
      const label = document.createElement("div");
      label.className = "category-label";
      label.textContent = groupName;
      groupEl.appendChild(label);

      regions.forEach((r) => {
        shown++;
        const btn = document.createElement("button");
        btn.className = "region-item";
        btn.dataset.regionId = r.id;
        const cat = REGION_CATEGORIES[r.category];
        btn.innerHTML = `<span class="swatch" style="background:${cat.color}"></span>${r.name}`;
        btn.addEventListener("click", () => {
          selectRegion(r.id);
          focusCameraOn(r.id);
        });
        groupEl.appendChild(btn);
      });
      listEl.appendChild(groupEl);
    });

    countEl.textContent = `${shown} region${shown === 1 ? "" : "s"}`;
  }

  function setActiveListItem(regionId) {
    listEl.querySelectorAll(".region-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.regionId === regionId);
    });
  }

  searchEl.addEventListener("input", (e) => buildSidebar(e.target.value));
  buildSidebar();

  const sidebarToggle = document.getElementById("sidebar-toggle");
  sidebarToggle.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  /* ---------------------------------------------------------------------
     INFO PANEL
     --------------------------------------------------------------------- */
  const panel = document.getElementById("info-panel");
  function showInfoPanel(regionId) {
    const r = regionsById[regionId];
    if (!r) return;
    document.getElementById("info-category").textContent = REGION_CATEGORIES[r.category].label;
    document.getElementById("info-name").textContent = r.name;
    document.getElementById("info-brodmann").textContent =
      r.brodmann && r.brodmann !== "—" ? `Brodmann Area(s): ${r.brodmann}` : "";
    document.getElementById("info-function").textContent = r.function;
    document.getElementById("info-clinical").textContent = r.clinical;
    panel.classList.add("visible");
  }
  function hideInfoPanel() {
    panel.classList.remove("visible");
  }

  /* ---------------------------------------------------------------------
     CAMERA HELPERS
     --------------------------------------------------------------------- */
  function focusCameraOn(regionId) {
    const r = regionsById[regionId];
    if (!r) return;
    const target = new THREE.Vector3(...r.pos);
    const dir = target.clone().normalize();
    if (dir.lengthSq() === 0) dir.set(0, 0, 1);
    const camPos = target.clone().add(dir.multiplyScalar(2.4));
    camPos.y += 0.6;
    animateCamera(camPos, target);
  }

  function animateCamera(pos, target) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 650;
    const t0 = performance.now();
    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(startPos, pos, ease);
      controls.target.lerpVectors(startTarget, target, ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.getElementById("btn-reset").addEventListener("click", () => {
    animateCamera(DEFAULT_CAM_POS, new THREE.Vector3(0, 0, 0));
    deselect();
  });

  /* ---------------------------------------------------------------------
     ADD-ON: Clinical / Cultural panel toggle button
     --------------------------------------------------------------------- */
  const clinicalBtn = document.getElementById("btn-clinical");
  if (clinicalBtn) {
    clinicalBtn.addEventListener("click", () => {
      if (!selectedId) {
        showToast("Select a region first");
        return;
      }
      if (window.ClinicalPanel) window.ClinicalPanel.toggle(selectedId);
    });
  }

  /* ---------------------------------------------------------------------
     6) QUIZ MODE ("Pinpoint")
     --------------------------------------------------------------------- */
  const quizBtn = document.getElementById("btn-quiz");
  const quizBar = document.getElementById("quiz-bar");
  const quizPrompt = document.getElementById("quiz-prompt").querySelector("strong");
  const quizTimerEl = document.getElementById("quiz-timer");
  const quizScoreEl = document.getElementById("quiz-score");
  const quizFeedback = document.getElementById("quiz-feedback");

  let quizPool = [];
  let quizCurrent = null;
  let quizCorrect = 0;
  let quizTotal = 0;
  let quizTimer = null;
  let quizTimeLeft = 0;
  const QUIZ_SECONDS = 6;

  window.__quizActive = false;

  function startQuiz() {
    window.__quizActive = true;
    quizPool = REGIONS.map((r) => r.id);
    quizCorrect = 0;
    quizTotal = 0;
    quizBar.classList.add("active");
    quizBtn.classList.add("on");
    quizBtn.textContent = "◎ end pinpoint";
    deselect();
    nextQuizQuestion();
  }

  function stopQuiz(message) {
    window.__quizActive = false;
    clearInterval(quizTimer);
    quizBar.classList.remove("active");
    quizBtn.classList.remove("on");
    quizBtn.textContent = "◎ pinpoint mode";
    showToast(message || `Session complete — ${quizCorrect}/${quizTotal} correct`);
  }

  function nextQuizQuestion() {
    if (quizPool.length === 0) quizPool = REGIONS.map((r) => r.id);
    const idx = Math.floor(Math.random() * quizPool.length);
    quizCurrent = quizPool.splice(idx, 1)[0];
    quizPrompt.textContent = regionsById[quizCurrent].name;
    quizScoreEl.textContent = `${quizCorrect} / ${quizTotal}`;
    quizTimeLeft = QUIZ_SECONDS;
    quizTimerEl.textContent = quizTimeLeft.toFixed(1) + "s";
    clearInterval(quizTimer);
    quizTimer = setInterval(() => {
      quizTimeLeft -= 0.1;
      quizTimerEl.textContent = Math.max(0, quizTimeLeft).toFixed(1) + "s";
      if (quizTimeLeft <= 0) {
        clearInterval(quizTimer);
        flashFeedback(false);
        quizTotal++;
        setTimeout(nextQuizQuestion, 550);
      }
    }, 100);
  }

  function checkQuizAnswer(clickedId) {
    if (!quizCurrent) return;
    clearInterval(quizTimer);
    quizTotal++;
    const correct = clickedId === quizCurrent;
    if (correct) quizCorrect++;
    flashFeedback(correct);
    setTimeout(() => {
      deselect();
      nextQuizQuestion();
    }, 550);
  }

  function flashFeedback(correct) {
    quizFeedback.className = correct ? "correct" : "wrong";
    setTimeout(() => (quizFeedback.className = ""), 400);
  }

  quizBtn.addEventListener("click", () => {
    if (window.__quizActive) {
      stopQuiz();
    } else {
      startQuiz();
    }
  });
  document.getElementById("quiz-end-btn").addEventListener("click", () => stopQuiz());

  /* ---------------------------------------------------------------------
     TOAST
     --------------------------------------------------------------------- */
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------------------------
     RESIZE + RENDER LOOP
     --------------------------------------------------------------------- */
  window.addEventListener("resize", () => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
  });

  function animate(now) {
    requestAnimationFrame(animate);
    controls.update();

    // pulse connection lines
    pulseClock += 0.02;
    const pulse = 0.45 + Math.sin(pulseClock * 3) * 0.25;
    connectionGroup.children.forEach((line) => (line.material.opacity = pulse));

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  /* ---------------------------------------------------------------------
     ADD-ON: expose core pieces for enhancements.js
     (vascular territory / lesion tool / network highlighter / case quiz)
     --------------------------------------------------------------------- */
  window.NeuromapCore = {
    scene, camera, renderer, controls, brainGroup,
    meshesById, regionsById, REGIONS, REGION_CATEGORIES, CONNECTIONS,
    selectRegion, deselect, highlight, focusCameraOn, showToast, pickRegion
  };
  window.dispatchEvent(new Event("neuromap:ready"));
})();
