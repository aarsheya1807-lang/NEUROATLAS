let scene, camera, renderer, controls;
let brainHierarchy = null;

// Multi-Tier Depth Trackers
// 1 = Skull | 2 = Meninges | 3 = Cortex Lobes | 4 = Deep Sub-regions
let currentDepth = 1; 
let activePath = [];

// Mesh Repositories
let skullMesh, meningesMesh;
let lobeMeshes = [];
let subRegionMeshes = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 7);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lighting Setup
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x6366f1, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x38bdf8, 1);
  pointLight.position.set(-5, -5, -5);
  scene.add(pointLight);

  // Load Anatomical Data
  fetch('brainData.json')
    .then(res => res.json())
    .then(data => {
      brainHierarchy = data.hierarchy;
      buildMultiTierScene();
    });

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onCanvasClick);

  animate();
}

// Build 3D Nested Geometry
function buildMultiTierScene() {
  const group = new THREE.Group();

  // TIER 1: Cranial Skull Shell
  const skullGeo = new THREE.SphereGeometry(2.3, 64, 64);
  skullGeo.scale(1, 1.1, 1.25);
  const skullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.5,
    transparent: true,
    opacity: 0.45
  });
  skullMesh = new THREE.Mesh(skullGeo, skullMat);
  skullMesh.userData = { depth: 1, name: "Cranial Skull", data: brainHierarchy };
  group.add(skullMesh);

  // TIER 2: Meninges Membrane Shell
  const meningesGeo = new THREE.SphereGeometry(2.0, 64, 64);
  meningesGeo.scale(0.98, 1.08, 1.2);
  const meningesMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.3,
    transparent: true,
    opacity: 0.65
  });
  meningesMesh = new THREE.Mesh(meningesGeo, meningesMat);
  meningesMesh.userData = { depth: 2, name: "Meninges Layer", data: brainHierarchy.children[0] };
  group.add(meningesMesh);

  // TIER 3 & 4: Cortical Lobes & Sub-regions
  const lobesData = brainHierarchy.children[0].children[0].children; // Access lobes array

  lobesData.forEach(lobe => {
    // Tier 3 Lobe Mesh
    const lobeGeo = new THREE.SphereGeometry(0.75, 32, 32);
    const lobeMat = new THREE.MeshStandardMaterial({
      color: parseInt(lobe.color),
      transparent: true,
      opacity: 0.85
    });
    const lobeMesh = new THREE.Mesh(lobeGeo, lobeMat);
    lobeMesh.position.set(lobe.position.x, lobe.position.y, lobe.position.z);
    lobeMesh.userData = { depth: 3, name: lobe.name, data: lobe };
    group.add(lobeMesh);
    lobeMeshes.push(lobeMesh);

    // Tier 4 Sub-region Nodes
    lobe.subRegions.forEach(sub => {
      const subGeo = new THREE.SphereGeometry(0.22, 24, 24);
      const subMat = new THREE.MeshStandardMaterial({
        color: 0xfff176,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6
      });
      const subMesh = new THREE.Mesh(subGeo, subMat);
      subMesh.position.set(sub.position.x, sub.position.y, sub.position.z);
      subMesh.visible = false; // Hidden until Tier 3 zoom
      subMesh.userData = { depth: 4, name: sub.name, data: sub };
      group.add(subMesh);
      subRegionMeshes.push(subMesh);
    });
  });

  scene.add(group);
}

// Raycasting Click Drill-Down Logic
function onCanvasClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  let targetMeshes = [];
  if (currentDepth === 1) targetMeshes = [skullMesh];
  else if (currentDepth === 2) targetMeshes = [meningesMesh];
  else if (currentDepth === 3) targetMeshes = lobeMeshes;
  else if (currentDepth === 4) targetMeshes = subRegionMeshes;

  const intersects = raycaster.intersectObjects(targetMeshes);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    drillDownToNextTier(clicked);
  }
}

