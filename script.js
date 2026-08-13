document.addEventListener("DOMContentLoaded", () => {
  // 1. DOM Elements
  const container = document.getElementById("canvas-container");
  const heroSection = document.getElementById("hero-cover");
  const launchBtn = document.getElementById("btn-launch-explorer");
  const infoOverlay = document.getElementById("info-overlay");

  // 2. Three.js Core Setup
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

  // 3. Lighting Setup (Prevents black meshes)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight1.position.set(10, 20, 15);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x58a6ff, 0.8);
  dirLight2.position.set(-10, -10, -15);
  scene.add(dirLight2);

  // 4. Load 3D Brain Model & Auto-Center
  let brainMesh = null;
  const loader = new THREE.GLTFLoader();

  // CHANGE THIS PATH to match your actual 3D model filename (e.g. 'brain.glb' or 'models/brain.gltf')
  const modelPath = "brain.glb"; 

  loader.load(
    modelPath,
    (gltf) => {
      brainMesh = gltf.scene;

      // Compute bounding box to automatically frame camera onto brain center
      const box = new THREE.Box3().setFromObject(brainMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center model at origin (0,0,0)
      brainMesh.position.x += brainMesh.position.x - center.x;
      brainMesh.position.y += brainMesh.position.y - center.y;
      brainMesh.position.z += brainMesh.position.z - center.z;

      scene.add(brainMesh);

      // Adjust camera distance based on brain size
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.8;

      camera.position.set(0, maxDim * 0.2, cameraZ);
      controls.target.set(0, 0, 0);
      controls.update();

      console.log("Brain model loaded and centered successfully!");
    },
    (progress) => {
      console.log(`Loading model: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
    },
    (error) => {
      console.error("Error loading brain model from path:", modelPath, error);
    }
  );

  // 5. Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Slow auto-rotation when user isn't interacting
    if (brainMesh && !controls.state == -1) {
      brainMesh.rotation.y += 0.002;
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

  // 7. Transition from Cover Page to 3D Viewer
  launchBtn.addEventListener("click", () => {
    // Fade out cover page
    gsap.to(heroSection, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        heroSection.style.display = "none";
        infoOverlay.classList.remove("hidden");
      }
    });

    // Force canvas resize refresh
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera fly-in zoom effect
    gsap.from(camera.position, {
      z: camera.position.z * 2,
      duration: 1.5,
      ease: "power2.out"
    });
  });
});
