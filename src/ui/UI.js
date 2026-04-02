import { BLOCK_DATA } from '../world/BlockTypes.js';

export class UI {
  constructor(player) {
    this.player = player;
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'toolbar';
    this.toolbar.style.position = 'absolute';
    this.toolbar.style.bottom = '20px';
    this.toolbar.style.left = '50%';
    this.toolbar.style.transform = 'translateX(-50%)';
    this.toolbar.style.display = 'flex';
    this.toolbar.style.gap = '5px';
    this.toolbar.style.padding = '10px';
    this.toolbar.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.toolbar.style.borderRadius = '5px';
    document.body.appendChild(this.toolbar);

    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.hud.style.position = 'absolute';
    this.hud.style.top = '10px';
    this.hud.style.left = '10px';
    this.hud.style.color = 'white';
    this.hud.style.fontFamily = 'monospace';
    this.hud.style.fontSize = '14px';
    document.body.appendChild(this.hud);

    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    this.crosshair.style.position = 'absolute';
    this.crosshair.style.top = '50%';
    this.crosshair.style.left = '50%';
    this.crosshair.style.width = '10px';
    this.crosshair.style.height = '10px';
    this.crosshair.style.border = '1px solid white';
    this.crosshair.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(this.crosshair);

    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.overlay.style.color = 'white';
    this.overlay.style.display = 'flex';
    this.overlay.style.flexDirection = 'column';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.fontSize = '24px';
    this.overlay.innerHTML = '<h1>Minecraft Clone</h1><p>Click to Play</p><p style="font-size: 14px">WASD: Move, Space: Jump/Swim, Left: Mine/Attack, Right: Place/Eat(Long), Wheel: Switch, E: Unlock, C: Craft Sword</p>';
    document.body.appendChild(this.overlay);

    this.initToolbar();
  }

  initToolbar() {
    const blocks = ['Grass', 'Dirt', 'Stone', 'Redstone', 'Iron', 'Gold', 'Emerald', 'Netherite', 'Log', 'Leaves', 'Water', 'Meat', 'Diamond Ore', 'Wood Sword', 'Stone Sword', 'Iron Sword', 'Diamond Sword'];
    this.slots = [];
    blocks.forEach((name, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.style.width = '40px';
      slot.style.height = '40px';
      slot.style.border = '2px solid #555';
      slot.style.backgroundColor = '#333';
      slot.style.color = 'white';
      slot.style.display = 'flex';
      slot.style.flexDirection = 'column';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
      slot.style.fontSize = '10px';
      
      const label = document.createElement('div');
      label.innerText = name[0];
      slot.appendChild(label);
      
      const count = document.createElement('div');
      count.className = 'count';
      count.style.fontSize = '8px';
      slot.appendChild(count);
      
      this.toolbar.appendChild(slot);
      this.slots.push(slot);
    });
  }

  onLock() {
    this.crosshair.style.display = 'block';
    this.overlay.style.display = 'none';
  }

  onUnlock() {
    this.crosshair.style.display = 'none';
    this.overlay.style.display = 'flex';
  }

  update() {
    const pos = this.player.camera.position;
    this.hud.innerHTML = `
      X: ${pos.x.toFixed(2)}<br>
      Y: ${pos.y.toFixed(2)}<br>
      Z: ${pos.z.toFixed(2)}<br>
      HP: ${this.player.hp}/${this.player.maxHp}<br>
      Selected: ${BLOCK_DATA[this.player.selectedBlock].name}
    `;

    this.slots.forEach((slot, i) => {
      const type = i + 1; // BLOCK_TYPES start from 1
      if (this.player.selectedBlock === type) {
        slot.style.border = '2px solid white';
        slot.style.backgroundColor = '#666';
      } else {
        slot.style.border = '2px solid #555';
        slot.style.backgroundColor = '#333';
      }
      slot.querySelector('.count').innerText = this.player.inventory[type] || 0;
    });
  }
}
