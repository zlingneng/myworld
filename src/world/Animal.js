import * as THREE from 'three';

export class Animal {
  constructor(scene, pos, color = 0xffffff) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Simple blocky animal (like a sheep/pig)
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    this.group.add(body);
    
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0.6, 0.4);
    this.group.add(head);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(
        (i < 2 ? 0.2 : -0.2),
        0.15,
        (i % 2 === 0 ? 0.25 : -0.25)
      );
      this.group.add(leg);
    }
    
    this.group.position.set(pos.x, pos.y, pos.z);
    this.scene.add(this.group);
    
    this.hp = 20;
    this.maxHp = 20;
    this.velocity = new THREE.Vector3();
    this.targetRotation = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.damageTimer = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.damageTimer = 0.2; // Flash red for 0.2s
    this.velocity.y = 3; // Jump a bit
    return this.hp <= 0;
  }

  update(delta, world) {
    // Damage feedback
    if (this.damageTimer > 0) {
      this.damageTimer -= delta;
      this.group.children.forEach(child => {
        if (child.material) child.material.emissive.setHex(0xff0000);
      });
    } else {
      this.group.children.forEach(child => {
        if (child.material) child.material.emissive.setHex(0x000000);
      });
    }

    this.stateTimer -= delta;
    if (this.stateTimer <= 0) {
      this.state = Math.random() < 0.5 ? 'idle' : 'walk';
      this.stateTimer = 2 + Math.random() * 3;
      if (this.state === 'walk') {
        this.targetRotation = Math.random() * Math.PI * 2;
      }
    }

    if (this.state === 'walk') {
      this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.1;
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
      this.velocity.x = dir.x * 2;
      this.velocity.z = dir.z * 2;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Gravity
    this.velocity.y -= 20 * delta;
    
    const nextPos = this.group.position.clone().add(this.velocity.clone().multiplyScalar(delta));
    
    // Simple collision
    const voxX = Math.floor(nextPos.x);
    const voxY = Math.floor(nextPos.y);
    const voxZ = Math.floor(nextPos.z);
    
    if (world.getBlock(voxX, voxY, voxZ) === 0) {
      this.group.position.copy(nextPos);
    } else {
      this.velocity.y = 0;
      this.group.position.y = voxY + 1;
      // Jump if walking into a block
      if (this.state === 'walk') {
        this.velocity.y = 5;
      }
    }

    // Wrap around world (simplified game field)
    if (this.group.position.x < 0) this.group.position.x = world.worldSize.x - 1;
    if (this.group.position.x >= world.worldSize.x) this.group.position.x = 0;
    if (this.group.position.z < 0) this.group.position.z = world.worldSize.z - 1;
    if (this.group.position.z >= world.worldSize.z) this.group.position.z = 0;
  }
}
