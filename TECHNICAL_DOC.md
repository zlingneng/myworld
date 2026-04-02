# Simplified Minecraft Prototype Technical Documentation

## Overview
This project is a simplified Minecraft-like voxel engine built using **Three.js** and **Vite**. It implements a basic 3D voxel world, FPS controls, block interaction, and a basic inventory system.

## Key Features
- **Voxel World Generation**: Procedurally generated terrain using sine/cosine waves for height variation.
- **Chunk-based Meshing**: The world is divided into 16x16x16 chunks. Each chunk is meshed individually to improve performance and allow for dynamic updates.
- **FPS Controller**: Implements WASD movement, mouse look, gravity, and simple voxel-based collision detection.
- **Mining & Placing**: Left-click to mine blocks, right-click to place the selected block. Double left-click can also place blocks.
- **Eating System**: Long-press right-click while holding meat to eat. Takes 1 second and restores 2 HP.
- **Animal & Combat**: Animals have 20 HP. Normal hits deal 1 damage. Falling hits (Critical) deal 2 damage and show white particles.
- **Swimming**: Water reduces speed and gravity. Hold Space to swim up.
- **Network Framework**: A stub for network synchronization, ready to be expanded into multiplayer.

## Core Systems

### 1. Voxel World (`VoxelWorld.js`)
- **Data Storage**: Uses a `Uint8Array` to store block types in a flat array for memory efficiency.
- **Meshing Algorithm**: A face-culling approach is used. Only faces that are adjacent to `EMPTY` blocks are rendered.
- **Chunks**: The world is divided into chunks. When a block is modified, only the containing chunk and its immediate neighbors (if on the edge) are re-meshed.

### 2. Player Controller (`Player.js`)
- **Collision Detection**: Uses axis-aligned bounding box (AABB) logic against the voxel grid.
- **Interaction**: Uses `THREE.Raycaster` to detect the block the player is looking at.

### 3. Block Data (`BlockTypes.js`)
Defines the mapping between block IDs, colors, and names.
- 1: Grass
- 2: Dirt
- 3: Stone
- 4-8: Ores (Redstone, Iron, Gold, Emerald, Netherite)

## Performance
- **Meshing**: Individual chunk meshing ensures that updates take less than 100ms.
- **Rendering**: Optimized by culling internal faces, maintaining 60+ FPS on standard hardware.

## How to Run
1. `npm install`
2. `npm run dev`
3. Open the provided URL.
