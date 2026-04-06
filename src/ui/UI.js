import { BLOCK_DATA, BLOCK_TYPES, CRAFTING_RECIPES } from '../world/BlockTypes.js';

export class UI {
  constructor(player) {
    this.player = player;
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.draggingItem = null;
    this.draggingCount = 0;

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
    this.toolbar.style.zIndex = '10';
    document.body.appendChild(this.toolbar);

    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.hud.style.position = 'absolute';
    this.hud.style.top = '10px';
    this.hud.style.left = '10px';
    this.hud.style.color = 'white';
    this.hud.style.fontFamily = 'monospace';
    this.hud.style.fontSize = '14px';
    this.hud.style.zIndex = '10';
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
    this.crosshair.style.zIndex = '10';
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
    this.overlay.style.zIndex = '100';
    this.overlay.innerHTML = '<h1>我的世界克隆版</h1><p>点击开始游戏</p><p style="font-size: 14px">WASD: 移动, 空格: 跳跃/游泳, 左键: 挖掘/攻击, 右键: 放置/食用(长按), 滚轮: 切换物品, E: 解锁鼠标, C: 合成, I: 背包</p>';
    document.body.appendChild(this.overlay);

    this.createInventory();
    this.createCraftingUI();

    this.allBlockTypes = Object.values(BLOCK_TYPES).filter(t => t !== BLOCK_TYPES.EMPTY);
    
    this.initToolbar();

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  createInventory() {
    this.inventory = document.createElement('div');
    this.inventory.id = 'inventory';
    this.inventory.style.position = 'absolute';
    this.inventory.style.top = '50%';
    this.inventory.style.left = '50%';
    this.inventory.style.transform = 'translate(-50%, -50%)';
    this.inventory.style.backgroundColor = 'rgba(0,0,0,0.8)';
    this.inventory.style.borderRadius = '10px';
    this.inventory.style.padding = '20px';
    this.inventory.style.display = 'none';
    this.inventory.style.zIndex = '200';
    this.inventory.style.flexDirection = 'column';
    this.inventory.style.gap = '15px';

    const title = document.createElement('h2');
    title.style.color = 'white';
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.innerText = '背包';
    this.inventory.appendChild(title);

    this.inventoryGrid = document.createElement('div');
    this.inventoryGrid.style.display = 'grid';
    this.inventoryGrid.style.gridTemplateColumns = 'repeat(9, 1fr)';
    this.inventoryGrid.style.gap = '5px';
    this.inventoryGrid.style.padding = '10px';
    this.inventoryGrid.style.backgroundColor = 'rgba(0,0,0,0.3)';
    this.inventoryGrid.style.borderRadius = '5px';
    this.inventory.appendChild(this.inventoryGrid);

    const toolbarHint = document.createElement('p');
    toolbarHint.style.color = '#aaa';
    toolbarHint.style.margin = '0';
    toolbarHint.style.fontSize = '12px';
    toolbarHint.style.textAlign = 'center';
    toolbarHint.innerText = '第一行是你的快捷栏';
    this.inventory.appendChild(toolbarHint);

    this.inventorySlots = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 9; col++) {
        const slot = this.createSlot(row, col);
        this.inventoryGrid.appendChild(slot);
        this.inventorySlots.push(slot);
      }
    }

