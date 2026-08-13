// 7. Transition from Cover Page to 3D Viewer (Fail-Safe Vanilla JS)
const launchBtn = document.getElementById("btn-launch-explorer");
const heroSection = document.getElementById("hero-cover");
const infoOverlay = document.getElementById("info-overlay");

if (launchBtn && heroSection) {
  launchBtn.addEventListener("click", () => {
    console.log("Launch button clicked!");

    // 1. Instantly hide the cover page overlay
    heroSection.style.opacity = "0";
    heroSection.style.pointerEvents = "none";

    setTimeout(() => {
      heroSection.style.display = "none";
      if (infoOverlay) infoOverlay.classList.remove("hidden");
    }, 500); // 0.5s match for CSS transition

    // 2. Force Three.js to resize and render full-screen
    if (typeof renderer !== 'undefined' && typeof camera !== 'undefined') {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  });
} else {
  console.error("Could not find launch button (#btn-launch-explorer) or hero section (#hero-cover) in HTML!");
}