// Advance Depth Tier
function drillDownToNextTier(clickedObject) {
  const data = clickedObject.userData.data;

  if (currentDepth === 1) {
    // Skull -> Meninges
    currentDepth = 2;
    skullMesh.material.opacity = 0.08; // Peel Skull back
    updateUI("Depth Tier 2: Protective Membranes", data.name, data.description, "Cranium > Meninges");
  } 
  else if (currentDepth === 2) {
    // Meninges -> Cortical Lobes
    currentDepth = 3;
    meningesMesh.material.opacity = 0.08; // Peel Meninges back
    updateUI("Depth Tier 3: Cortical Lobes", "Brain Parenchyma / Lobes", "Click a colored lobe (Frontal, Temporal) to drill into localized functional structures.", "Cranium > Meninges > Cortical Lobes");
  } 
  else if (currentDepth === 3) {
    // Lobe -> Sub-regions (Broca's, Wernicke's, etc.)
    currentDepth = 4;
    
    // Dim other lobes
    lobeMeshes.forEach(m => {
      if (m !== clickedObject) m.material.opacity = 0.15;
      else m.material.opacity = 0.35;
    });

    // Reveal sub-region nodes
    subRegionMeshes.forEach(s => s.visible = true);

    zoomCameraTo(clickedObject.position.x * 1.4, clickedObject.position.y * 1.4, clickedObject.position.z + 2.2);
    updateUI("Depth Tier 4: Internal Functional Circuitry", data.name, `${data.description} Click yellow nodes for DSM-5 and lesion profiles.`, `Cranium > Meninges > ${data.name}`);
  } 
  else if (currentDepth === 4) {
    // Inspect Specific Sub-Region Node
    showDeepSubDetails(data);
  }

  document.getElementById('back-btn').style.display = 'block';
}

// Display Specific Region Properties
function showDeepSubDetails(sub) {
  document.getElementById('layer-title').innerText = sub.name;
  document.getElementById('sub-details').style.display = 'block';
  document.getElementById('info-ba').innerText = sub.ba;
  document.getElementById('info-func').innerText = sub.function;
  document.getElementById('info-deficit').innerText = sub.deficit;
  document.getElementById('info-dsm').innerText = sub.dsm5;
}

// Navigate Backward
function navigateUpTier() {
  if (currentDepth === 4) {
    currentDepth = 3;
    subRegionMeshes.forEach(s => s.visible = false);
    lobeMeshes.forEach(m => m.material.opacity = 0.85);
    document.getElementById('sub-details').style.display = 'none';
    zoomCameraTo(0, 0, 7);
    updateUI("Depth Tier 3: Cortical Lobes", "Cortical Lobes", "Select a lobe to drill into sub-structures.", "Cranium > Meninges > Cortical Lobes");
  } 
  else if (currentDepth === 3) {
    currentDepth = 2;
    meningesMesh.material.opacity = 0.65;
    updateUI("Depth Tier 2: Protective Membranes", "Meninges Layer", "Click meninges to peel back membrane.", "Cranium > Meninges");
  } 
  else if (currentDepth === 2) {
    currentDepth = 1;
    skullMesh.material.opacity = 0.45;
    document.getElementById('back-btn').style.display = 'none';
    updateUI("Depth Tier 1: Outer Cranium", "Cranial Skull", "Click skull to peel outer bone.", "Cranium");
  }
}

function updateUI(badge, title, desc, path) {
  document.getElementById('tier-badge').innerText = badge;
  document.getElementById('layer-title').innerText = title;
  document.getElementById('layer-desc').innerText = desc;
  document.getElementById('breadcrumb').innerText = `Path: ${path}`;
}

function zoomCameraTo(x, y, z) {
  let steps = 0;
  function anim() {
    camera.position.x += (x - camera.position.x) * 0.1;
    camera.position.y += (y - camera.position.y) * 0.1;
    camera.position.z += (z - camera.position.z) * 0.1;
    steps++;
    if (steps < 25) requestAnimationFrame(anim);
  }
  anim();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (currentDepth === 4) {
    subRegionMeshes.forEach(s => s.rotation.y += 0.03);
  }

  renderer.render(scene, camera);
}
