import { gsap } from 'gsap';

/**
 * Initializes the transition from the Hero Cover Page into the 3D Explorer.
 * 
 * @param {THREE.PerspectiveCamera} camera 
 * @param {THREE.WebGLRenderer} renderer 
 * @param {OrbitControls} controls 
 */
export function setupHeroTransition(camera, renderer, controls) {
  const launchBtn = document.getElementById('btn-launch-explorer');
  const heroSection = document.querySelector('.neuromap-hero');
  const explorerView = document.getElementById('explorer-view'); // Full 3D canvas container

  if (!launchBtn || !heroSection) return;

  launchBtn.addEventListener('click', () => {
    // 1. Disable launch button to prevent double-clicks
    launchBtn.disabled = true;

    // 2. Animate Hero Page fade out & slide up
    gsap.to(heroSection, {
      opacity: 0,
      y: -50,
      duration: 0.8,
      ease: 'power3.inOut',
      onComplete: () => {
        // Hide Hero from DOM flow after transition
        heroSection.style.display = 'none';

        // Reveal full 3D Explorer interface
        if (explorerView) {
          explorerView.classList.add('active');
        }

        // Re-enable orbit controls for direct user manipulation
        if (controls) {
          controls.enabled = true;
        }
      }
    });

    // 3. Update Three.js Renderer & Camera Aspect Ratio
    // Required because canvas dimensions change when switching views
    setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }, 400);

    // 4. (Optional) Dramatic GSAP Camera Fly-In Effect
    if (camera && controls) {
      // Temporarily set starting camera position further back
      gsap.fromTo(camera.position, 
        { x: 0, y: 50, z: 250 }, 
        { 
          x: 0, 
          y: 20, 
          z: 110, 
          duration: 1.8, 
          ease: 'power2.out',
          onUpdate: () => controls.update()
        }
      );
    }
  });
}
