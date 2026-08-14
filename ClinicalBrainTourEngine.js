export class ClinicalBrainTourEngine {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.synth = window.speechSynthesis;
    this.isPlaying = false;
    this.currentStep = 0;
    this.tourScript = [];
  }

  loadTourScript(scriptSteps) {
    // Script format: [{ targetPos: Vector3, lookAt: Vector3, text: string, regionId: string }]
    this.tourScript = scriptSteps;
    this.currentStep = 0;
  }

  startTour() {
    if (!this.tourScript.length) return;
    this.isPlaying = true;
    this.executeStep(0);
  }

  executeStep(stepIndex) {
    if (stepIndex >= this.tourScript.length || !this.isPlaying) {
      this.isPlaying = false;
      console.log("[Tour Engine] Tour completed.");
      return;
    }

    const step = this.tourScript[stepIndex];
    this.smoothMoveCamera(step.targetPos, step.lookAt, 2000, () => {
      this.speakNarration(step.text, () => {
        // Move to next vignette step when narration finishes
        if (this.isPlaying) {
          this.currentStep++;
          setTimeout(() => this.executeStep(this.currentStep), 1000);
        }
      });
    });
  }

  smoothMoveCamera(targetPos, lookAtPos, durationMs, onComplete) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const animateCam = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      const ease = progress * (2 - progress); // Ease-out quadratic

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startTarget, lookAtPos, ease);
      this.controls.update();

      if (progress < 1.0) {
        requestAnimationFrame(animateCam);
      } else if (onComplete) {
        onComplete();
      }
    };

    requestAnimationFrame(animateCam);
  }

  speakNarration(text, onEnded) {
    if (this.synth.speaking) this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower for clinical/educational clarity
    utterance.pitch = 1.0;

    utterance.onend = () => { if (onEnded) onEnded(); };
    utterance.onerror = (err) => {
      console.error("[TTS Error]", err);
      if (onEnded) onEnded();
    };

    this.synth.speak(utterance);
  }

  stopTour() {
    this.isPlaying = false;
    if (this.synth.speaking) this.synth.cancel();
  }
}
