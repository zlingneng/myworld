import * as THREE from 'three';
import { BLOCK_DATA } from '../world/BlockTypes.js';

export class DroppedItem {
  constructor(scene, pos, type) {
    this.scene = scene;
    this.type = type;
    this.geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    
    let material;
    const data = BLOCK_DATA[type];
    if (data.texture) {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(data.texture);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      material = new THREE.MeshLambertMaterial({ map: texture, color: data.color });
    } else {
      material = new THREE.MeshLambertMaterial({ color: data.color });
    }
    
    this.material = material;
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
    this.scene.add(this.mesh);
    
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      0.2,
      (Math.random() - 0.5) * 0.1
    );
    this.createdAt = Date.now();
  }

  update(delta, world, playerPos) {
    // Physics
    this.velocity.y -= 0.5 * delta;
    this.mesh.position.add(this.velocity);

    // Voxel collision
    const voxX = Math.floor(this.mesh.position.x);
    const voxY = Math.floor(this.mesh.position.y);
    const voxZ = Math.floor(this.mesh.position.z);
    
    if (world.getBlock(voxX, voxY, voxZ) !== 0) {
      this.velocity.y = 0;
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
      this.mesh.position.y = voxY + 1.15;
    }

    // Rotation
    this.mesh.rotation.y += delta * 2;

    // Magnet effect to player
    let dist = this.mesh.position.distanceTo(playerPos);
    if (dist < 3) {
      const dir = playerPos.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(delta * 5));
      // Recalculate distance after moving
      dist = this.mesh.position.distanceTo(playerPos);
    }

    return dist < 0.5; // Ready to be picked up
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
