import * as THREE from 'three';

// --- Custom Vertex & Fragment Shader for EEG Dynamics ---
export const EEGSignalShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uFrequencyHz: { value: 10.0 }, // Frequency in Hertz (e.g., 10 Hz Alpha)
    uAmplitude: { value: 0.8 },
    uWaveSpeed: { value: 3.0 },
    uBaseColor: { value: new THREE.Color(0x1a2b4c) }, // Resting cortical color
    uPulseColor: { value: new THREE.Color(0x00ffcc) }  // Signal field glow
  },
  vertexShader: `
    uniform float uTime;
    uniform float uFrequencyHz;
    uniform float uWaveSpeed;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vWaveIntensity;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;

      // Calculate spatial traveling wave across surface coordinates
      float spatialPhase = length(position.xz) * 0.15;
      float temporalPhase = uTime * uFrequencyHz * 6.28318 * 0.1; // 2*PI scale
      
      vWaveIntensity = sin(spatialPhase * uWaveSpeed - temporalPhase);

      // Subtle surface vertex displacement simulating cortical field expansion
      vec3 displacedPosition = position + normal * (vWaveIntensity * 0.08);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uPulseColor;
    uniform float uAmplitude;
    varying vec3 vNormal;
    varying float vWaveIntensity;

    void main() {
      // Normalize wave intensity to [0, 1]
      float normalizedWave = (vWaveIntensity + 1.0) * 0.5;
      
      // Fresnel effect for rim glowing
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

      // Interpolate surface color between resting state and activation pulse
      vec3 finalColor = mix(uBaseColor, uPulseColor, normalizedWave * uAmplitude);
      finalColor += uPulseColor * fresnel * 0.4; // Add cortical boundary glow

      gl_FragColor = vec4(finalColor, 0.9);
    }
  `
};

// Preset Frequency State Helper
export function setEEGPreset(material, mode) {
  const presets = {
    DELTA: { freq: 2.0, color: 0x3b82f6 },      // Deep Sleep (2 Hz)
    THETA: { freq: 6.0, color: 0xa855f7 },      // Meditation/Drowsy (6 Hz)
    ALPHA: { freq: 10.0, color: 0x10b981 },     // Relaxed/Resting (10 Hz)
    BETA: { freq: 20.0, color: 0xf59e0b },      // Active Focus (20 Hz)
    SPIKE_WAVE: { freq: 3.0, color: 0xef4444 }  // Absence Seizure Discharge (3 Hz)
  };

  const selected = presets[mode] || presets.ALPHA;
  material.uniforms.uFrequencyHz.value = selected.freq;
  material.uniforms.uPulseColor.value.setHex(selected.color);
}
