import * as THREE from 'three';
import { BLOCK_TYPES, BLOCK_DATA, CRAFTING_RECIPES } from '../world/BlockTypes.js';
import { DroppedItem } from '../world/DroppedItem.js';
import { Sound } from '../ui/Sound.js';

export class Player {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;
    this.sound = new Sound();
    this.hp = 20;
    this.maxHp = 20;
    
    // Hand and Held Item
    this.handGroup = new THREE.Group();
    this.camera.add(this.handGroup);
    this.handGroup.position.set(0.5, -0.5, -0.5); // Position in front of camera
    
    const armGeo = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 }); // Skin color
    this.arm = new THREE.Mesh(armGeo, armMat);
    this.handGroup.add(this.arm);
    
    this.heldItem = null;
    this.currentHeldBlock = null;
    this.attackAnimTimer = 0;
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 5;
    this.jumpForce = 8;
    this.gravity = 25;
    this.height = 1.8;
    this.radius = 0.4;
    this.onGround = false;
    this.inWater = false;

    this.keys = {};
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    // Initial position
    this.camera.position.set(24, 25, 24);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(0, 0);
    this.selectedBlock = BLOCK_TYPES.GRASS;
    this.inventory = {
      [BLOCK_TYPES.GRASS]: 64,
      [BLOCK_TYPES.DIRT]: 64,
      [BLOCK_TYPES.STONE]: 64,
      [BLOCK_TYPES.REDSTONE]: 64,
      [BLOCK_TYPES.IRON]: 64,
      [BLOCK_TYPES.GOLD]: 64,
      [BLOCK_TYPES.EMERALD]: 64,
      [BLOCK_TYPES.NETHERITE]: 64,
      [BLOCK_TYPES.LOG]: 64,
      [BLOCK_TYPES.LEAVES]: 64,
      [BLOCK_TYPES.WATER]: 64,
      [BLOCK_TYPES.MEAT]: 0,
    };

    this.lastClickTime = 0;
    this.clickDelay = 300; // 300ms for double click

    this.isEating = false;
    this.eatTimer = 0;
    this.eatDuration = 1.0; // 1 second to eat
    this.lastEatSoundTime = 0;

    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('wheel', (e) => this.onWheel(e));
  }

  onMouseDown(e) {
    if (document.pointerLockElement !== this.domElement) return;
    
    const now = Date.now();
    const isDoubleClick = (now - this.lastClickTime < this.clickDelay) && (e.button === 0);
    this.lastClickTime = now;

    // Initiate eating on right-click
    if (e.button === 2 && BLOCK_DATA[this.selectedBlock]?.edible) {
      if (this.inventory[this.selectedBlock] > 0) {
        this.isEating = true;
        this.eatTimer = 0;
        this.lastEatSoundTime = 0;
        return;
      }
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.world.scene.children);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      // Only interact if within distance
      if (intersect.distance > 5) return;

      const pos = intersect.point.clone().add(intersect.face.normal.clone().multiplyScalar(-0.5));
      const placePos = intersect.point.clone().add(intersect.face.normal.clone().multiplyScalar(0.5));
      
      const voxX = Math.floor(pos.x);
      const voxY = Math.floor(pos.y);
      const voxZ = Math.floor(pos.z);
      
      const placeX = Math.floor(placePos.x);
      const placeY = Math.floor(placePos.y);
      const placeZ = Math.floor(placePos.z);

      if (isDoubleClick || e.button === 2) { // Double click or Right click: Place
        if (this.inventory[this.selectedBlock] > 0) {
          this.world.setBlock(placeX, placeY, placeZ, this.selectedBlock);
          this.world.createParticles({ x: placeX, y: placeY, z: placeZ }, BLOCK_DATA[this.selectedBlock].color);
          this.inventory[this.selectedBlock]--;
          this.sound.playPlace();
          if (this.network) this.network.broadcastBlockUpdate(placeX, placeY, placeZ, this.selectedBlock);
        }
      } else if (e.button === 0) { // Left click: Mine or Attack
        this.attackAnimTimer = 0.2; // Start animation

        // Check if hitting an animal
        let hitAnimal = false;
        const isCritical = !this.onGround && this.velocity.y < 0 && !this.inWater;
        
        const heldData = BLOCK_DATA[this.selectedBlock];
        const baseDamage = heldData?.damage || 1;
        const finalDamage = isCritical ? baseDamage * 2 : baseDamage;
        
        for (const animal of this.world.animals) {
          const dist = animal.group.position.distanceTo(intersect.point);
          if (dist < 1.5) { // Simple sphere collision for animal
            animal.takeDamage(finalDamage);
            if (isCritical) {
              console.log(`[Player] Critical Hit! ${finalDamage} Damage`);
              this.world.createParticles(animal.group.position, 0xffffff); // Critical particles
            }
            hitAnimal = true;
            break;
          }
        }

        if (!hitAnimal) {
          const type = this.world.getBlock(voxX, voxY, voxZ);
          if (type !== BLOCK_TYPES.EMPTY && type !== BLOCK_TYPES.WATER) {
            this.world.createParticles({ x: voxX, y: voxY, z: voxZ }, BLOCK_DATA[type].color);
            this.world.setBlock(voxX, voxY, voxZ, BLOCK_TYPES.EMPTY);
            this.world.droppedItems.push(new DroppedItem(this.world.scene, { x: voxX, y: voxY, z: voxZ }, type));
            this.sound.playBreak();
            if (this.network) this.network.broadcastBlockUpdate(voxX, voxY, voxZ, BLOCK_TYPES.EMPTY);
          }
        }
      }
    }
  }

  onMouseUp(e) {
    if (e.button === 2) {
      this.isEating = false;
      this.eatTimer = 0;
    }
  }

  onWheel(e) {
    if (document.pointerLockElement !== this.domElement) return;
    const types = Object.values(BLOCK_TYPES).filter(t => t !== BLOCK_TYPES.EMPTY);
    let idx = types.indexOf(this.selectedBlock);
    if (e.deltaY > 0) idx = (idx + 1) % types.length;
    else idx = (idx - 1 + types.length) % types.length;
    this.selectedBlock = types[idx];
    
    // Stop eating if selection changes
    this.isEating = false;
    this.eatTimer = 0;
  }

  update(delta) {
    this.checkWater();
    this.applyGravity(delta);
    this.handleMovement(delta);
    this.checkCollisions(delta);
    this.updateRaycasting();
    this.updateEating(delta);
    this.updateHeldItem();
    this.updateArmAnimation(delta);
  }

  updateHeldItem() {
    if (this.currentHeldBlock === this.selectedBlock) return;
    this.currentHeldBlock = this.selectedBlock;

    if (this.heldItem) {
      this.handGroup.remove(this.heldItem);
      this.heldItem.geometry.dispose();
      this.heldItem.material.dispose();
      this.heldItem = null;
    }

    const data = BLOCK_DATA[this.selectedBlock];
    if (data) {
      const isSword = data.name.includes('Sword');
      const geo = isSword ? new THREE.BoxGeometry(0.1, 0.8, 0.1) : new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mat = new THREE.MeshLambertMaterial({ color: data.color });
      this.heldItem = new THREE.Mesh(geo, mat);
      
      if (isSword) {
        this.heldItem.position.set(0, 0.4, -0.4);
        this.heldItem.rotation.x = -Math.PI / 4;
      } else {
        this.heldItem.position.set(0, 0.2, -0.3);
      }
      
      this.handGroup.add(this.heldItem);
    }
  }

  updateArmAnimation(delta) {
    // Simple bobbing
    const bob = Math.sin(Date.now() * 0.005) * 0.02;
    this.handGroup.position.y = -0.5 + bob;
    
    // Attack animation
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= delta;
      this.handGroup.rotation.x = -Math.sin(this.attackAnimTimer * 10) * 0.5;
    } else {
      this.handGroup.rotation.x = 0;
    }
  }

  tryCraft() {
    for (const recipe of CRAFTING_RECIPES) {
      let canCraft = true;
      for (const [type, count] of Object.entries(recipe.ingredients)) {
        if ((this.inventory[type] || 0) < count) {
          canCraft = false;
          break;
        }
      }

      if (canCraft) {
        // Check if already have the sword
        if (this.inventory[recipe.result] > 0) continue;

        // Consume ingredients
        for (const [type, count] of Object.entries(recipe.ingredients)) {
          this.inventory[type] -= count;
        }
        // Add result
        this.inventory[recipe.result] = 1;
        this.selectedBlock = recipe.result;
        console.log(`[Crafting] Crafted ${BLOCK_DATA[recipe.result].name}`);
        this.sound.playPlace(); // Reuse place sound for crafting
        break;
      }
    }
  }

  updateEating(delta) {
    if (this.isEating && BLOCK_DATA[this.selectedBlock]?.edible && this.inventory[this.selectedBlock] > 0) {
      this.eatTimer += delta;

      // Play sound every 200ms
      const now = Date.now();
      if (now - this.lastEatSoundTime > 200) {
        this.sound.playEat();
        this.lastEatSoundTime = now;
      }

      if (this.eatTimer >= this.eatDuration) {
        // Finished eating
        this.inventory[this.selectedBlock]--;
        this.hp = Math.min(this.maxHp, this.hp + 2);
        this.isEating = false;
        this.eatTimer = 0;
        console.log(`[Player] Finished eating meat. HP: ${this.hp}`);
      }
    } else {
      this.isEating = false;
      this.eatTimer = 0;
    }
  }

  checkWater() {
    const feetPos = this.camera.position.clone();
    feetPos.y -= this.height;
    const headPos = this.camera.position.clone();
    
    const blockAtFeet = this.world.getBlock(Math.floor(feetPos.x), Math.floor(feetPos.y), Math.floor(feetPos.z));
    const blockAtHead = this.world.getBlock(Math.floor(headPos.x), Math.floor(headPos.y), Math.floor(headPos.z));
    
    this.inWater = (blockAtFeet === BLOCK_TYPES.WATER || blockAtHead === BLOCK_TYPES.WATER);
  }

  updateRaycasting() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.world.scene.children);
    if (intersects.length > 0) {
      this.world.updateSelection(intersects[0]);
    } else {
      this.world.updateSelection(null);
    }
  }

  handleMovement(delta) {
    this.direction.set(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    if (this.keys['KeyW']) this.direction.add(forward);
    if (this.keys['KeyS']) this.direction.sub(forward);
    if (this.keys['KeyA']) this.direction.sub(right);
    if (this.keys['KeyD']) this.direction.add(right);

    if (this.keys['KeyE']) {
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock();
      }
    }

    if (this.keys['KeyC']) {
      this.tryCraft();
    }

    const currentSpeed = this.inWater ? this.speed * 0.5 : this.speed;

    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.velocity.x = this.direction.x * currentSpeed;
      this.velocity.z = this.direction.z * currentSpeed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    if (this.keys['Space']) {
      if (this.inWater) {
        this.velocity.y = 4; // Swim up
      } else if (this.onGround) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }
    }
  }

  applyGravity(delta) {
    if (this.inWater) {
      this.velocity.y -= 2 * delta; // Much slower sinking
      if (this.velocity.y < -2) this.velocity.y = -2; // Terminal velocity in water
    } else if (!this.onGround) {
      this.velocity.y -= this.gravity * delta;
    }
  }

  checkCollisions(delta) {
    const nextPos = this.camera.position.clone().add(this.velocity.clone().multiplyScalar(delta));
    
    // Simple voxel collision
    const feetY = Math.floor(nextPos.y - this.height + 0.1);
    const headY = Math.floor(nextPos.y + 0.1);
    const centerX = Math.floor(nextPos.x);
    const centerZ = Math.floor(nextPos.z);

    // Ground check
    const blockBelow = this.world.getBlock(centerX, feetY, centerZ);
    const isSolidBelow = blockBelow !== BLOCK_TYPES.EMPTY && BLOCK_DATA[blockBelow]?.solid;
    
    if (isSolidBelow) {
      this.velocity.y = 0;
      this.camera.position.y = feetY + 1 + this.height - 0.1;
      this.onGround = true;
    } else {
      this.onGround = false;
      this.camera.position.y = nextPos.y;
    }

    // Horizontal collision (simplified)
    const checkSolid = (x, y, z) => {
      const type = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
      return type !== BLOCK_TYPES.EMPTY && BLOCK_DATA[type]?.solid;
    };

    const blockX = checkSolid(nextPos.x + (this.velocity.x > 0 ? this.radius : -this.radius), this.camera.position.y - 1, centerZ);
    if (!blockX) {
      this.camera.position.x = nextPos.x;
    } else {
      this.velocity.x = 0;
    }

    const blockZ = checkSolid(centerX, this.camera.position.y - 1, nextPos.z + (this.velocity.z > 0 ? this.radius : -this.radius));
    if (!blockZ) {
      this.camera.position.z = nextPos.z;
    } else {
      this.velocity.z = 0;
    }
  }
}
