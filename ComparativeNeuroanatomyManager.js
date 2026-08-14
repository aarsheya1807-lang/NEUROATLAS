import * as THREE from 'three';

export class ComparativeNeuroanatomyManager {
  constructor(cortexMesh, pfcMesh) {
    this.cortexMesh = cortexMesh;
    this.pfcMesh = pfcMesh;

    this.speciesData = {
      HUMAN: {
        name: 'Homo sapiens',
        pfcNeocortexRatio: '29%',
        scale: new THREE.Vector3(1.0, 1.0, 1.0),
        pfcRelativeScale: new THREE.Vector3(1.0, 1.0, 1.0),
        color: 0x3b82f6
      },
      PRIMATE: {
        name: 'Macaca mulatta (Macaque)',
        pfcNeocortexRatio: '17%',
        scale: new THREE.Vector3(0.65, 0.6, 0.65),
        pfcRelativeScale: new THREE.Vector3(0.7, 0.7, 0.65),
        color: 0xf59e0b
      },
      RODENT: {
        name: 'Rattus norvegicus (Rat)',
        pfcNeocortexRatio: '3%',
        scale: new THREE.Vector3(0.3, 0.25, 0.4),
        pfcRelativeScale: new THREE.Vector3(0.2, 0.2, 0.25),
        color: 0xef4444
      }
    };
  }

  transitionToSpecies(speciesKey, durationMs = 1200) {
    const data = this.speciesData[speciesKey];
    if (!data) return;

    const startScale = this.cortexMesh.scale.clone();
    const startPfcScale = this.pfcMesh.scale.clone();
    const startTime = performance.now();

    const animateScale = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      
      // Smooth ease-in-out cubic function
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Lerp main cortical structure scale
      this.cortexMesh.scale.lerpVectors(startScale, data.scale, ease);
      
      // Lerp PFC relative volumetric proportion
      this.pfcMesh.scale.lerpVectors(startPfcScale, data.pfcRelativeScale, ease);

      if (progress < 1.0) {
        requestAnimationFrame(animateScale);
      } else {
        this.updateHUDStats(data);
      }
    };

    requestAnimationFrame(animateScale);
  }

  updateHUDStats(data) {
    console.log(`[Comparative Mode] Species: ${data.name} | PFC Ratio: ${data.pfcNeocortexRatio}`);
    // Emit custom browser event for frontend UI (React/Vue/Svelte) binding
    window.dispatchEvent(new CustomEvent('speciesChanged', { detail: data }));
  }
}
