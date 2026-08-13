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
});
