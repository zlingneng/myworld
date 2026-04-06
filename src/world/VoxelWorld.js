import * as THREE from 'three';
import { BLOCK_TYPES, BLOCK_DATA } from './BlockTypes.js';
import { DroppedItem } from './DroppedItem.js';
import { Animal } from './Animal.js';

export class VoxelWorld {
  constructor(scene) {
    this.scene = scene;
    this.chunkSize = 16;
    this.worldSize = { x: 200, y: 32, z: 200 }; // Enlarge world to 200x200
    this.blocks = new Uint8Array(this.worldSize.x * this.worldSize.y * this.worldSize.z);
    
    this.meshes = new Map(); // chunkKey -> Mesh
    
    // 纹理加载器
    this.textureLoader = new THREE.TextureLoader();
    this.textures = new Map();
    this.loadTextures();
    
    // 默认材质（无纹理时使用）
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.transparentMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.7 });
    
    this.droppedItems = [];
    this.animals = [];
    
    // Selection highlight
    this.selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.selectionBox = new THREE.Mesh(this.selectionGeometry, this.selectionMaterial);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.generateTerrain();
    this.spawnAnimals();
    this.updateAllChunks();
  }

  loadTextures() {
    // 加载生成的纹理
    Object.values(BLOCK_DATA).forEach(data => {
      if (data.texture) {
        const texture = this.textureLoader.load(data.texture);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        this.textures.set(data.texture, texture);
      }
    });
  }

  spawnAnimals() {
    const colors = [0xffffff, 0xffc0cb, 0x8b4513]; // White, Pink, Brown
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * this.worldSize.x);
      const z = Math.floor(Math.random() * this.worldSize.z);
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.animals.push(new Animal(this.scene, { x, y: 25, z }, color));
    }
  }

  getIndex(x, y, z) {
    if (x < 0 || x >= this.worldSize.x || y < 0 || y >= this.worldSize.y || z < 0 || z >= this.worldSize.z) {
      return -1;
    }
    return x + y * this.worldSize.x + z * this.worldSize.x * this.worldSize.y;
  }

  setBlock(x, y, z, type) {
    const idx = this.getIndex(x, y, z);
    if (idx !== -1) {
      this.blocks[idx] = type;
      this.updateChunkAt(x, y, z);
    }
  }

  getBlock(x, y, z) {
    const idx = this.getIndex(x, y, z);
    return idx === -1 ? BLOCK_TYPES.EMPTY : this.blocks[idx];
  }

  generateTerrain() {
    const waterLevel = 12;
    for (let x = 0; x < this.worldSize.x; x++) {
      for (let z = 0; z < this.worldSize.z; z++) {
        // Improved terrain with different biomes
        const noise1 = Math.sin(x * 0.1) * 3 + Math.cos(z * 0.1) * 3;
        const noise2 = Math.sin(x * 0.05) * 2 + Math.cos(z * 0.05) * 2;
        const height = Math.floor(noise1 + noise2 + 15);
        
        // Biome determination based on noise
        const biomeNoise = Math.sin(x * 0.02) + Math.cos(z * 0.02);
        let surfaceBlock = BLOCK_TYPES.GRASS;
        let subSurfaceBlock = BLOCK_TYPES.DIRT;
        
        if (biomeNoise > 0.5) {
          // Desert biome
          surfaceBlock = BLOCK_TYPES.SAND;
          subSurfaceBlock = BLOCK_TYPES.SAND;
        } else if (biomeNoise < -0.5) {
          // Forest biome (more trees)
          surfaceBlock = BLOCK_TYPES.GRASS;
          subSurfaceBlock = BLOCK_TYPES.DIRT;
        }
        
        for (let y = 0; y < this.worldSize.y; y++) {
          let type = BLOCK_TYPES.EMPTY;
          if (y < height - 3) {
            type = BLOCK_TYPES.STONE;
            // Add ores
            if (Math.random() < 0.01) type = BLOCK_TYPES.REDSTONE;
            else if (Math.random() < 0.015) type = BLOCK_TYPES.IRON;
            else if (Math.random() < 0.005) type = BLOCK_TYPES.GOLD;
            else if (Math.random() < 0.002) type = BLOCK_TYPES.EMERALD;
            else if (Math.random() < 0.001) type = BLOCK_TYPES.NETHERITE;
            else if (Math.random() < 0.003) type = BLOCK_TYPES.DIAMOND_ORE;
          } else if (y < height - 1) {
            type = subSurfaceBlock;
          } else if (y < height) {
            type = surfaceBlock;
          } else if (y < waterLevel) {
            type = BLOCK_TYPES.WATER;
          }
          this.blocks[this.getIndex(x, y, z)] = type;
        }

        // Random trees (more in forest biome)
        const treeChance = biomeNoise < -0.5 ? 0.04 : 0.02;
        if (height >= waterLevel && Math.random() < treeChance) {
          this.generateTree(x, height, z);
        }
        
        // Add wheat in plains
        if (biomeNoise > -0.2 && biomeNoise < 0.2 && height >= waterLevel && Math.random() < 0.01) {
          this.setBlockRaw(x, height, z, BLOCK_TYPES.WHEAT);
        }
      }
    }
  }

  generateTree(x, y, z) {
    const treeHeight = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < treeHeight; i++) {
      this.setBlockRaw(x, y + i, z, BLOCK_TYPES.LOG);
    }
    // Leaves
    for (let lx = -2; lx <= 2; lx++) {
      for (let ly = -2; ly <= 2; ly++) {
        for (let lz = -2; lz <= 2; lz++) {
          if (lx * lx + ly * ly + lz * lz < 6) {
            const voxX = x + lx;
            const voxY = y + treeHeight + ly;
            const voxZ = z + lz;
            if (this.getBlock(voxX, voxY, voxZ) === BLOCK_TYPES.EMPTY) {
              this.setBlockRaw(voxX, voxY, voxZ, BLOCK_TYPES.LEAVES);
            }
          }
        }
      }
    }
  }

  setBlockRaw(x, y, z, type) {
    const idx = this.getIndex(x, y, z);
    if (idx !== -1) {
      this.blocks[idx] = type;
    }
  }

  updateAllChunks() {
    for (let cx = 0; cx < this.worldSize.x / this.chunkSize; cx++) {
      for (let cy = 0; cy < this.worldSize.y / this.chunkSize; cy++) {
        for (let cz = 0; cz < this.worldSize.z / this.chunkSize; cz++) {
          this.generateChunkMesh(cx, cy, cz);
        }
      }
    }
  }

  updateChunkAt(x, y, z) {
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    const cz = Math.floor(z / this.chunkSize);
    this.generateChunkMesh(cx, cy, cz);
    
    // Update neighbors if on edge
    if (x % this.chunkSize === 0) this.generateChunkMesh(cx - 1, cy, cz);
    if (x % this.chunkSize === this.chunkSize - 1) this.generateChunkMesh(cx + 1, cy, cz);
    if (y % this.chunkSize === 0) this.generateChunkMesh(cx, cy - 1, cz);
    if (y % this.chunkSize === this.chunkSize - 1) this.generateChunkMesh(cx, cy + 1, cz);
    if (z % this.chunkSize === 0) this.generateChunkMesh(cx, cy, cz - 1);
    if (z % this.chunkSize === this.chunkSize - 1) this.generateChunkMesh(cx, cy, cz + 1);
  }

  generateChunkMesh(cx, cy, cz) {
    const key = `${cx},${cy},${cz}`;
    if (cx < 0 || cy < 0 || cz < 0 || 
        cx >= this.worldSize.x / this.chunkSize || 
        cy >= this.worldSize.y / this.chunkSize || 
        cz >= this.worldSize.z / this.chunkSize) return;

    // 按材质分组
    const materialGroups = new Map();

    const startX = cx * this.chunkSize;
    const startY = cy * this.chunkSize;
    const startZ = cz * this.chunkSize;

    for (let x = 0; x < this.chunkSize; x++) {
      for (let y = 0; y < this.chunkSize; y++) {
        for (let z = 0; z < this.chunkSize; z++) {
          const voxX = startX + x;
          const voxY = startY + y;
          const voxZ = startZ + z;
          const type = this.getBlock(voxX, voxY, voxZ);

          if (type !== BLOCK_TYPES.EMPTY) {
            const data = BLOCK_DATA[type];
            const materialKey = data.texture || 'default';
            
            if (!materialGroups.has(materialKey)) {
              materialGroups.set(materialKey, {
                positions: [],
                normals: [],
                colors: [],
                uvs: [],
                indices: [],
                transparent: data.transparent || false,
                data: data
              });
            }

            const group = materialGroups.get(materialKey);
            const color = new THREE.Color(data.color);

            // Check 6 faces
            const neighbors = [
              { dir: [1, 0, 0], pos: [1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1], normal: [1, 0, 0], uvs: [1, 0, 1, 1, 0, 1, 0, 0] },
              { dir: [-1, 0, 0], pos: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0], normal: [-1, 0, 0], uvs: [0, 0, 0, 1, 1, 1, 1, 0] },
              { dir: [0, 1, 0], pos: [0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0], normal: [0, 1, 0], uvs: [0, 1, 1, 1, 1, 0, 0, 0] },
              { dir: [0, -1, 0], pos: [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1], normal: [0, -1, 0], uvs: [0, 0, 1, 0, 1, 1, 0, 1] },
              { dir: [0, 0, 1], pos: [0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1], normal: [0, 0, 1], uvs: [0, 0, 1, 0, 1, 1, 0, 1] },
              { dir: [0, 0, -1], pos: [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0], normal: [0, 0, -1], uvs: [1, 0, 0, 0, 0, 1, 1, 1] },
            ];

            for (const { dir, pos, normal, uvs } of neighbors) {
              const nx = voxX + dir[0];
              const ny = voxY + dir[1];
              const nz = voxZ + dir[2];
              
              const neighborType = this.getBlock(nx, ny, nz);
              if (neighborType === BLOCK_TYPES.EMPTY || (BLOCK_DATA[neighborType]?.transparent && !data.transparent)) {
                const ndx = group.positions.length / 3;
                for (let i = 0; i < 4; i++) {
                  group.positions.push(voxX + pos[i * 3], voxY + pos[i * 3 + 1], voxZ + pos[i * 3 + 2]);
                  group.normals.push(...normal);
                  group.colors.push(color.r, color.g, color.b);
                  group.uvs.push(uvs[i * 2], uvs[i * 2 + 1]);
                }
                group.indices.push(ndx, ndx + 1, ndx + 2, ndx, ndx + 2, ndx + 3);
              }
            }
          }
        }
      }
    }

    const updateMesh = (k, data, material) => {
      if (this.meshes.has(k)) {
        this.scene.remove(this.meshes.get(k));
        this.meshes.get(k).geometry.dispose();
        this.meshes.delete(k);
      }
      if (data.positions.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
        geometry.setIndex(data.indices);
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.meshes.set(k, mesh);
      }
    };

    // 创建带纹理的材质
    const createTexturedMaterial = (data) => {
      if (data.texture && this.textures.has(data.texture)) {
        const texture = this.textures.get(data.texture);
        return new THREE.MeshLambertMaterial({
          map: texture,
          vertexColors: true,
          transparent: data.transparent || false,
          opacity: data.transparent ? 0.7 : 1
        });
      }
      return data.transparent ? this.transparentMaterial : this.material;
    };

    // 为每个材质组创建网格
    materialGroups.forEach((group, materialKey) => {
      const material = createTexturedMaterial(group.data);
      const meshKey = `${key}_${materialKey}`;
      updateMesh(meshKey, group, material);
    });
  }

  createParticles(pos, color) {
    const particleCount = 10;
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshLambertMaterial({ color });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
      this.scene.add(particle);
      
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      
      const animate = () => {
        particle.position.add(vel);
        vel.y -= 0.005; // gravity
        particle.scale.multiplyScalar(0.95);
        if (particle.scale.x > 0.01) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      };
      animate();
    }
  }

  update(delta, player) {
    // Update dropped items
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      if (item.update(delta, this, player.camera.position)) {
        player.inventory[item.type] = (player.inventory[item.type] || 0) + 1;
        item.dispose();
        this.droppedItems.splice(i, 1);
      }
    }

    // Update animals
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const animal = this.animals[i];
      animal.update(delta, this);
      
      if (animal.hp <= 0) {
        // Drop meat
        this.droppedItems.push(new DroppedItem(this.scene, animal.group.position, BLOCK_TYPES.MEAT));
        this.scene.remove(animal.group);
        this.animals.splice(i, 1);
      }
    }
  }

  updateSelection(intersect) {
    if (intersect) {
      const pos = intersect.point.clone().add(intersect.face.normal.clone().multiplyScalar(-0.5));
      this.selectionBox.position.set(
        Math.floor(pos.x) + 0.5,
        Math.floor(pos.y) + 0.5,
        Math.floor(pos.z) + 0.5
      );
      this.selectionBox.visible = true;
    } else {
      this.selectionBox.visible = false;
    }
  }
}