    document.body.appendChild(this.inventory);
  }

  createSlot(row, col) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    slot.style.width = '45px';
    slot.style.height = '45px';
    slot.style.border = '2px solid #555';
    slot.style.backgroundColor = '#333';
    slot.style.color = 'white';
    slot.style.display = 'flex';
    slot.style.flexDirection = 'column';
    slot.style.alignItems = 'center';
    slot.style.justifyContent = 'center';
    slot.style.fontSize = '10px';
    slot.style.cursor = 'pointer';
    slot.style.transition = 'all 0.1s';
    slot.dataset.row = row;
    slot.dataset.col = col;

    const label = document.createElement('div');
    label.className = 'slot-label';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';
    label.style.textAlign = 'center';
    slot.appendChild(label);

    const count = document.createElement('div');
    count.className = 'slot-count';
    count.style.fontSize = '10px';
    count.style.color = '#aaa';
    slot.appendChild(count);

    slot.addEventListener('mouseenter', () => {
      if (!this.inventoryOpen) return;
      slot.style.borderColor = '#888';
      slot.style.backgroundColor = '#444';
    });

    slot.addEventListener('mouseleave', () => {
      if (!this.inventoryOpen) return;
      slot.style.borderColor = '#555';
      slot.style.backgroundColor = '#333';
    });

    slot.addEventListener('click', () => this.handleSlotClick(row, col));

    return slot;
  }

  createCraftingUI() {
    this.crafting = document.createElement('div');
    this.crafting.id = 'crafting';
    this.crafting.style.position = 'absolute';
    this.crafting.style.top = '50%';
    this.crafting.style.left = '50%';
    this.crafting.style.transform = 'translate(-50%, -50%)';
    this.crafting.style.backgroundColor = 'rgba(0,0,0,0.9)';
    this.crafting.style.borderRadius = '10px';
    this.crafting.style.padding = '20px';
    this.crafting.style.display = 'none';
    this.crafting.style.zIndex = '200';
    this.crafting.style.flexDirection = 'column';
    this.crafting.style.gap = '15px';
    this.crafting.style.maxHeight = '80vh';
    this.crafting.style.overflowY = 'auto';

    const title = document.createElement('h2');
    title.style.color = 'white';
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.innerText = '合成';
    this.crafting.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.style.color = '#aaa';
    subtitle.style.margin = '0';
    subtitle.style.fontSize = '12px';
    subtitle.style.textAlign = 'center';
    subtitle.innerText = '点击配方进行合成';
    this.crafting.appendChild(subtitle);

    this.recipesContainer = document.createElement('div');
    this.recipesContainer.style.display = 'flex';
    this.recipesContainer.style.flexDirection = 'column';
    this.recipesContainer.style.gap = '10px';
    this.crafting.appendChild(this.recipesContainer);

    document.body.appendChild(this.crafting);
  }

  handleKeyDown(e) {
    if (e.code === 'KeyI') {
      if (this.craftingOpen) {
        this.toggleCrafting();
      }
      this.toggleInventory();
    } else if (e.code === 'KeyC') {
      if (this.inventoryOpen) {
        this.toggleInventory();
      }
      this.toggleCrafting();
    }
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.inventory.style.display = 'flex';
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      this.inventory.style.display = 'none';
    }
  }

  toggleCrafting() {
    this.craftingOpen = !this.craftingOpen;
    if (this.craftingOpen) {
      this.crafting.style.display = 'flex';
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      this.crafting.style.display = 'none';
    }
  }

  handleSlotClick(row, col) {
    if (!this.inventoryOpen) return;

    const slotIndex = row * 9 + col;
    const blockType = this.allBlockTypes[slotIndex] || 1;
    
    if (this.player.inventory[blockType] > 0) {
      this.player.selectedBlock = blockType;
    }
  }

  initToolbar() {
    this.slots = [];
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'toolbar-slot';
      slot.style.width = '50px';
      slot.style.height = '50px';
      slot.style.border = '2px solid #555';
      slot.style.backgroundColor = '#333';
      slot.style.color = 'white';
      slot.style.display = 'flex';
      slot.style.flexDirection = 'column';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
      slot.style.fontSize = '10px';
      slot.style.transition = 'all 0.1s';
      
      const label = document.createElement('div');
      label.className = 'label';
      label.style.fontSize = '11px';
      label.style.fontWeight = 'bold';
      slot.appendChild(label);
      
      const count = document.createElement('div');
      count.className = 'count';
      count.style.fontSize = '9px';
      count.style.color = '#ddd';
      slot.appendChild(count);
      
      this.toolbar.appendChild(slot);
      this.slots.push(slot);
    }
  }

  onLock() {
    this.crosshair.style.display = 'block';
    this.overlay.style.display = 'none';
  }

  onUnlock() {
    this.crosshair.style.display = 'none';
    if (!this.inventoryOpen && !this.craftingOpen) {
      this.overlay.style.display = 'flex';
    }
  }

  update() {
    const pos = this.player.camera.position;
    this.hud.innerHTML = `
      X: ${pos.x.toFixed(2)}<br>
      Y: ${pos.y.toFixed(2)}<br>
      Z: ${pos.z.toFixed(2)}<br>
      生命值: ${this.player.hp}/${this.player.maxHp}<br>
      选中: ${BLOCK_DATA[this.player.selectedBlock].name}<br>
      按 I: 背包 | C: 合成
    `;

    const toolbarTypes = [
      BLOCK_TYPES.GRASS,
      BLOCK_TYPES.DIRT,
      BLOCK_TYPES.STONE,
      BLOCK_TYPES.LOG,
      BLOCK_TYPES.LEAVES,
      BLOCK_TYPES.SAND,
      BLOCK_TYPES.COBBLESTONE,
      BLOCK_TYPES.BRICK,
      BLOCK_TYPES.GLASS
    ];

    this.slots.forEach((slot, i) => {
      const type = toolbarTypes[i];
      const data = BLOCK_DATA[type];
      
      if (this.player.selectedBlock === type) {
        slot.style.border = '2px solid white';
        slot.style.backgroundColor = '#555';
      } else {
        slot.style.border = '2px solid #555';
        slot.style.backgroundColor = '#333';
      }
      
      slot.querySelector('.label').innerText = data ? data.name.substring(0, 3) : '';
      slot.querySelector('.count').innerText = this.player.inventory[type] || 0;
    });

    this.updateInventorySlots();
    this.updateCraftingRecipes();
  }

  updateInventorySlots() {
    this.inventorySlots.forEach((slot, i) => {
      const type = this.allBlockTypes[i];
      const data = BLOCK_DATA[type];
      const count = this.player.inventory[type] || 0;

      if (this.player.selectedBlock === type) {
        slot.style.border = '2px solid #00ff00';
        slot.style.backgroundColor = '#444';
      } else if (count > 0) {
        slot.style.border = '2px solid #666';
        slot.style.backgroundColor = '#3a3a3a';
      } else {
        slot.style.border = '2px solid #444';
        slot.style.backgroundColor = '#2a2a2a';
      }

      slot.querySelector('.slot-label').innerText = data ? data.name.substring(0, 2) : '';
      slot.querySelector('.slot-count').innerText = count > 0 ? count : '';
    });
  }

  updateCraftingRecipes() {
    if (!this.craftingOpen) return;

    this.recipesContainer.innerHTML = '';

    CRAFTING_RECIPES.forEach((recipe, index) => {
      const recipeCard = document.createElement('div');
      recipeCard.style.display = 'flex';
      recipeCard.style.flexDirection = 'column';
      recipeCard.style.gap = '8px';
      recipeCard.style.padding = '10px';
      recipeCard.style.borderRadius = '5px';
      recipeCard.style.cursor = 'pointer';
      recipeCard.style.transition = 'all 0.2s';

      const canCraft = this.player.canCraftRecipe && this.player.canCraftRecipe(recipe);

      if (canCraft) {
        recipeCard.style.backgroundColor = 'rgba(0, 128, 0, 0.3)';
        recipeCard.style.border = '2px solid #00ff00';
      } else {
        recipeCard.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        recipeCard.style.border = '2px solid #444';
        recipeCard.style.opacity = '0.5';
      }

      const resultData = BLOCK_DATA[recipe.result];
      const resultName = document.createElement('div');
      resultName.style.color = 'white';
      resultName.style.fontWeight = 'bold';
      resultName.style.fontSize = '14px';
      resultName.innerText = `→ ${resultData ? resultData.name : 'Unknown'}`;
      recipeCard.appendChild(resultName);

      const ingredientsDiv = document.createElement('div');
      ingredientsDiv.style.display = 'flex';
      ingredientsDiv.style.flexWrap = 'wrap';
      ingredientsDiv.style.gap = '5px';

      for (const [type, count] of Object.entries(recipe.ingredients)) {
        const ingredient = document.createElement('div');
        ingredient.style.padding = '3px 8px';
        ingredient.style.borderRadius = '3px';
        ingredient.style.fontSize = '12px';
        
        const data = BLOCK_DATA[type];
        const hasEnough = (this.player.inventory[type] || 0) >= count;
        
        if (hasEnough) {
          ingredient.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
          ingredient.style.color = '#00ff00';
        } else {
          ingredient.style.backgroundColor = 'rgba(128, 0, 0, 0.5)';
          ingredient.style.color = '#ff6666';
        }
        
        ingredient.innerText = `${data ? data.name : 'Unknown'} x${count} (${this.player.inventory[type] || 0})`;
        ingredientsDiv.appendChild(ingredient);
      }

      recipeCard.appendChild(ingredientsDiv);

      if (canCraft) {
        recipeCard.addEventListener('click', () => {
          this.player.craftRecipe(recipe);
        });

        recipeCard.addEventListener('mouseenter', () => {
          recipeCard.style.transform = 'scale(1.02)';
        });

        recipeCard.addEventListener('mouseleave', () => {
          recipeCard.style.transform = 'scale(1)';
        });
      }

      this.recipesContainer.appendChild(recipeCard);
    });
  }
}
