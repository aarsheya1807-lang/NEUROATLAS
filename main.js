import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setupHeroTransition } from './heroTransition.js';

// Init Three.js Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new OrbitControls(camera, renderer.domElement);

// Disable controls initially while on Hero screen
controls.enabled = false;

// Attach transition handler
setupHeroTransition(camera, renderer, controls);
