import { focusOnRegions } from './cameraFocusHelper.js';

// Extend NeuroMapOverlayManager class:
export class NeuroMapOverlayManager {
  // ... (previous constructor & setup code) ...

  /**
   * Highlighting a symptom and auto-animating camera to primary lesion region(s)
   */
  selectSymptomAndFocus(symptomId, camera, controls) {
    const symptom = this.highlightSymptom(symptomId);
    if (!symptom) return;

    // Retrieve primary target meshes
    const primaryMeshes = symptom.primaryRegions
      .map(id => this.meshMap.get(id)?.mesh)
      .filter(Boolean);

    if (primaryMeshes.length > 0) {
      focusOnRegions(camera, controls, primaryMeshes, {
        duration: 1.6,
        offsetMultiplier: 2.0,
        ease: "power3.inOut"
      });
    }
  }

  /**
   * Highlighting a network and auto-animating camera to encompass all network nodes
   */
  selectNetworkAndFocus(networkId, camera, controls) {
    const network = this.highlightNetwork(networkId);
    if (!network) return;

    // Retrieve all node meshes belonging to this network
    const networkMeshes = network.nodes
      .map(id => this.meshMap.get(id)?.mesh)
      .filter(Boolean);

    if (networkMeshes.length > 0) {
      focusOnRegions(camera, controls, networkMeshes, {
        duration: 2.0,
        offsetMultiplier: 2.8, // Slightly wider view to encompass full network
        ease: "power2.inOut"
      });
    }
  }
}
