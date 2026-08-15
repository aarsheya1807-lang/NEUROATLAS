document.addEventListener("DOMContentLoaded", () => {
  // 1. DOM Element References
  const container = document.getElementById("canvas-container");
  const heroSection = document.getElementById("hero-cover");
  const launchBtn = document.getElementById("btn-launch-explorer");
  const infoPanel = document.getElementById("info-panel");

  // 2. Three.js Scene Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 3. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight1.position.set(10, 20, 15);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x58a6ff, 0.8);
  dirLight2.position.set(-10, -10, -15);
  scene.add(dirLight2);

  // 4. Model Loading with Automatic Procedural Fallback
  let brainGroup = new THREE.Group();
  scene.add(brainGroup);

  const loader = new THREE.GLTFLoader();
  
  // Relative path specifically for GitHub Pages
  const modelPaths = ["./brain.glb", "./brain.gltf", "./models/brain.glb"];

  function tryLoadModel(index) {
    if (index >= modelPaths.length) {
      console.warn("Could not find GLTF/GLB file. Generating high-quality 3D Brain mesh fallback.");
      createProceduralBrainFallback();
      return;
    }

    loader.load(
      modelPaths[index],
      (gltf) => {
        const loadedMesh = gltf.scene;
        
        // Auto-center and frame the loaded brain model
        const box = new THREE.Box3().setFromObject(loadedMesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        loadedMesh.position.sub(center); // Center geometry
        brainGroup.add(loadedMesh);

        // Adjust camera position to frame the model perfectly
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.8;

        camera.position.set(0, maxDim * 0.2, cameraZ);
        controls.target.set(0, 0, 0);
        controls.update();

        console.log("Brain 3D model loaded successfully from:", modelPaths[index]);
      },
      undefined,
      () => {
        // Try next potential file path
        tryLoadModel(index + 1);
      }
    );
  }

  // Generate fallback 3D stylized brain structure if .glb is missing
  function createProceduralBrainFallback() {
    const leftHemisphere = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x58a6ff, wireframe: true, roughness: 0.3 })
    );
    leftHemisphere.position.x = -10;
    leftHemisphere.scale.set(1, 0.85, 1.3);

    const rightHemisphere = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x388bfd, wireframe: true, roughness: 0.3 })
    );
    rightHemisphere.position.x = 10;
    rightHemisphere.scale.set(1, 0.85, 1.3);

    brainGroup.add(leftHemisphere);
    brainGroup.add(rightHemisphere);

    camera.position.set(0, 20, 90);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // Start loading
  tryLoadModel(0);

  // 5. Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Subtle auto-rotation when idle
    if (brainGroup) {
      brainGroup.rotation.y += 0.002;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // 6. Handle Window Resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 7. Transition Handler (Hero Page -> 3D Explorer)
  if (launchBtn && heroSection) {
    launchBtn.addEventListener("click", () => {
      console.log("Launching 3D Explorer...");

      // Animate Hero overlay fade out using GSAP CDN
      gsap.to(heroSection, {
        opacity: 0,
        y: -40,
        duration: 0.7,
        ease: "power3.inOut",
        onComplete: () => {
          heroSection.style.display = "none";
          if (infoPanel) infoPanel.classList.remove("hidden");
        }
      });

      // Force canvas size update and trigger camera zoom-in effect
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      gsap.from(camera.position, {
        z: camera.position.z * 1.6,
        duration: 1.4,
        ease: "power2.out"
      });
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  // 1. Clinical Data Dictionary
  const regionData = {
    frontal: {
      name: "Frontal Lobe / Prefrontal Cortex",
      desc: "Responsible for executive function, working memory, decision making, emotional regulation, and voluntary motor movement.",
      dsm: "Major Neurocognitive Disorder due to Traumatic Brain Injury (294.11) / Dysexecutive Syndrome",
      icd: "6D80 (Dementia due to Alzheimer disease) / MB20.1 (Executive Dysfunction)",
      lesion: "Apathy, disinhibition, impaired planning/judgment, motor perseveration, and personality changes."
    },
    broca: {
      name: "Broca's Area (Pars Opercularis & Triangularis)",
      desc: "Located in the dominant inferior frontal gyrus. Governs motor speech production and syntactic processing.",
      dsm: "Neurodevelopmental Speech Sound Disorder (315.39) / Vascular Neurocognitive Disorder",
      icd: "MA80.0 (Aphasia) / 6A01.0 (Developmental speech sound disorder)",
      lesion: "Broca's (Expressive) Aphasia: Non-fluent, halting speech with intact comprehension but impaired repetition."
    },
    temporal: {
      name: "Temporal Lobe & Wernicke's Area",
      desc: "Processes auditory input, language comprehension (Wernicke's), memory integration, and emotion.",
      dsm: "Major Neurocognitive Disorder with Lewy Bodies / Semantic Dementia Variant",
      icd: "MA80.1 (Receptive Aphasia) / 6D81 (Frontotemporal Dementia)",
      lesion: "Wernicke's (Receptive) Aphasia: Fluent but meaningless 'word salad' speech with severely impaired comprehension."
    },
    parietal: {
      name: "Parietal Lobe",
      desc: "Integrates somatosensory information (touch, pressure, pain) and spatial perception.",
      dsm: "Major Neurocognitive Disorder due to Vascular Disease (Apraxia/Agnosia features)",
      icd: "MB20.2 (Apraxia) / MB4B.0 (Visual Agnosia)",
      lesion: "Hemispatial neglect (right lesion), Astereognosis, Gerstmann Syndrome (agraphia, acalculia, finger agnosia)."
    },
    occipital: {
      name: "Occipital Lobe",
      desc: "Primary visual processing center (V1) responsible for mapping spatial visual fields, color, and motion.",
      dsm: "Visual Agnosia sub-category under Neurocognitive Disorders",
      icd: "MB4B.0 (Visual Agnosia) / Cortical Blindness",
      lesion: "Homonymous hemianopia, visual hallucinations, prosopagnosia (if fusiform gyrus damaged), Cortical Blindness."
    },
    hippocampus: {
      name: "Hippocampus",
      desc: "Crucial for declarative memory consolidation, spatial navigation, and episodic memory retrieval.",
      dsm: "Major Neurocognitive Disorder due to Alzheimer's Disease (294.11)",
      icd: "6D80.0 (Alzheimer Disease - Amnestic presentation)",
      lesion: "Severe anterograde amnesia (inability to form new memories) with preserved implicit/procedural memory."
    },
    amygdala: {
      name: "Amygdala",
      desc: "Core hub of the limbic system. Processes fear conditioning, threat detection, and emotional salience.",
      dsm: "Post-Traumatic Stress Disorder (309.81) / Specific Phobia",
      icd: "6B40 (Post-traumatic stress disorder) / 6B03 (Phobic anxiety disorder)",
      lesion: "Klüver-Bucy syndrome (hypersexuality, docility, hyperorality), loss of fear conditioning, emotional blunting."
    },
    cerebellum: {
      name: "Cerebellum",
      desc: "Coordinates fine motor movement, balance, posture, motor learning, and timing precision.",
      dsm: "Substance/Medication-Induced Cerebellar Ataxia",
      icd: "8A03 (Cerebellar ataxia) / MB23.1 (Dysmetria)",
      lesion: "Cerebellar Ataxia: Intention tremor, dysmetria (past-pointing), dysdiadochokinesia, and wide-based gait."
    },
    brainstem: {
      name: "Brainstem (Midbrain, Pons, Medulla)",
      desc: "Controls vital autonomic functions (cardiovascular, respiratory), sleep-wake cycles, and cranial nerves.",
      dsm: "Vascular Neurocognitive Disorder (Brainstem Stroke origin)",
      icd: "8B11 (Brainstem Stroke) / 7A00 (Central Sleep Apnea)",
      lesion: "Cranial nerve palsies, Wallenberg Syndrome, Locked-in Syndrome, or fatal respiratory arrest."
    }
  };

  // 2. DOM Elements
  const container = document.getElementById("canvas-container");
  const heroSection = document.getElementById("hero-cover");
  const launchBtn = document.getElementById("btn-launch-explorer");
  const topBar = document.getElementById("top-bar");
  const clinicalPanel = document.getElementById("clinical-panel");
  const regionDropdown = document.getElementById("region-dropdown");

  // Panel Data Fields
  const regionNameEl = document.getElementById("region-name");
  const regionDescEl = document.getElementById("region-desc");
  const dsmCodeEl = document.getElementById("dsm-code");
  const icdCodeEl = document.getElementById("icd-code");
  const lesionProfileEl = document.getElementById("lesion-profile");

  // 3. Three.js Scene Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 110);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  // 4. Brain Mesh Storage & Raycaster Setup
  const brainMeshMap = new Map();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let currentlySelectedMesh = null;

  // Generate Interactive Anatomical Brain Parts
  function buildInteractiveBrain() {
    const group = new THREE.Group();

    const regionsList = [
      { key: "frontal", color: 0x58a6ff, pos: [-8, 8, 12], size: [14, 12, 14] },
      { key: "broca", color: 0x79c0ff, pos: [-16, 2, 16], size: [6, 6, 6] },
      { key: "temporal", color: 0x7ee787, pos: [-16, -4, 2], size: [10, 8, 16] },
      { key: "parietal", color: 0xd2a8ff, pos: [-8, 14, -8], size: [14, 12, 14] },
      { key: "occipital", color: 0xff7b72, pos: [-6, 4, -22], size: [10, 10, 10] },
      { key: "hippocampus", color: 0xffa657, pos: [-6, -4, -2], size: [5, 4, 8] },
      { key: "amygdala", color: 0xff6a69, pos: [-8, -6, 6], size: [4, 4, 4] },
      { key: "cerebellum", color: 0xf2cc60, pos: [0, -16, -18], size: [16, 10, 12] },
      { key: "brainstem", color: 0x8b949e, pos: [0, -20, -2], size: [6, 16, 6] }
    ];

    regionsList.forEach(item => {
      const geo = new THREE.SphereGeometry(1, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.4,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...item.pos);
      mesh.scale.set(...item.size);
      mesh.userData = { key: item.key, originalColor: item.color };

      group.add(mesh);
      brainMeshMap.set(item.key, mesh);
    });

    // Mirror Right Hemisphere for symmetry
    regionsList.forEach(item => {
      if (item.pos[0] < 0) {
        const geo = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-item.pos[0], item.pos[1], item.pos[2]);
        mesh.scale.set(...item.size);
        mesh.userData = { key: item.key, originalColor: item.color };
        group.add(mesh);
      }
    });

    scene.add(group);
  }

  buildInteractiveBrain();

  // 5. Select Region & Update UI
  function selectRegion(key) {
    const data = regionData[key];
    if (!data) return;

    // Reset previous selection color
    if (currentlySelectedMesh) {
      currentlySelectedMesh.material.emissive.setHex(0x000000);
    }

    const targetMesh = brainMeshMap.get(key);
    if (targetMesh) {
      targetMesh.material.emissive.setHex(0x58a6ff);
      targetMesh.material.emissiveIntensity = 0.5;
      currentlySelectedMesh = targetMesh;

      // GSAP Camera Focus Animation onto target region
      const worldPos = new THREE.Vector3();
      targetMesh.getWorldPosition(worldPos);

      gsap.to(controls.target, {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        duration: 1.2,
        ease: "power2.inOut"
      });

      gsap.to(camera.position, {
        x: worldPos.x,
        y: worldPos.y + 10,
        z: worldPos.z + 50,
        duration: 1.2,
        ease: "power2.inOut"
      });
    }

    // Populate Side Panel Data
    regionNameEl.textContent = data.name;
    regionDescEl.textContent = data.desc;
    dsmCodeEl.textContent = data.dsm;
    icdCodeEl.textContent = data.icd;
    lesionProfileEl.textContent = data.lesion;
    regionDropdown.value = key;
  }

  // 6. Raycaster Click Listener (Click 3D Brain directly)
  window.addEventListener("pointerdown", (e) => {
    // Only detect clicks when hero cover is hidden
    if (heroSection.style.display !== "none") return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      if (clickedMesh.userData && clickedMesh.userData.key) {
        selectRegion(clickedMesh.userData.key);
      }
    }
  });

  // Dropdown Change Listener
  regionDropdown.addEventListener("change", (e) => {
    if (e.target.value) {
      selectRegion(e.target.value);
    }
  });

  // 7. Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Resize Handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 8. Launch Button Click Handler
  launchBtn.addEventListener("click", () => {
    gsap.to(heroSection, {
      opacity: 0,
      y: -40,
      duration: 0.7,
      ease: "power3.inOut",
      onComplete: () => {
        heroSection.style.display = "none";
        topBar.classList.remove("hidden");
        clinicalPanel.classList.remove("hidden");
      }
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  // ==========================================
// 10 CLINICAL CASES & 50 MCQ QUESTION BANK
// ==========================================

const clinicalCasesData = [
  // EASY LEVEL (3)
  {
    id: "C1", difficulty: "Easy", category: "Subcortical Pathology",
    title: "Case 1: Anterograde Amnesia Post-Anoxia",
    description: "A 45-year-old patient survives cardiac arrest but develops severe memory impairment. He can recall childhood memories but cannot form new declarative memories. Which structure suffered bilateral ischemic damage?",
    options: [
      { text: "Hippocampus", correct: true, explanation: "Correct! The CA1 region of the hippocampus is exceptionally vulnerable to anoxia, leading to anterograde amnesia." },
      { text: "Cerebellum", correct: false, explanation: "Incorrect. Cerebellar damage affects motor learning and coordination, not declarative memory." },
      { text: "Occipital Lobe", correct: false, explanation: "Incorrect. The occipital lobe handles visual processing." },
      { text: "Substantia Nigra", correct: false, explanation: "Incorrect. Substantia nigra degeneration is associated with Parkinsonian motor symptoms." }
    ]
  },
  {
    id: "C2", difficulty: "Easy", category: "Motor Cortex",
    title: "Case 2: Expressive Aphasia",
    description: "Following an ischemic stroke in the left hemisphere, a 60-year-old patient can understand spoken commands but struggles to produce words, speaking in slow, non-fluent fragments. Where is the lesion located?",
    options: [
      { text: "Broca's Area (Inferior Frontal Gyrus)", correct: true, explanation: "Correct! Broca's area governs motor production of speech." },
      { text: "Wernicke's Area (Superior Temporal Gyrus)", correct: false, explanation: "Incorrect. Wernicke's aphasia causes fluent but non-sensical speech and comprehension deficits." },
      { text: "Primary Auditory Cortex", correct: false, explanation: "Incorrect. Damage here causes cortical deafness, not expressive speech deficits." },
      { text: "Amygdala", correct: false, explanation: "Incorrect. The amygdala regulates fear and emotional processing." }
    ]
  },
  {
    id: "C3", difficulty: "Easy", category: "Visual Pathways",
    title: "Case 3: Visual Agnosia",
    description: "A patient can draw an object from memory perfectly but cannot name an apple placed directly in front of them until allowed to touch it. Which pathway is impaired?",
    options: [
      { text: "Ventral Stream ('What' Pathway)", correct: true, explanation: "Correct! The ventral stream (occipito-temporal) mediates object identification." },
      { text: "Dorsal Stream ('Where' Pathway)", correct: false, explanation: "Incorrect. The dorsal stream processes spatial location and motion perception." },
      { text: "Spinothalamic Tract", correct: false, explanation: "Incorrect. The spinothalamic tract transmits pain and temperature from the body." },
      { text: "Medial Lemniscus", correct: false, explanation: "Incorrect. This pathway carries fine touch and proprioception." }
    ]
  },

  // MEDIUM LEVEL (4)
  {
    id: "C4", difficulty: "Medium", category: "Limbic System",
    title: "Case 4: Kluver-Bucy Syndrome",
    description: "Following temporal lobe herpes simplex encephalitis, a patient demonstrates hyperorality, hypersexuality, visual agnosia, and a total loss of fear response. Which structure is bilaterally destroyed?",
    options: [
      { text: "Amygdala", correct: true, explanation: "Correct! Bilateral destruction of the amygdala causes Klüver-Bucy syndrome symptoms, notably loss of fear and hyperorality." },
      { text: "Thalamic Reticular Nucleus", correct: false, explanation: "Incorrect. Reticular nucleus regulates thalamocortical gating." },
      { text: "Nucleus Accumbens", correct: false, explanation: "Incorrect. Primarily involved in reward processing and addiction." },
      { text: "Locus Coeruleus", correct: false, explanation: "Incorrect. Locus coeruleus synthesizes norepinephrine for arousal." }
    ]
  },
  {
    id: "C5", difficulty: "Medium", category: "Executive Function",
    title: "Case 5: Pseudopsychopathic Personality",
    description: "After a traumatic brain injury to the orbitofrontal cortex, a previously mild-mannered accountant becomes impulsive, profane, socially inappropriate, and uninhibited. Which area was damaged?",
    options: [
      { text: "Ventromedial / Orbitofrontal Cortex", correct: true, explanation: "Correct! The OFC/vmPFC regulates impulse control, value-based decision making, and social behavior." },
      { text: "Dorsolateral Prefrontal Cortex", correct: false, explanation: "Incorrect. DLPFC lesions primarily impair working memory and abstract planning rather than social inhibition." },
      { text: "Premotor Cortex", correct: false, explanation: "Incorrect. Involved in motor planning." },
      { text: "Insular Cortex", correct: false, explanation: "Incorrect. Handles interoception, disgust, and pain perception." }
    ]
  },
  {
    id: "C6", difficulty: "Medium", category: "Neuropsychiatry & CCD",
    title: "Case 6: Cultural Concepts of Distress",
    description: "A patient from a traditional background presents with acute somatic panic, heat sensations in the head, and fear of semen loss (Dhat syndrome). How should this be evaluated clinical-anatomically?",
    options: [
      { text: "DSM-5-TR Idiom of Distress with Autonomic Hyperarousal", correct: true, explanation: "Correct! Dhat syndrome is a recognized cultural concept of distress where somatic complaints mediate anxiety through sympathetic autonomic activation." },
      { text: "Focal Temporal Lobe Epilepsy", correct: false, explanation: "Incorrect. Symptoms are culturally patterned somatic expressions of distress rather than focal seizures." },
      { text: "Primary Cerebellar Ataxia", correct: false, explanation: "Incorrect. No cerebellar signs are present." },
      { text: "Pure Broca's Aphasia", correct: false, explanation: "Incorrect. Speech articulation remains intact." }
    ]
  },
  {
    id: "C7", difficulty: "Medium", category: "Parietal Pathology",
    title: "Case 7: Hemispatial Neglect",
    description: "Following a stroke, a patient eats food from only the right side of her plate, draws clocks missing numbers 7 through 12, and ignores the left side of her body. Where is the lesion?",
    options: [
      { text: "Right Non-Dominant Posterior Parietal Cortex", correct: true, explanation: "Correct! The right posterior parietal cortex directs spatial attention bilaterally; damage causes left spatial neglect." },
      { text: "Left Superior Temporal Gyrus", correct: false, explanation: "Incorrect. Causes Wernicke's fluent aphasia." },
      { text: "Bilateral Occipital Poles", correct: false, explanation: "Incorrect. Causes cortical blindness." },
      { text: "Basal Ganglia Striatum", correct: false, explanation: "Incorrect. Leads to movement disorders like chorea or parkinsonism." }
    ]
  },

  // HARD LEVEL (3)
  {
    id: "C8", difficulty: "Hard", category: "Basal Ganglia Pathways",
    title: "Case 8: Hemiballismus",
    description: "A 72-year-old diabetic patient presents with sudden, violent, involuntary flinging movements of his left arm and leg. Neuroimaging confirms a lacunar infarction. Which structure is affected?",
    options: [
      { text: "Contralateral Subthalamic Nucleus (STN)", correct: true, explanation: "Correct! Damage to the subthalamic nucleus reduces indirect pathway inhibition on the thalamus, causing violent hemiballistic movements." },
      { text: "Ipsilateral Globus Pallidus Internus", correct: false, explanation: "Incorrect. GPi lesions cause decreased motor output rather than hemiballismus." },
      { text: "Bilateral Caudate Nuclei", correct: false, explanation: "Incorrect. Caudate degeneration is typical in Huntington's disease (chorea)." },
      { text: "Red Nucleus", correct: false, explanation: "Incorrect. Red nucleus damage leads to rubral tremor." }
    ]
  },
  {
    id: "C9", difficulty: "Hard", category: "Neuroimaging & Thalamus",
    title: "Case 9: Dejerine-Roussy Syndrome",
    description: "Months after a thalamic stroke, a patient develops severe, intractable hyperalgesia and allodynia where light touch feels like burning pain. Which thalamic nucleus complex was involved?",
    options: [
      { text: "Ventral Posterolateral (VPL) & Ventral Posteromedial (VPM) Nuclei", correct: true, explanation: "Correct! VPL/VPM sensory relay damage can lead to Thalamic Pain Syndrome (Dejerine-Roussy)." },
      { text: "Anterior Thalamic Nucleus", correct: false, explanation: "Incorrect. Anterior nucleus is part of Papez circuit involved in memory." },
      { text: "Lateral Geniculate Nucleus (LGN)", correct: false, explanation: "Incorrect. LGN relays visual information." },
      { text: "Medial Geniculate Nucleus (MGN)", correct: false, explanation: "Incorrect. MGN relays auditory information." }
    ]
  },
  {
    id: "C10", difficulty: "Hard", category: "Autonomic & Hypothalamic",
    title: "Case 10: Central Diabetes Insipidus & Poikilothermia",
    description: "A patient presenting with hypernatremia, massive polyuria (dilute urine), and extreme core temperature fluctuations following pituitary surgery has suffered injury to which specific neurosecretory region?",
    options: [
      { text: "Supraoptic and Paraventricular Hypothalamic Nuclei", correct: true, explanation: "Correct! These nuclei synthesize Vasopressin (ADH). Damage disrupts thermoregulation and fluid balance." },
      { text: "Precommissural Fornix", correct: false, explanation: "Incorrect. Carries hippocampal projections." },
      { text: "Arcuate Nucleus", correct: false, explanation: "Incorrect. Controls prolactin release and energy homeostasis." },
      { text: "Pineal Gland", correct: false, explanation: "Incorrect. Synthesizes melatonin for circadian rhythms." }
    ]
  }
];

// Generate 50 MCQs across Easy (18), Medium (18), and Hard (14)
const mcqQuestionsData = [
  // EASY LEVEL (1-18)
  { id:"M1", difficulty:"Easy", category:"Anatomy", title:"MCQ 1", description:"Which lobe is primarily responsible for visual processing?", options:[{text:"Occipital Lobe",correct:true,explanation:"The occipital lobe houses V1/primary visual cortex."},{text:"Temporal Lobe",correct:false,explanation:"Processes auditory input and memory."},{text:"Frontal Lobe",correct:false,explanation:"Handles executive functions and motor control."},{text:"Parietal Lobe",correct:false,explanation:"Processes somatosensory information."}]},
  { id:"M2", difficulty:"Easy", category:"Anatomy", title:"MCQ 2", description:"The primary motor cortex is located in which gyrus?", options:[{text:"Precentral Gyrus",correct:true,explanation:"Brodmann Area 4 is located in the precentral gyrus."},{text:"Postcentral Gyrus",correct:false,explanation:"Contains the somatosensory cortex."},{text:"Superior Temporal Gyrus",correct:false,explanation:"Contains primary auditory cortex."},{text:"Cingulate Gyrus",correct:false,explanation:"Part of the limbic system."}]},
  { id:"M3", difficulty:"Easy", category:"Neurotransmitters", title:"MCQ 3", description:"Which transmitter is primary at the neuromuscular junction?", options:[{text:"Acetylcholine",correct:true,explanation:"ACh triggers muscle contraction at motor endplates."},{text:"Dopamine",correct:false,explanation:"Involved in reward and motor modulation."},{text:"GABA",correct:false,explanation:"Primary inhibitory neurotransmitter in the CNS."},{text:"Glutamate",correct:false,explanation:"Primary excitatory neurotransmitter in the CNS."}]},
  { id:"M4", difficulty:"Easy", category:"Anatomy", title:"MCQ 4", description:"Which structure connects the left and right cerebral hemispheres?", options:[{text:"Corpus Callosum",correct:true,explanation:"A massive white matter tract interlinking the hemispheres."},{text:"Internal Capsule",correct:false,explanation:"Connects cortex with subcortical structures."},{text:"Fornix",correct:false,explanation:"Connects hippocampus to mammillary bodies."},{text:"Stria Terminalis",correct:false,explanation:"Connects amygdala to hypothalamus."}]},
  { id:"M5", difficulty:"Easy", category:"Physiology", title:"MCQ 5", description:"Which main inhibitory neurotransmitter is found in the central nervous system?", options:[{text:"GABA",correct:true,explanation:"Gamma-aminobutyric acid hyperpolarizes post-synaptic neurons."},{text:"Glutamate",correct:false,explanation:"Main excitatory transmitter."},{text:"Norepinephrine",correct:false,explanation:"Modulates arousal and sympathetic tone."},{text:"Histamine",correct:false,explanation:"Modulates wakefulness."}]},
  { id:"M6", difficulty:"Easy", category:"Anatomy", title:"MCQ 6", description:"The primary somatosensory cortex corresponds to which Brodmann Areas?", options:[{text:"BA 3, 1, 2",correct:true,explanation:"Located in the postcentral gyrus."},{text:"BA 4",correct:false,explanation:"Primary motor cortex."},{text:"BA 17",correct:false,explanation:"Primary visual cortex."},{text:"BA 41, 42",correct:false,explanation:"Primary auditory cortex."}]},
  { id:"M7", difficulty:"Easy", category:"Neuroanatomy", title:"MCQ 7", description:"Which structure is key for balance and motor coordination?", options:[{text:"Cerebellum",correct:true,explanation:"Compares motor intent with sensory feedback to refine movement."},{text:"Hippocampus",correct:false,explanation:"Handles memory formation."},{text:"Amygdala",correct:false,explanation:"Processes emotional responses."},{text:"Thalamus",correct:false,explanation:"Sensory relay center."}]},
  { id:"M8", difficulty:"Easy", category:"Autonomic", title:"MCQ 8", description:"Which cranial nerve provides extensive parasympathetic innervation to visceral organs?", options:[{text:"Vagus Nerve (CN X)",correct:true,explanation:"CN X innervates heart, lungs, and GI tract."},{text:"Trigeminal Nerve (CN V)",correct:false,explanation:"Provides facial sensation and mastication motor."},{text:"Facial Nerve (CN VII)",correct:false,explanation:"Controls facial muscles and anterior 2/3 taste."},{text:"Glossopharyngeal (CN IX)",correct:false,explanation:"Innervates parotid gland and posterior 1/3 taste."}]},
  { id:"M9", difficulty:"Easy", category:"Physiology", title:"MCQ 9", description:"What produces cerebrospinal fluid (CSF)?", options:[{text:"Choroid Plexus",correct:true,explanation:"Specialized vascular plexus in brain ventricles that secretes CSF."},{text:"Arachnoid Granulations",correct:false,explanation:"Absorb CSF into dural sinuses."},{text:"Astrocyte End-Feet",correct:false,explanation:"Maintain the blood-brain barrier."},{text:"Ependymal Cells",correct:false,explanation:"Line ventricles but choroid plexus is the primary producer."}]},
  { id:"M10", difficulty:"Easy", category:"Anatomy", title:"MCQ 10", description:"Primary visual cortex is designated as which Brodmann Area?", options:[{text:"BA 17",correct:true,explanation:"Located surrounding the calcarine sulcus."},{text:"BA 44",correct:false,explanation:"Part of Broca's area."},{text:"BA 22",correct:false,explanation:"Part of Wernicke's area."},{text:"BA 6",correct:false,explanation:"Premotor cortex."}]},
  { id:"M11", difficulty:"Easy", category:"Subcortical", title:"MCQ 11", description:"Which brain region regulates body temperature, hunger, and thirst?", options:[{text:"Hypothalamus",correct:true,explanation:"Central homeostatic integration center."},{text:"Epithalamus",correct:false,explanation:"Contains pineal gland."},{text:"Pons",correct:false,explanation:"Relays motor signals and breathing control."},{text:"Medulla",correct:false,explanation:"Cardiovascular and vasomotor center."}]},
  { id:"M12", difficulty:"Easy", category:"Neurology", title:"MCQ 12", description:"Loss of dopamine-producing neurons in the Substantia Nigra causes which disease?", options:[{text:"Parkinson's Disease",correct:true,explanation:"Causes bradykinesia, rigidity, and resting tremor."},{text:"Alzheimer's Disease",correct:false,explanation:"Characterized by cholinergic loss and amyloid plaques."},{text:"Multiple Sclerosis",correct:false,explanation:"Autoimmune demyelination of CNS."},{text:"Huntington's Disease",correct:false,explanation:"Caudate nucleus degeneration."}]},
  { id:"M13", difficulty:"Easy", category:"Anatomy", title:"MCQ 13", description:"Which lobe processes auditory information?", options:[{text:"Temporal Lobe",correct:true,explanation:"Houses Heschl's gyrus (BA 41/42)."},{text:"Frontal Lobe",correct:false,explanation:"Motor and cognition."},{text:"Parietal Lobe",correct:false,explanation:"Somatosensory."},{text:"Occipital Lobe",correct:false,explanation:"Vision."}]},
  { id:"M14", difficulty:"Easy", category:"Neuroimaging", title:"MCQ 14", description:"On a standard T1-weighted MRI, cerebrospinal fluid (CSF) appears as what color?", options:[{text:"Dark / Black",correct:true,explanation:"CSF is hypointense (dark) on T1 and hyperintense (bright) on T2."},{text:"Bright White",correct:false,explanation:"CSF is bright on T2 MRI."},{text:"Gray",correct:false,explanation:"Cerebral cortex is gray."},{text:"Bright Yellow",correct:false,explanation:"MRI renders grayscale images."}]},
  { id:"M15", difficulty:"Easy", category:"Sensory", title:"MCQ 15", description:"Which sensory modality does NOT relay directly through the thalamus before cortex?", options:[{text:"Olfaction (Smell)",correct:true,explanation:"Olfactory nerve projects directly to olfactory cortex/amygdala."},{text:"Vision",correct:false,explanation:"Relays through LGN."},{text:"Hearing",correct:false,explanation:"Relays through MGN."},{text:"Gustation (Taste)",correct:false,explanation:"Relays through VPM."}]},
  { id:"M16", difficulty:"Easy", category:"Cellular", title:"MCQ 16", description:"Which glial cells form the myelin sheath in the Central Nervous System (CNS)?", options:[{text:"Oligodendrocytes",correct:true,explanation:"Myelinates CNS axons."},{text:"Schwann Cells",correct:false,explanation:"Myelinates PNS axons."},{text:"Microglia",correct:false,explanation:"Resident immune phagocytes."},{text:"Astrocytes",correct:false,explanation:"Maintain blood-brain barrier."}]},
  { id:"M17", difficulty:"Easy", category:"Anatomy", title:"MCQ 17", description:"The meningeal layer attached directly to the brain surface is the:", options:[{text:"Pia Mater",correct:true,explanation:"Innermost delicate meningeal layer."},{text:"Dura Mater",correct:false,explanation:"Outermost tough layer."},{text:"Arachnoid Mater",correct:false,explanation:"Middle web-like layer."},{text:"Epineurium",correct:false,explanation:"Surrounds peripheral nerves."}]},
  { id:"M18", difficulty:"Easy", category:"Language", title:"MCQ 18", description:"Wernicke's area is traditionally located in which gyrus of the dominant hemisphere?", options:[{text:"Superior Temporal Gyrus",correct:true,explanation:"BA 22 in posterior superior temporal gyrus."},{text:"Inferior Frontal Gyrus",correct:false,explanation:"Location of Broca's area."},{text:"Precentral Gyrus",correct:false,explanation:"Motor cortex."},{text:"Middle Temporal Gyrus",correct:false,explanation:"High-level visual processing."}]},

  // MEDIUM LEVEL (19-36)
  { id:"M19", difficulty:"Medium", category:"Pathology", title:"MCQ 19", description:"Damage to the subthalamic nucleus results in:", options:[{text:"Hemiballismus",correct:true,explanation:"Violent involuntary flinging movements."},{text:"Chorea",correct:false,explanation:"Danced-like movements from caudate lesion."},{text:"Athetosis",correct:false,explanation:"Slow writhing movements."},{text:"Parkinsonism",correct:false,explanation:"Dopamine deficit."}]},
  { id:"M20", difficulty:"Medium", category:"Neuropsychiatry", title:"MCQ 20", description:"Which structure acts as the primary central generator of panic and fear responses?", options:[{text:"Central Nucleus of Amygdala",correct:true,explanation:"Projects to brainstem/hypothalamus to trigger autonomic fight-or-flight."},{text:"Dentate Gyrus",correct:false,explanation:"Part of hippocampus for neurogenesis."},{text:"Nucleus Accumbens",correct:false,explanation:"Dopaminergic reward target."},{text:"Putamen",correct:false,explanation:"Motor loop of basal ganglia."}]},
  { id:"M21", difficulty:"Medium", category:"Visual Pathways", title:"MCQ 21", description:"A transection of the optic chiasm results in which visual field defect?", options:[{text:"Bitemporal Hemianopia",correct:true,explanation:"Crossed nasal decussating fibers are severed, losing peripheral vision."},{text:"Homonymous Hemianopia",correct:false,explanation:"Occurs in post-chiasmatic optic tract lesions."},{text:"Monocular Blindness",correct:false,explanation:"Optic nerve lesion."},{text:"Central Scotoma",correct:false,explanation:"Macular lesion."}]},
  { id:"M22", difficulty:"Medium", category:"Limbic Circuitry", title:"MCQ 22", description:"In the Papez circuit, the Hippocampus projects to the Mammillary Bodies via the:", options:[{text:"Fornix",correct:true,explanation:"Major output white matter tract of hippocampus."},{text:"Cingulum",correct:false,explanation:"Associative tract in cingulate cortex."},{text:"Mammillothalamic Tract",correct:false,explanation:"Connects mammillary bodies to anterior thalamic nucleus."},{text:"Uncinate Fasciculus",correct:false,explanation:"Connects temporal pole to OFC."}]},
  { id:"M23", difficulty:"Medium", category:"Cranial Nerves", title:"MCQ 23", description:"Tears and saliva production are mediated by parasympathetic fibers of CN VII via which ganglion?", options:[{text:"Pterygopalatine and Submandibular Ganglia",correct:true,explanation:"CN VII branches relay through these ganglia."},{text:"Ciliary Ganglion",correct:false,explanation:"CN III pupillary constriction."},{text:"Otic Ganglion",correct:false,explanation:"CN IX parotid gland innervation."},{text:"Gasserian Ganglion",correct:false,explanation:"Trigeminal sensory ganglion."}]},
  { id:"M24", difficulty:"Medium", category:"Receptors", title:"MCQ 24", description:"NMDA receptors require which co-agonist binding along with glutamate to open?", options:[{text:"Glycine",correct:true,explanation:"Glycine or D-serine must bind as co-agonist."},{text:"GABA",correct:false,explanation:"Inhibitory transmitter."},{text:"Serotonin",correct:false,explanation:"Monoamine modulator."},{text:"Histamine",correct:false,explanation:"Arousal modulator."}]},
  { id:"M25", difficulty:"Medium", category:"Pathology", title:"MCQ 25", description:"Pure motor hemiparesis most commonly results from a lacunar stroke in the:", options:[{text:"Posterior Limb of Internal Capsule",correct:true,explanation:"Contains descending corticospinal motor tracts."},{text:"Anterior Limb of Internal Capsule",correct:false,explanation:"Carries thalamocortical fibers."},{text:"Genu of Internal Capsule",correct:false,explanation:"Carries corticobulbar fibers."},{text:"Corpus Callosum",correct:false,explanation:"Interhemispheric connections."}]},
  { id:"M26", difficulty:"Medium", category:"Neuropsychology", title:"MCQ 26", description:"Gerstmann syndrome (agraphia, acalculia, finger agnosia, left-right disorientation) is caused by a lesion in:", options:[{text:"Dominant Angular Gyrus (BA 39)",correct:true,explanation:"Located in dominant inferior parietal lobe."},{text:"Non-dominant Parietal Cortex",correct:false,explanation:"Causes hemispatial neglect."},{text:"Fusiform Face Area",correct:false,explanation:"Causes prosopagnosia."},{text:"Orbitofrontal Cortex",correct:false,explanation:"Causes disinhibition."}]},
  { id:"M27", difficulty:"Medium", category:"Neurophysiology", title:"MCQ 27", description:"Which brainstem center synthesizes the majority of CNS Norepinephrine?", options:[{text:"Locus Coeruleus",correct:true,explanation:"Located in dorsal pons."},{text:"Raphe Nuclei",correct:false,explanation:"Synthesizes serotonin."},{text:"Ventral Tegmental Area",correct:false,explanation:"Synthesizes dopamine."},{text:"Substantia Nigra",correct:false,explanation:"Synthesizes dopamine."}]},
  { id:"M28", difficulty:"Medium", category:"Brainstem", title:"MCQ 28", description:"The Raphe Nuclei are primarily responsible for synthesizing which neurotransmitter?", options:[{text:"Serotonin (5-HT)",correct:true,explanation:"Distributed widely throughout CNS for mood/sleep modulation."},{text:"Dopamine",correct:false,explanation:"Synthesized in VTA/SNc."},{text:"Norepinephrine",correct:false,explanation:"Locus coeruleus."},{text:"Acetylcholine",correct:false,explanation:"Basal forebrain / Pedunculopontine."}]},
  { id:"M29", difficulty:"Medium", category:"Neuropsychology", title:"MCQ 29", description:"Inability to recognize familiar faces while preserving general object recognition is known as:", options:[{text:"Prosopagnosia",correct:true,explanation:"Caused by bilateral fusiform gyrus damage."},{text:"Simultanagnosia",correct:false,explanation:"Inability to perceive visual scene as a whole."},{text:"Astereognosis",correct:false,explanation:"Tactile object agnosia."},{text:"Autotopagnosia",correct:false,explanation:"Inability to orient body parts."}]},
  { id:"M30", difficulty:"Medium", category:"Neuroimaging", title:"MCQ 30", description:"Which MRI sequence is best for detecting hyperacute ischemic stroke within hours?", options:[{text:"Diffusion-Weighted Imaging (DWI)",correct:true,explanation:"Detects cytotoxic edema instantly as restricted diffusion."},{text:"Standard T1 Weighted",correct:false,explanation:"Insensitive in early hours."},{text:"T2 Gradient Echo",correct:false,explanation:"Best for hemorrhage."},{text:"Proton Density",correct:false,explanation:"Subtle tissue contrast."}]},
  { id:"M31", difficulty:"Medium", category:"Development", title:"MCQ 31", description:"Failure of anterior neuropore closure during embryogenesis causes:", options:[{text:"Anencephaly",correct:true,explanation:"Failure of rostral neural tube closure."},{text:"Spina Bifida",correct:false,explanation:"Failure of caudal neuropore closure."},{text:"Holoprosencephaly",correct:false,explanation:"Failure of prosencephalon cleavage."},{text:"Arnold-Chiari Malformation",correct:false,explanation:"Cerebellar tonsillar herniation."}]},
  { id:"M32", difficulty:"Medium", category:"Receptors", title:"MCQ 32", description:"Which dopamine receptor subtype is primarily inhibitory (Gi-coupled)?", options:[{text:"D2 Receptor",correct:true,explanation:"D2, D3, D4 are Gi-coupled; D1 and D5 are Gs-coupled."},{text:"D1 Receptor",correct:false,explanation:"Gs-coupled excitatory pathway."},{text:"D5 Receptor",correct:false,explanation:"Gs-coupled excitatory pathway."},{text:"NMDA Receptor",correct:false,explanation:"Ionotropic glutamate receptor."}]},
  { id:"M33", difficulty:"Medium", category:"Pathology", title:"MCQ 33", description:"Wernicke encephalopathy results from deficiency of which vitamin?", options:[{text:"Thiamine (Vitamin B1)",correct:true,explanation:"Leads to ataxia, ophthalmoplegia, and confusion."},{text:"Pyridoxine (B6)",correct:false,explanation:"Causes peripheral neuropathy."},{text:"Cobalamin (B12)",correct:false,explanation:"Causes subacute combined degeneration."},{text:"Niacin (B3)",correct:false,explanation:"Causes pellagra."}]},
  { id:"M34", difficulty:"Medium", category:"Cross-Cultural", title:"MCQ 34", description:"In cultural neuropsychiatry, 'Ataque de nervios' is most closely linked to activation in which autonomic system?", options:[{text:"Sympathetic Autonomic Hyperarousal",correct:true,explanation:"Features intense heart palpitations, trembling, and dyspnea."},{text:"Enteric Nervous System",correct:false,explanation:"Digestion control."},{text:"Somatic Motor System",correct:false,explanation:"Voluntary motor movement."},{text:"Parasympathetic Depression",correct:false,explanation:"Reflects hyperarousal rather than vagal tone."}]},
  { id:"M35", difficulty:"Medium", category:"Autonomic", title:"MCQ 35", description:"Horner's syndrome (ptosis, miosis, anhidrosis) is caused by disruption of:", options:[{text:"Sympathetic Chain Pathway",correct:true,explanation:"Disrupts ocular sympathetic supply."},{text:"Edinger-Westphal Nucleus",correct:false,explanation:"Parasympathetic outflow."},{text:"Oculomotor Nerve Motor Core",correct:false,explanation:"Causes mydriasis and ptosis."},{text:"Trigeminal Ophthalmic Division",correct:false,explanation:"Sensory loss."}]},
  { id:"M36", difficulty:"Medium", category:"Neurology", title:"MCQ 36", description:"Which structural abnormality is characteristic of Huntington's disease on neuroimaging?", options:[{text:"Caudate Nucleus Atrophy & Ventricular Expansion",correct:true,explanation:"Loss of medium spiny neurons flattens caudate heads."},{text:"Hippocampal Sclerosis",correct:false,explanation:"Temporal lobe epilepsy."},{text:"Substantia Nigra Depigmentation",correct:false,explanation:"Parkinson's disease."},{text:"Cerebellar Tonsillar Ectopia",correct:false,explanation:"Chiari malformation."}]},

  // HARD LEVEL (37-50)
  { id:"M37", difficulty:"Hard", category:"Microanatomy", title:"MCQ 37", description:"Which cerebellar cortex cells provide the sole inhibitory output from cerebellar cortex to deep nuclei?", options:[{text:"Purkinje Cells",correct:true,explanation:"GABAergic Purkinje cells supply sole output of cerebellar cortex."},{text:"Granule Cells",correct:false,explanation:"Excitatory cells using glutamate."},{text:"Basket Cells",correct:false,explanation:"Inhibitory interneurons."},{text:"Golgi Cells",correct:false,explanation:"Inhibitory feedback interneurons."}]},
  { id:"M38", difficulty:"Hard", category:"Vascular", title:"MCQ 38", description:"Wallenberg Syndrome (Lateral Medullary Syndrome) is most commonly caused by occlusion of which artery?", options:[{text:"Posterior Inferior Cerebellar Artery (PICA)",correct:true,explanation:"Supplies lateral medulla."},{text:"Anterior Spinal Artery",correct:false,explanation:"Causes medial medullary syndrome."},{text:"Basilar Artery",correct:false,explanation:"Pontine stroke."},{text:"Middle Cerebral Artery",correct:false,explanation:"Cortical stroke."}]},
  { id:"M39", difficulty:"Hard", category:"Electrophysiology", title:"MCQ 39", description:"Long-Term Potentiation (LTP) in CA1 hippocampal pyramidal cells relies on expulsion of which ion block from NMDA receptors?", options:[{text:"Magnesium (Mg2+)",correct:true,explanation:"Depolarization unblocks the Mg2+ plug, allowing Ca2+ influx."},{text:"Sodium (Na+)",correct:false,explanation:"Involved in depolarizing action potential."},{text:"Potassium (K+)",correct:false,explanation:"Repolarization ion."},{text:"Zinc (Zn2+)",correct:false,explanation:"Modulatory ion."}]},
  { id:"M40", difficulty:"Hard", category:"Pathway", title:"MCQ 40", description:"Fibers of the Dorsal Column-Medial Lemniscus pathway decussate at which level?", options:[{text:"Internal Arcuate Fibers in Lower Medulla",correct:true,explanation:"Second-order neurons decussate as internal arcuate fibers."},{text:"Anterior White Commissure of Spinal Cord",correct:false,explanation:"Spinothalamic decussation site."},{text:"Pons Varolii",correct:false,explanation:"Higher level."},{text:"Midbrain Decussation",correct:false,explanation:"Superior cerebellar peduncle decussation."}]},
  { id:"M41", difficulty:"Hard", category:"Neuropsychiatry", title:"MCQ 41", description:"Capgras delusion (believing close relatives are impostors) is hypothesized to stem from disconnect between visual cortex and:", options:[{text:"Amygdala / Limbic Affective Circuitry",correct:true,explanation:"Visual recognition intact, but lack of affective emotional resonance creates impression of impostor."},{text:"Primary Auditory Cortex",correct:false,explanation:"Unrelated to facial affect."},{text:"Basal Ganglia Striatum",correct:false,explanation:"Motor control."},{text:"Cerebellum",correct:false,explanation:"Motor tuning."}]},
  { id:"M42", difficulty:"Hard", category:"Thalamocortical", title:"MCQ 42", description:"Which thalamic nucleus relays auditory information from the inferior colliculus to auditory cortex?", options:[{text:"Medial Geniculate Nucleus (MGN)",correct:true,explanation:"MGN handles hearing; LGN handles vision."},{text:"Lateral Geniculate Nucleus",correct:false,explanation:"Visual relay."},{text:"Ventral Lateral Nucleus",correct:false,explanation:"Motor relay."},{text:"Pulvinar Nucleus",correct:false,explanation:"Visual attention."}]},
  { id:"M43", difficulty:"Hard", category:"Neuroendocrinology", title:"MCQ 43", description:"Magnocellular neurosecretory cells projecting to the posterior pituitary synthesize ADH and Oxytocin in which nuclei?", options:[{text:"Supraoptic and Paraventricular Nuclei",correct:true,explanation:"Synthesize vasopressin and oxytocin."},{text:"Preoptic and Arcuate Nuclei",correct:false,explanation:"GNRH / Prolactin control."},{text:"Ventromedial Hypothalamus",correct:false,explanation:"Satiety center."},{text:"Suprachiasmatic Nucleus",correct:false,explanation:"Circadian clock."}]},
  { id:"M44", difficulty:"Hard", category:"Receptors", title:"MCQ 44", description:"The tetanus toxin mechanism targets which molecular machinery inside presynaptic inhibitory interneurons?", options:[{text:"SNARE Proteins (Synaptobrevin cleavage)",correct:true,explanation:"Cleaves VAMP/Synaptobrevin, preventing GABA/Glycine release."},{text:"Voltage-gated Sodium Channels",correct:false,explanation:"Mechanism of TTX (Tetrodotoxin)."},{text:"Acetylcholinesterase",correct:false,explanation:"Target of organophosphates."},{text:"Dopamine Transporter (DAT)",correct:false,explanation:"Target of cocaine."}]},
  { id:"M45", difficulty:"Hard", category:"Anatomy", title:"MCQ 45", description:"Meyer's Loop carries visual information from which visual quadrant through the temporal lobe?", options:[{text:"Inferior Retina (Superior Visual Field)",correct:true,explanation:"Temporal loop damage causes 'pie in the sky' superior quadrantanopia."},{text:"Superior Retina (Inferior Visual Field)",correct:false,explanation:"Passes through parietal lobe."},{text:"Macular Field Only",correct:false,explanation:"Projections occupy central occipital pole."},{text:"Nasal Hemifields Only",correct:false,explanation:"Decussate in chiasm."}]},
  { id:"M46", difficulty:"Hard", category:"Auditory", title:"MCQ 46", description:"Which brainstem structure is the first obligate binaural processing site for sound localization?", options:[{text:"Superior Olivary Complex",correct:true,explanation:"Computes interaural time and intensity differences."},{text:"Cochlear Nuclei",correct:false,explanation:"Monaural inputs."},{text:"Inferior Colliculus",correct:false,explanation:"Higher midbrain auditory integration."},{text:"Medial Geniculate Body",correct:false,explanation:"Thalamic relay."}]},
  { id:"M47", difficulty:"Hard", category:"Neurology", title:"MCQ 47", description:"Subacute Combined Degeneration of the spinal cord (Vitamin B12 deficiency) selectively targets:", options:[{text:"Dorsal Columns and Corticospinal Tracts",correct:true,explanation:"Demyelination of posterior and lateral columns."},{text:"Anterior Horn Cells Only",correct:false,explanation:"Poliomyelitis/ALS profile."},{text:"Spinothalamic Tracts Only",correct:false,explanation:"Dissociated sensory loss."},{text:"Basal Ganglia Striatum",correct:false,explanation:"Huntington/Parkinson."}]},
  { id:"M48", difficulty:"Hard", category:"Psychopharmacology", title:"MCQ 48", description:"Antipsychotic-induced Neuroleptic Malignant Syndrome (NMS) results primarily from severe blockade of:", options:[{text:"D2 Receptors in Nigrostriatal & Hypothalamic Pathways",correct:true,explanation:"Causes hyperthermia, rigidity, and autonomic instability."},{text:"5-HT2A Serotonin Receptors",correct:false,explanation:"Target of atypical antipsychotics to decrease EPS."},{text:"Alpha-1 Adrenergic Receptors",correct:false,explanation:"Causes orthostatic hypotension."},{text:"H1 Histamine Receptors",correct:false,explanation:"Causes sedation and weight gain."}]},
  { id:"M49", difficulty:"Hard", category:"Reflexes", title:"MCQ 49", description:"The pupillary light reflex afferent arm travels via CN II, while the efferent arm originates in which midbrain nucleus?", options:[{text:"Edinger-Westphal Nucleus",correct:true,explanation:"Parasympathetic preganglionic core of CN III."},{text:"Superior Salivatory Nucleus",correct:false,explanation:"CN VII lacrimal/salivary."},{text:"Nucleus Ambiguus",correct:false,explanation:"CN IX/X motor."},{text:"Chief Sensory Nucleus of V",correct:false,explanation:"Trigeminal touch."}]},
  { id:"M50", difficulty:"Hard", category:"Pathology", title:"MCQ 50", description:"Bilateral lesions of the Medial Longitudinal Fasciculus (MLF) lead to which eye movement disorder?", options:[{text:"Internuclear Ophthalmoplegia (INO)",correct:true,explanation:"Impaired adduction of ipsilateral eye with nystagmus in abducting eye during lateral gaze."},{text:"Parinaud Syndrome",correct:false,explanation:"Dorsal midbrain syndrome affecting vertical gaze."},{text:"Opsoclonus-Myoclonus",correct:false,explanation:"Saccadic instability."},{text:"Third Nerve Palsy",correct:false,explanation:"Complete ptosis, down-and-out eye."}]}
];

// ==========================================
// 2. SIMULATOR STATE ENGINE & CONTROLLER
// ==========================================

let currentMode = 'cases'; // 'cases' or 'mcqs'
let currentDifficulty = 'all';
let filteredQuestions = [];
let currentIndex = 0;

function getActiveDataSet() {
  return currentMode === 'cases' ? clinicalCasesData : mcqQuestionsData;
}

function filterQuestionsByDifficulty() {
  const diffSelect = document.getElementById('difficulty-filter');
  currentDifficulty = diffSelect ? diffSelect.value : 'all';
  
  const rawSet = getActiveDataSet();
  if (currentDifficulty === 'all') {
    filteredQuestions = rawSet;
  } else {
    filteredQuestions = rawSet.filter(q => q.difficulty === currentDifficulty);
  }

  currentIndex = 0;
  renderCurrentQuestion();
}

function switchSimulatorMode(mode) {
  currentMode = mode;
  document.getElementById('btn-mode-cases').classList.toggle('active', mode === 'cases');
  document.getElementById('btn-mode-mcqs').classList.toggle('active', mode === 'mcqs');
  filterQuestionsByDifficulty();
}

function renderCurrentQuestion() {
  const qTracker = document.getElementById('question-tracker');
  const diffBadge = document.getElementById('difficulty-badge');
  const progressBar = document.getElementById('quiz-progress-bar');
  
  const categoryElem = document.getElementById('case-category');
  const titleElem = document.getElementById('case-title');
  const descElem = document.getElementById('case-description');
  const optionsContainer = document.getElementById('options-container');
  const feedbackBox = document.getElementById('feedback-box');
  
  if (!filteredQuestions || filteredQuestions.length === 0) {
    categoryElem.innerText = "No Questions";
    titleElem.innerText = "No items match current filter";
    descElem.innerText = "Please select another difficulty level.";
    optionsContainer.innerHTML = "";
    feedbackBox.style.display = "none";
    qTracker.innerText = "0 of 0";
    progressBar.style.width = "0%";
    return;
  }

  const q = filteredQuestions[currentIndex];

  // Update Progress & Meta Info
  qTracker.innerText = `${currentMode === 'cases' ? 'Case' : 'MCQ'} ${currentIndex + 1} of ${filteredQuestions.length}`;
  diffBadge.innerText = q.difficulty;
  diffBadge.className = `badge badge-${q.difficulty.toLowerCase()}`;
  
  const percent = ((currentIndex + 1) / filteredQuestions.length) * 100;
  progressBar.style.width = `${percent}%`;

  // Render Texts
  categoryElem.innerText = `${q.category} • ${q.id}`;
  titleElem.innerText = q.title;
  descElem.innerText = q.description;

  // Reset Feedback & Buttons
  optionsContainer.innerHTML = "";
  feedbackBox.style.display = "none";
  
  document.getElementById('prev-btn').style.display = currentIndex > 0 ? "inline-block" : "none";
  document.getElementById('next-btn').style.display = "none";

  // Render Options
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt.text;
    btn.onclick = () => handleAnswerClick(opt, btn);
    optionsContainer.appendChild(btn);
  });
}

function handleAnswerClick(selectedOption, clickedBtn) {
  const feedbackBox = document.getElementById('feedback-box');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackExplanation = document.getElementById('feedback-explanation');
  const nextBtn = document.getElementById('next-btn');

  // Disable options once selected
  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach(btn => btn.disabled = true);

  feedbackBox.style.display = "block";
  nextBtn.style.display = "inline-block";

  if (selectedOption.correct) {
    clickedBtn.classList.add('correct-btn');
    feedbackBox.className = "feedback-box success";
    feedbackTitle.innerText = "✓ Correct!";
    feedbackExplanation.innerText = selectedOption.explanation;
  } else {
    clickedBtn.classList.add('wrong-btn');
    feedbackBox.className = "feedback-box error";
    feedbackTitle.innerText = "✗ Incorrect";
    feedbackExplanation.innerText = selectedOption.explanation;
  }
}

function loadNextQuestion() {
  if (currentIndex < filteredQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
  }
}

function loadPreviousQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
  }
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  filterQuestionsByDifficulty();
});
});
