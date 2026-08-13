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
