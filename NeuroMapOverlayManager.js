/**
 * NeuroMapOverlayManager
 * Handles Network Toggles & Reverse Symptom Lookup in Three.js
 */
export class NeuroMapOverlayManager {
  constructor(threeScene, data) {
    this.scene = threeScene; // Three.js Scene reference
    this.data = data;       // Parsed neuromap_data.json
    
    this.meshMap = new Map(); // Fast lookup: meshId -> THREE.Mesh
    this.activeMode = 'ALL';  // 'ALL' | 'NETWORK' | 'SYMPTOM'
    
    // Default material aesthetic settings
    this.defaultColor = 0x8899a6;
    this.dimmedOpacity = 0.15;
    
    this._cacheMeshes();
  }

  /**
   * Cache scene meshes matching region meshIds
   */
  _cacheMeshes() {
    this.data.regions.forEach(region => {
      const mesh = this.scene.getObjectByName(region.meshId);
      if (mesh) {
        // Store reference and preserve original material settings
        this.meshMap.set(region.id, {
          mesh: mesh,
          originalMaterial: mesh.material.clone()
        });
      }
    });
  }

  /**
   * Reset all brain regions to default/healthy visual state
   */
  resetVisuals() {
    this.activeMode = 'ALL';
    this.meshMap.forEach(({ mesh, originalMaterial }) => {
      mesh.material = originalMaterial.clone();
      mesh.material.transparent = true;
      mesh.material.opacity = 1.0;
      mesh.visible = true;
    });
  }

  /**
   * TOGGLE 1: Highlight Functional Network (e.g., DMN, Salience, CEN)
   * @param {string} networkId 
   */
  highlightNetwork(networkId) {
    const network = this.data.networks.find(n => n.id === networkId);
    if (!network) return null;

    this.activeMode = 'NETWORK';
    const networkColor = parseInt(network.color.replace('#', '0x'));

    this.meshMap.forEach(({ mesh }, regionId) => {
      const isNode = network.nodes.includes(regionId);

      if (isNode) {
        // Active node highlight
        mesh.material.transparent = false;
        mesh.material.opacity = 1.0;
        mesh.material.color.setHex(networkColor);
        mesh.material.emissive.setHex(networkColor);
        mesh.material.emissiveIntensity = 0.4;
      } else {
        // Dim background regions
        mesh.material.transparent = true;
        mesh.material.opacity = this.dimmedOpacity;
        mesh.material.emissive.setHex(0x000000);
      }
    });

    return network;
  }

  /**
   * TOGGLE 2: Reverse Lookup - Map Symptom to Anatomical Structure(s)
   * @param {string} symptomId 
   */
  highlightSymptom(symptomId) {
    const symptom = this.data.symptoms.find(s => s.id === symptomId);
    if (!symptom) return null;

    this.activeMode = 'SYMPTOM';
    
    const primarySet = new Set(symptom.primaryRegions);
    const secondarySet = new Set(symptom.secondaryRegions);

    this.meshMap.forEach(({ mesh }, regionId) => {
      if (primarySet.has(regionId)) {
        // Primary lesion focal point -> High intensity alert (Red/Coral)
        mesh.material.transparent = false;
        mesh.material.opacity = 1.0;
        mesh.material.color.setHex(0xff3344);
        mesh.material.emissive.setHex(0xff1122);
        mesh.material.emissiveIntensity = 0.6;
      } else if (secondarySet.has(regionId)) {
        // Secondary/Network nodes -> Secondary alert (Orange/Yellow)
        mesh.material.transparent = false;
        mesh.material.opacity = 0.75;
        mesh.material.color.setHex(0xffaa00);
        mesh.material.emissive.setHex(0xaa6600);
        mesh.material.emissiveIntensity = 0.3;
      } else {
        // Uninvolved anatomy
        mesh.material.transparent = true;
        mesh.material.opacity = this.dimmedOpacity;
        mesh.material.emissive.setHex(0x000000);
      }
    });

    return symptom;
  }
}
