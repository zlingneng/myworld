import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { VoxelWorld } from './world/VoxelWorld.js';
import { Player } from './player/Player.js';
import { UI } from './ui/UI.js';
import { Network } from './network/Network.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.FogExp2(0x87CEEB, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 0.5).normalize();
scene.add(directionalLight);

const world = new THREE.Group();
scene.add(world);

const voxelWorld = new VoxelWorld(world);
const player = new Player(camera, renderer.domElement, voxelWorld);
scene.add(camera); // Ensure camera is in scene for its children (arm) to be rendered
const ui = new UI(player);
const network = new Network(player, voxelWorld);
player.network = network; // Pass network to player to broadcast changes

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener('click', () => {
  if (!controls.isLocked) {
    controls.lock();
  }
});

controls.addEventListener('lock', () => {
  ui.onLock();
});

controls.addEventListener('unlock', () => {
  ui.onUnlock();
});

function animate() {
  requestAnimationFrame(animate);
  const delta = 0.016; // 60fps
  player.update(delta);
  voxelWorld.update(delta, player);
  network.update(delta);
  renderer.render(scene, camera);
  ui.update();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
