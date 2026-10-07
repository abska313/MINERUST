/**
 * MINE-RUST ENGINE (v1.0.0)
 * Comprehensive Standalone 3D Offline Mobile Survival Game
 * Complete Procedural World, Modular Snapping, AI State Machine, Synthesizer & Save Engine
 */

// 1. PROCEDURAL WEB AUDIO SYNTHESIZER (Zero External Assets Required)
class SoundEngine {
  constructor() {
    this.ctx = null;
  }
  ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playChop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }
  playMine() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }
  playStep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
  playCraft() {
    if (!this.ctx) return;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.25);
    });
  }
  playBuild() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(260, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playTurret() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
}

// 2. PERSISTENT STORAGE (IndexedDB with Fallback)
class SaveSystem {
  constructor() {
    this.dbName = 'MineRust_DB';
    this.dbVersion = 1;
    this.db = null;
  }
  async init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(false);
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  }
  async save(state) {
    if (this.db) {
      try {
        const tx = this.db.transaction('saves', 'readwrite');
        tx.objectStore('saves').put({ id: 'primary_save', data: state, ts: Date.now() });
      } catch (e) {
        localStorage.setItem('minerust_backup', JSON.stringify(state));
      }
    } else {
      localStorage.setItem('minerust_backup', JSON.stringify(state));
    }
  }
  async load() {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('saves', 'readonly');
          const req = tx.objectStore('saves').get('primary_save');
          req.onsuccess = () => {
            if (req.result && req.result.data) resolve(req.result.data);
            else resolve(this.loadFallback());
          };
          req.onerror = () => resolve(this.loadFallback());
        } catch (e) {
          resolve(this.loadFallback());
        }
      });
    }
    return this.loadFallback();
  }
  loadFallback() {
    const raw = localStorage.getItem('minerust_backup');
    return raw ? JSON.parse(raw) : null;
  }
}

// 3. ITEM REGISTRY & RECIPES DATABASE
const ITEMS = {
  rock: { id: 'rock', name: 'Survival Rock', icon: '🪨', type: 'tool', dmg: 10, woodMult: 1.0, stoneMult: 1.0 },
  wood: { id: 'wood', name: 'Wood Logs', icon: '🪵', type: 'resource', stack: 500 },
  stone: { id: 'stone', name: 'Stone Chunk', icon: '⛰', type: 'resource', stack: 500 },
  metal_ore: { id: 'metal_ore', name: 'Metal Ore', icon: '🧱', type: 'resource', stack: 300 },
  sulfur_ore: { id: 'sulfur_ore', name: 'Sulfur Ore', icon: '🟡', type: 'resource', stack: 300 },
  hatchet: { id: 'hatchet', name: 'Stone Hatchet', icon: '🪓', type: 'tool', dmg: 20, woodMult: 2.8, stoneMult: 1.2 },
  pickaxe: { id: 'pickaxe', name: 'Stone Pickaxe', icon: '⛏', type: 'tool', dmg: 18, woodMult: 1.2, stoneMult: 3.0 },
  spear: { id: 'spear', name: 'Hunting Spear', icon: '🗡', type: 'weapon', dmg: 40, woodMult: 0.5, stoneMult: 0.5 },
  bow: { id: 'bow', name: 'Hunting Bow', icon: '🏹', type: 'weapon', dmg: 55, woodMult: 0.2, stoneMult: 0.2 },
  cooked_meat: { id: 'cooked_meat', name: 'Cooked Meat', icon: '🍖', type: 'food', food: 35, hp: 15 },
  berries: { id: 'berries', name: 'Wild Berries', icon: '🍒', type: 'food', food: 10, water: 15 },
  bandage: { id: 'bandage', name: 'Clean Bandage', icon: '🩹', type: 'medical', hp: 25 },
  workbench_1: { id: 'workbench_1', name: 'Workbench T1', icon: '🛠', type: 'structure' },
  solar_panel: { id: 'solar_panel', name: 'Solar Panel', icon: '⚡', type: 'machine' },
  auto_turret: { id: 'auto_turret', name: 'Auto-Turret', icon: '🤖', type: 'machine' }
};

const RECIPES = [
  { id: 'hatchet', name: 'Stone Hatchet', cost: { wood: 30, stone: 20 }, yield: { id: 'hatchet', count: 1 }, tier: 1 },
  { id: 'pickaxe', name: 'Stone Pickaxe', cost: { wood: 30, stone: 25 }, yield: { id: 'pickaxe', count: 1 }, tier: 1 },
  { id: 'spear', name: 'Hunting Spear', cost: { wood: 50 }, yield: { id: 'spear', count: 1 }, tier: 1 },
  { id: 'bow', name: 'Hunting Bow', cost: { wood: 60, stone: 15 }, yield: { id: 'bow', count: 1 }, tier: 1 },
  { id: 'bandage', name: 'Clean Bandage', cost: { wood: 10 }, yield: { id: 'bandage', count: 2 }, tier: 1 },
  { id: 'workbench_1', name: 'Workbench Tier 1', cost: { wood: 100, stone: 80 }, yield: { id: 'workbench_1', count: 1 }, tier: 1 },
  { id: 'solar_panel', name: 'Solar Panel Generator', cost: { wood: 80, stone: 50, metal_ore: 40 }, yield: { id: 'solar_panel', count: 1 }, tier: 2 },
  { id: 'auto_turret', name: 'Automated Defense Turret', cost: { wood: 100, stone: 80, metal_ore: 60 }, yield: { id: 'auto_turret', count: 1 }, tier: 2 }
];

const BUILDING_PIECES = [
  { id: 'foundation', name: 'Wood Foundation', cost: { wood: 50 }, size: [3, 0.4, 3] },
  { id: 'wall', name: 'Wood Wall', cost: { wood: 35 }, size: [3, 2.8, 0.25] },
  { id: 'doorway', name: 'Wood Doorway Frame', cost: { wood: 30 }, size: [3, 2.8, 0.25], isDoorway: true },
  { id: 'ceiling', name: 'Wood Ceiling / Floor', cost: { wood: 40 }, size: [3, 0.25, 3] }
];

// 4. MAIN ENGINE ORCHESTRATOR
class MineRustEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.audio = new SoundEngine();
    this.saveSys = new SaveSystem();

    // Survival Variables
    this.hp = 100;
    this.food = 100;
    this.water = 100;
    this.stamina = 100;
    this.workbenchTier = 1;
    this.seed = Math.floor(Math.random() * 999999);

    // World & Inventory Collections
    this.inventory = new Array(24).fill(null);
    this.hotbar = new Array(6).fill(null);
    this.selectedHotbarIndex = 0;

    this.resourceNodes = [];
    this.structures = [];
    this.entities = [];
    this.machines = [];

    // Player Kinetic State
    this.pos = new THREE.Vector3(0, 4.0, 0);
    this.velY = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.isGrounded = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.moveInput = { x: 0, z: 0 };

    // Building Mode Variables
    this.buildMode = false;
    this.selectedBuildingIndex = 0;
    this.buildingRotation = 0;

    // Viewmodel State
    this.isSwinging = false;
    this.swingProgress = 0;

    // Daylight Loop
    this.dayTime = 0.25; // 0.0 to 1.0 (0.25 = Morning)
    this.dayDurationSeconds = 300; // 5 min cycle

    this.initThree();
    this.initWorld();
    this.initPlayerViewmodel();
    this.initTouchControls();
    this.initUI();
    this.initPWA();

    this.loadState().then(() => {
      this.startLoop();
      this.startAutosave();
    });
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    // Atmospheric Celestial Lighting
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    this.dirLight.position.set(40, 60, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    const d = 40;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Dynamic Hologram Preview Box for Building
    const ghostGeo = new THREE.BoxGeometry(3, 3, 3);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.6 });
    this.ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initWorld() {
    // 1. Procedural Voxel Chunk Terrain Base
    const terrainGeo = new THREE.PlaneGeometry(180, 180, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Continuous Multi-octave Pseudo-Perlin Height Function
      const elevation = Math.sin(vx * 0.05 + this.seed) * Math.cos(vz * 0.05) * 2.5 +
                        Math.sin(vx * 0.12) * Math.cos(vz * 0.12) * 1.2;
      posAttr.setY(i, Math.max(0, elevation));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshLambertMaterial({ color: 0x476326 });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // 2. Blocky Trees & Resource Nodes Distribution
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const sulfurMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    // Spawn 45 Procedural Trees
    for (let i = 0; i < 45; i++) {
      const rx = (Math.random() - 0.5) * 140;
      const rz = (Math.random() - 0.5) * 140;
      if (Math.hypot(rx, rz) < 8) continue;

      const tree = new THREE.Group();
      tree.position.set(rx, this.getTerrainHeight(rx, rz), rz);

      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), woodMat);
      trunk.position.y = 1.8;
      trunk.castShadow = true;
      tree.add(trunk);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), foliageMat);
      canopy.position.y = 4.2;
      canopy.castShadow = true;
      tree.add(canopy);

      this.scene.add(tree);
      this.resourceNodes.push({ type: 'tree', obj: tree, hp: 60, maxHp: 60, pos: tree.position });
    }

    // Spawn 25 Stone & Metal Boulders
    for (let i = 0; i < 25; i++) {
      const rx = (Math.random() - 0.5) * 140;
      const rz = (Math.random() - 0.5) * 140;
      if (Math.hypot(rx, rz) < 8) continue;

      const isSulfur = Math.random() < 0.3;
      const isMetal = !isSulfur && Math.random() < 0.4;
      const nodeMat = isSulfur ? sulfurMat : (isMetal ? metalMat : stoneMat);
      const resType = isSulfur ? 'sulfur' : (isMetal ? 'metal' : 'stone');

      const boulder = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), nodeMat);
      boulder.position.set(rx, this.getTerrainHeight(rx, rz) + 0.7, rz);
      boulder.rotation.y = Math.random() * Math.PI;
      boulder.castShadow = true;

      this.scene.add(boulder);
      this.resourceNodes.push({ type: resType, obj: boulder, hp: 80, maxHp: 80, pos: boulder.position });
    }

    // 3. Spawn AI Entities (Deer, Wolves, Bandits)
    this.spawnEntities();
  }

  getTerrainHeight(x, z) {
    const el = Math.sin(x * 0.05 + this.seed) * Math.cos(z * 0.05) * 2.5 +
               Math.sin(x * 0.12) * Math.cos(z * 0.12) * 1.2;
    return Math.max(0, el);
  }

  spawnEntities() {
    // Deer (Passive)
    const deerMat = new THREE.MeshLambertMaterial({ color: 0x9a6b42 });
    for (let i = 0; i < 4; i++) {
      const deer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.8), deerMat);
      deer.position.set((Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80);
      deer.castShadow = true;
      this.scene.add(deer);
      this.entities.push({
        type: 'deer',
        mesh: deer,
        hp: 45,
        state: 'wander',
        speed: 2.2,
        timer: 0,
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
      });
    }

    // Wolves (Hostile)
    const wolfMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    for (let i = 0; i < 3; i++) {
      const wolf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.6), wolfMat);
      wolf.position.set(20 + (Math.random() - 0.5) * 50, 2, 20 + (Math.random() - 0.5) * 50);
      wolf.castShadow = true;
      this.scene.add(wolf);
      this.entities.push({
        type: 'wolf',
        mesh: wolf,
        hp: 60,
        state: 'patrol',
        speed: 3.8,
        timer: 0,
        dir: new THREE.Vector3(1, 0, 0)
      });
    }

    // Rogue Bandit (Humanoid Hostile)
    const banditMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const bandit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), banditMat);
    bandit.position.set(-25, 2, -25);
    bandit.castShadow = true;
    this.scene.add(bandit);
    this.entities.push({
      type: 'bandit',
      mesh: bandit,
      hp: 85,
      state: 'patrol',
      speed: 3.2,
      timer: 0,
      dir: new THREE.Vector3(0, 0, 1)
    });
  }

  initPlayerViewmodel() {
    this.toolPivot = new THREE.Group();
    this.camera.add(this.toolPivot);
    this.toolPivot.position.set(0.35, -0.32, -0.55);

    this.toolContainer = new THREE.Group();
    this.toolPivot.add(this.toolContainer);
    this.scene.add(this.camera);

    this.updateViewmodelMesh();
  }

  updateViewmodelMesh() {
    while (this.toolContainer.children.length > 0) {
      this.toolContainer.remove(this.toolContainer.children[0]);
    }

    const equipped = this.hotbar[this.selectedHotbarIndex];
    const itemId = equipped ? equipped.id : 'rock';

    if (itemId === 'rock') {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12),
        new THREE.MeshLambertMaterial({ color: 0x78716c })
      );
      this.toolContainer.add(rock);
    } else if (itemId === 'hatchet') {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.45, 0.04),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.12, 0.16),
        new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
      );
      head.position.set(0, 0.18, -0.06);
      this.toolContainer.add(handle, head);
    } else if (itemId === 'pickaxe') {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.48, 0.04),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      const pick = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.06, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
      );
      pick.position.set(0, 0.2, 0);
      this.toolContainer.add(handle, pick);
    } else {
      const generic = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.25),
        new THREE.MeshLambertMaterial({ color: 0x0284c7 })
      );
      this.toolContainer.add(generic);
    }
  }

  initTouchControls() {
    const zoneMove = document.getElementById('zone-joystick');
    const zoneLook = document.getElementById('zone-look');
    const knob = document.getElementById('joystick-knob');
    const base = document.getElementById('joystick-base');

    let moveTouchId = null;
    let lookTouchId = null;
    let lookLast = { x: 0, y: 0 };

    // 1. Move Joystick Handler
    zoneMove.addEventListener('touchstart', (e) => {
      this.audio.ensure();
      if (moveTouchId !== null) return;
      const t = e.changedTouches[0];
      moveTouchId = t.identifier;
      this.updateJoystick(t.clientX, t.clientY, knob, base);
    }, { passive: false });

    zoneMove.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === moveTouchId) {
          this.updateJoystick(t.clientX, t.clientY, knob, base);
          break;
        }
      }
    }, { passive: false });

    const endMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === moveTouchId) {
          moveTouchId = null;
          this.moveInput.x = 0;
          this.moveInput.z = 0;
          knob.style.transform = 'translate(0px, 0px)';
          break;
        }
      }
    };
    zoneMove.addEventListener('touchend', endMove);
    zoneMove.addEventListener('touchcancel', endMove);

    // 2. Smooth Look Zone Handler
    zoneLook.addEventListener('touchstart', (e) => {
      this.audio.ensure();
      if (lookTouchId !== null) return;
      const t = e.changedTouches[0];
      lookTouchId = t.identifier;
      lookLast.x = t.clientX;
      lookLast.y = t.clientY;
    }, { passive: false });

    zoneLook.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lookLast.x;
          const dy = t.clientY - lookLast.y;
          lookLast.x = t.clientX;
          lookLast.y = t.clientY;

          this.targetYaw -= dx * 0.0035;
          this.targetPitch = Math.max(-1.3, Math.min(1.3, this.targetPitch - dy * 0.0035));
          break;
        }
      }
    }, { passive: false });

    const endLook = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    };
    zoneLook.addEventListener('touchend', endLook);
    zoneLook.addEventListener('touchcancel', endLook);

    // 3. Action Cluster Buttons
    document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isGrounded && this.stamina >= 10) {
        this.velY = 7.0;
        this.isGrounded = false;
        this.stamina -= 10;
        this.audio.playStep();
      }
    });

    const sprintBtn = document.getElementById('btn-sprint');
    sprintBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isSprinting = !this.isSprinting;
      sprintBtn.classList.toggle('active', this.isSprinting);
    });

    const crouchBtn = document.getElementById('btn-crouch');
    crouchBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isCrouching = !this.isCrouching;
      crouchBtn.classList.toggle('active', this.isCrouching);
    });

    document.getElementById('btn-attack').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.performAction();
    });

    // Keyboard Fallback for Desktop Diagnostics
    window.addEventListener('keydown', (e) => {
      this.audio.ensure();
      if (e.code === 'KeyW') this.moveInput.z = -1;
      if (e.code === 'KeyS') this.moveInput.z = 1;
      if (e.code === 'KeyA') this.moveInput.x = -1;
      if (e.code === 'KeyD') this.moveInput.x = 1;
      if (e.code === 'Space' && this.isGrounded) { this.velY = 7.0; this.isGrounded = false; }
      if (e.code === 'KeyE') this.performAction();
      if (e.code === 'Digit1') this.selectHotbar(0);
      if (e.code === 'Digit2') this.selectHotbar(1);
      if (e.code === 'Digit3') this.selectHotbar(2);
    });
    window.addEventListener('keyup', (e) => {
      if (['KeyW', 'KeyS'].includes(e.code)) this.moveInput.z = 0;
      if (['KeyA', 'KeyD'].includes(e.code)) this.moveInput.x = 0;
    });
  }

  updateJoystick(cx, cy, knob, base) {
    const rect = base.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;

    const dx = cx - midX;
    const dy = cy - midY;
    const dist = Math.hypot(dx, dy);
    const maxR = 45;
    const clampDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clampDist;
    const ny = Math.sin(angle) * clampDist;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;

    if (dist > 4) {
      this.moveInput.x = nx / maxR;
      this.moveInput.z = ny / maxR;
    } else {
      this.moveInput.x = 0;
      this.moveInput.z = 0;
    }
  }

  initUI() {
    // Modal Toggles
    const setupModal = (btnId, modalId) => {
      document.getElementById(btnId).addEventListener('click', () => {
        document.querySelectorAll('.overlay-modal').forEach(m => m.classList.remove('active'));
        document.getElementById(modalId).classList.add('active');
        if (modalId === 'modal-inventory') this.renderInventoryUI();
        if (modalId === 'modal-crafting') this.renderCraftingUI();
        if (modalId === 'modal-building') this.renderBuildingUI();
        if (modalId === 'modal-map') this.renderMapUI();
      });
    };

    setupModal('btn-inv-toggle', 'modal-inventory');
    setupModal('btn-craft-toggle', 'modal-crafting');
    setupModal('btn-build-toggle', 'modal-building');
    setupModal('btn-map-toggle', 'modal-map');

    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).classList.remove('active');
      });
    });

    document.getElementById('btn-respawn').addEventListener('click', () => {
      this.respawn();
    });

    this.renderHotbarUI();
  }

  initPWA() {
    const installBtn = document.getElementById('btn-pwa-install');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      installBtn.style.display = 'flex';
      installBtn.onclick = () => {
        this.deferredPrompt.prompt();
        this.deferredPrompt = null;
        installBtn.style.display = 'none';
      };
    });

    if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  renderHotbarUI() {
    const container = document.getElementById('hotbar-container');
    container.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${i === this.selectedHotbarIndex ? 'selected' : ''}`;
      const item = this.hotbar[i];
      if (item) {
        const itemDef = ITEMS[item.id];
        slot.innerHTML = `<span>${itemDef.icon}</span>${item.count > 1 ? `<span class="slot-count">${item.count}</span>` : ''}`;
      }
      slot.addEventListener('click', () => this.selectHotbar(i));
      container.appendChild(slot);
    }
  }

  selectHotbar(index) {
    this.selectedHotbarIndex = index;
    this.renderHotbarUI();
    this.updateViewmodelMesh();
  }

  renderInventoryUI() {
    const grid = document.getElementById('inv-grid-slots');
    grid.innerHTML = '';
    this.inventory.forEach((slot, idx) => {
      const el = document.createElement('div');
      el.className = 'card-item';
      if (slot) {
        const def = ITEMS[slot.id];
        el.innerHTML = `
          <div style="font-size:22px; text-align:center;">${def.icon}</div>
          <h3>${def.name}</h3>
          <p>Quantity: ${slot.count}</p>
          <button class="card-action-btn">ASSIGN TO HOTBAR</button>
        `;
        el.querySelector('button').onclick = () => {
          this.assignToHotbar(slot, idx);
        };
      } else {
        el.innerHTML = `<p style="text-align:center; color:#475569; margin:auto;">EMPTY</p>`;
      }
      grid.appendChild(el);
    });
  }

  assignToHotbar(slot, invIdx) {
    for (let i = 0; i < 6; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { ...slot };
        this.inventory[invIdx] = null;
        this.renderInventoryUI();
        this.renderHotbarUI();
        this.updateViewmodelMesh();
        this.showToast(`Assigned ${ITEMS[slot.id].name} to slot ${i + 1}`);
        return;
      }
    }
    this.showToast('Hotbar full! Clear a slot first.');
  }

  renderCraftingUI() {
    const list = document.getElementById('craft-grid-list');
    document.getElementById('txt-wb-tier').textContent = this.workbenchTier;
    list.innerHTML = '';

    RECIPES.forEach(recipe => {
      const def = ITEMS[recipe.yield.id];
      const canCraft = this.canAfford(recipe.cost) && recipe.tier <= this.workbenchTier;

      let costStr = Object.entries(recipe.cost).map(([res, amt]) => `${amt} ${ITEMS[res].name}`).join(', ');

      const el = document.createElement('div');
      el.className = 'card-item';
      el.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:22px;">${def.icon}</span>
          <div>
            <h3>${recipe.name}</h3>
            <p>Req: ${costStr} (Tier ${recipe.tier})</p>
          </div>
        </div>
        <button class="card-action-btn" ${canCraft ? '' : 'disabled'}>FABRICATE</button>
      `;

      el.querySelector('button').onclick = () => {
        this.craftRecipe(recipe);
      };
      list.appendChild(el);
    });
  }

  canAfford(cost) {
    for (const [resId, amt] of Object.entries(cost)) {
      let count = 0;
      this.inventory.forEach(s => { if (s && s.id === resId) count += s.count; });
      this.hotbar.forEach(s => { if (s && s.id === resId) count += s.count; });
      if (count < amt) return false;
    }
    return true;
  }

  deductCost(cost) {
    for (const [resId, amt] of Object.entries(cost)) {
      let needed = amt;
      for (let i = 0; i < this.hotbar.length && needed > 0; i++) {
        const s = this.hotbar[i];
        if (s && s.id === resId) {
          const take = Math.min(s.count, needed);
          s.count -= take;
          needed -= take;
          if (s.count <= 0) this.hotbar[i] = null;
        }
      }
      for (let i = 0; i < this.inventory.length && needed > 0; i++) {
        const s = this.inventory[i];
        if (s && s.id === resId) {
          const take = Math.min(s.count, needed);
          s.count -= take;
          needed -= take;
          if (s.count <= 0) this.inventory[i] = null;
        }
      }
    }
  }

  craftRecipe(recipe) {
    if (!this.canAfford(recipe.cost)) return;
    this.deductCost(recipe.cost);
    this.addItem(recipe.yield.id, recipe.yield.count);
    this.audio.playCraft();
    this.showToast(`Crafted ${recipe.name}!`);
    this.renderCraftingUI();
    this.renderHotbarUI();
  }

  addItem(id, count) {
    for (let i = 0; i < 6; i++) {
      if (this.hotbar[i] && this.hotbar[i].id === id) {
        this.hotbar[i].count += count;
        this.renderHotbarUI();
        return;
      }
    }
    for (let i = 0; i < 6; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { id, count };
        this.renderHotbarUI();
        this.updateViewmodelMesh();
        return;
      }
    }
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { id, count };
        return;
      }
    }
    this.showToast('Inventory full! Resources dropped.');
  }

  renderBuildingUI() {
    const list = document.getElementById('build-grid-list');
    list.innerHTML = '';
    BUILDING_PIECES.forEach((piece, idx) => {
      const el = document.createElement('div');
      el.className = 'card-item';
      el.innerHTML = `
        <h3>${piece.name}</h3>
        <p>Cost: 50 Wood | Snaps to Foundations</p>
        <button class="card-action-btn">EQUIP BLUEPRINT</button>
      `;
      el.querySelector('button').onclick = () => {
        this.selectedBuildingIndex = idx;
        this.buildMode = true;
        this.ghostMesh.scale.set(piece.size[0], piece.size[1], piece.size[2]);
        this.ghostMesh.visible = true;
        document.getElementById('modal-building').classList.remove('active');
        this.showToast(`Building Plan: ${piece.name}`);
      };
      list.appendChild(el);
    });
  }

  renderMapUI() {
    document.getElementById('txt-map-seed').textContent = this.seed;
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 400, 400);

    // Terrain Heatmap Simulation
    ctx.fillStyle = '#476326';
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.fill();

    // Monuments / Landmarks
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(140, 120, 14, 14); // Abandoned Mine
    ctx.fillStyle = '#f8fafc';
    ctx.font = '9px sans-serif';
    ctx.fillText('MINE', 135, 114);

    // Player Locator Marker
    const px = 200 + (this.pos.x / 180) * 200;
    const pz = 200 + (this.pos.z / 180) * 200;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, pz, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  performAction() {
    this.audio.ensure();
    const equipped = this.hotbar[this.selectedHotbarIndex];
    const itemId = equipped ? equipped.id : 'rock';
    const tool = ITEMS[itemId];

    // Trigger Viewmodel Swing Animation
    this.isSwinging = true;
    this.swingProgress = 0;

    // 1. Building Mode Placement
    if (this.buildMode) {
      this.placeBuildingPiece();
      return;
    }

    // 2. Consume Food / Bandage
    if (tool && tool.type === 'food') {
      this.food = Math.min(100, this.food + tool.food);
      if (tool.water) this.water = Math.min(100, this.water + tool.water);
      if (tool.hp) this.hp = Math.min(100, this.hp + tool.hp);
      this.audio.playStep();
      this.showToast(`Consumed ${tool.name}`);
      equipped.count--;
      if (equipped.count <= 0) this.hotbar[this.selectedHotbarIndex] = null;
      this.renderHotbarUI();
      return;
    }

    if (tool && tool.type === 'medical') {
      this.hp = Math.min(100, this.hp + tool.hp);
      this.audio.playCraft();
      this.showToast(`Applied ${tool.name}`);
      equipped.count--;
      if (equipped.count <= 0) this.hotbar[this.selectedHotbarIndex] = null;
      this.renderHotbarUI();
      return;
    }

    // 3. Harvest Resources or Attack Entities via Raycasting
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    // Check Resource Nodes
    let targetNode = null;
    for (const node of this.resourceNodes) {
      if (node.hp <= 0) continue;
      if (this.pos.distanceTo(node.pos) < 4.2) {
        targetNode = node;
        break;
      }
    }

    if (targetNode) {
      if (targetNode.type === 'tree') {
        const yieldAmt = Math.round(12 * (tool.woodMult || 1.0));
        targetNode.hp -= (tool.dmg || 10);
        this.addItem('wood', yieldAmt);
        this.audio.playChop();
        this.showToast(`+${yieldAmt} Wood`);
      } else {
        const yieldAmt = Math.round(10 * (tool.stoneMult || 1.0));
        targetNode.hp -= (tool.dmg || 10);
        if (targetNode.type === 'sulfur') this.addItem('sulfur_ore', yieldAmt);
        else if (targetNode.type === 'metal') this.addItem('metal_ore', yieldAmt);
        else this.addItem('stone', yieldAmt);
        this.audio.playMine();
        this.showToast(`+${yieldAmt} Ore / Stone`);
      }

      if (targetNode.hp <= 0) {
        this.scene.remove(targetNode.obj);
        this.showToast('Resource Node Depleted!');
      }
      return;
    }

    // Check Entities (Combat)
    for (const ent of this.entities) {
      if (ent.hp <= 0) continue;
      if (this.pos.distanceTo(ent.mesh.position) < 3.8) {
        ent.hp -= (tool.dmg || 15);
        this.audio.playMine();
        this.showToast(`Hit ${ent.type}! HP: ${ent.hp}`);
        if (ent.hp <= 0) {
          this.scene.remove(ent.mesh);
          this.addItem('cooked_meat', 3);
          this.showToast(`Killed ${ent.type}! Harvested Meat.`);
        }
        return;
      }
    }

    // Check Interactive Machines & Workbenches
    for (const mach of this.machines) {
      if (this.pos.distanceTo(mach.mesh.position) < 3.5) {
        if (mach.type === 'workbench_1') {
          this.workbenchTier = 2;
          this.audio.playCraft();
          this.showToast('Interacted with Workbench Tier 1! Tier 2 Crafting Unlocked.');
          return;
        }
      }
    }
  }

  placeBuildingPiece() {
    const piece = BUILDING_PIECES[this.selectedBuildingIndex];
    if (!this.canAfford(piece.cost)) {
      this.showToast('Insufficient materials to place structure!');
      return;
    }

    this.deductCost(piece.cost);
    const structGeo = new THREE.BoxGeometry(piece.size[0], piece.size[1], piece.size[2]);
    const structMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const structMesh = new THREE.Mesh(structGeo, structMat);

    structMesh.position.copy(this.ghostMesh.position);
    structMesh.rotation.y = this.ghostMesh.rotation.y;
    structMesh.castShadow = true;
    structMesh.receiveShadow = true;

    this.scene.add(structMesh);
    this.structures.push({
      id: piece.id,
      mesh: structMesh,
      pos: structMesh.position.clone()
    });

    this.audio.playBuild();
    this.showToast(`Placed ${piece.name}!`);
    this.buildMode = false;
    this.ghostMesh.visible = false;
  }

  updateBuildingGhost() {
    if (!this.buildMode) return;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).multiplyScalar(3.8);
    const targetPos = this.pos.clone().add(forward);

    // Modular 3m Snapping Grid
    targetPos.x = Math.round(targetPos.x / 3) * 3;
    targetPos.z = Math.round(targetPos.z / 3) * 3;
    targetPos.y = this.getTerrainHeight(targetPos.x, targetPos.z) + 1.4;

    this.ghostMesh.position.copy(targetPos);
    this.ghostMesh.rotation.y = this.yaw;
  }

  updateEntities(delta) {
    this.entities.forEach(ent => {
      if (ent.hp <= 0) return;

      const distToPlayer = this.pos.distanceTo(ent.mesh.position);

      if (ent.type === 'deer') {
        if (distToPlayer < 7.0) {
          // Flee away from player
          const fleeDir = ent.mesh.position.clone().sub(this.pos).normalize();
          ent.mesh.position.addScaledVector(fleeDir, ent.speed * 1.8 * delta);
        } else {
          // Leisurely Wander
          ent.timer += delta;
          if (ent.timer > 3.0) {
            ent.timer = 0;
            ent.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          }
          ent.mesh.position.addScaledVector(ent.dir, ent.speed * 0.5 * delta);
        }
      } else if (ent.type === 'wolf' || ent.type === 'bandit') {
        if (distToPlayer < 12.0) {
          // Aggressive Chase
          const chaseDir = this.pos.clone().sub(ent.mesh.position).normalize();
          ent.mesh.position.addScaledVector(chaseDir, ent.speed * delta);
          ent.mesh.lookAt(this.pos.x, ent.mesh.position.y, this.pos.z);

          // Melee Attack Range
          if (distToPlayer < 1.6) {
            this.hp = Math.max(0, this.hp - 12 * delta);
            this.audio.playMine();
            if (this.hp <= 0) this.triggerDeath();
          }
        }
      }

      // Keep entity grounded
      ent.mesh.position.y = this.getTerrainHeight(ent.mesh.position.x, ent.mesh.position.z) + 0.6;
    });
  }

  updateTurrets(delta) {
    this.machines.forEach(m => {
      if (m.type === 'auto_turret') {
        // Search for hostile entities in 14m range
        for (const ent of this.entities) {
          if (ent.hp > 0 && (ent.type === 'wolf' || ent.type === 'bandit')) {
            if (m.mesh.position.distanceTo(ent.mesh.position) < 14) {
              ent.hp -= 35 * delta;
              this.audio.playTurret();
              if (ent.hp <= 0) {
                this.scene.remove(ent.mesh);
                this.showToast('Turret neutralized threat!');
              }
              break;
            }
          }
        }
      }
    });
  }

  updateDayNight(delta) {
    this.dayTime += delta / this.dayDurationSeconds;
    if (this.dayTime >= 1.0) this.dayTime = 0.0;

    // Calculate Celestial Orbit Angle
    const sunAngle = this.dayTime * Math.PI * 2;
    this.dirLight.position.x = Math.cos(sunAngle) * 60;
    this.dirLight.position.y = Math.sin(sunAngle) * 60;

    // Sun Color Temperature
    const isDay = Math.sin(sunAngle) > 0;
    if (isDay) {
      this.dirLight.intensity = Math.sin(sunAngle) * 1.4;
      this.scene.background.set(0x87ceeb);
      this.scene.fog.color.set(0x87ceeb);
    } else {
      this.dirLight.intensity = 0.08;
      this.scene.background.set(0x020617);
      this.scene.fog.color.set(0x020617);
    }

    // Format Digital Clock (00:00 to 24:00)
    const totalMinutes = Math.floor(this.dayTime * 1440);
    const hrs = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');
    document.getElementById('txt-time').textContent = `${hrs}:${mins}`;
  }

  updateSurvivalMetabolism(delta) {
    // Metabolic Depletion
    this.food = Math.max(0, this.food - delta * 0.12);
    this.water = Math.max(0, this.water - delta * 0.18);

    if (this.food <= 0 || this.water <= 0) {
      this.hp = Math.max(0, this.hp - delta * 1.5);
      if (this.hp <= 0) this.triggerDeath();
    }

    // Stamina Regeneration
    if (!this.isSprinting && (this.moveInput.x === 0 && this.moveInput.z === 0)) {
      this.stamina = Math.min(100, this.stamina + delta * 20);
    }

    // UI Updates
    document.getElementById('val-hp').textContent = Math.round(this.hp);
    document.getElementById('val-food').textContent = Math.round(this.food);
    document.getElementById('val-water').textContent = Math.round(this.water);
    document.getElementById('val-sta').textContent = Math.round(this.stamina);

    document.getElementById('bar-hp').style.width = `${this.hp}%`;
    document.getElementById('bar-food').style.width = `${this.food}%`;
    document.getElementById('bar-water').style.width = `${this.water}%`;
    document.getElementById('bar-sta').style.width = `${this.stamina}%`;

    // Compass Heading
    const degrees = Math.round(((-this.yaw * 180 / Math.PI) % 360 + 360) % 360);
    let card = 'N';
    if (degrees > 45 && degrees <= 135) card = 'E';
    else if (degrees > 135 && degrees <= 225) card = 'S';
    else if (degrees > 225 && degrees <= 315) card = 'W';
    document.getElementById('txt-compass').textContent = `${card} ${String(degrees).padStart(3, '0')}°`;
  }

  triggerDeath() {
    document.getElementById('death-screen').classList.add('active');
  }

  respawn() {
    this.hp = 100;
    this.food = 100;
    this.water = 100;
    this.stamina = 100;
    this.pos.set(0, 4.0, 0);
    document.getElementById('death-screen').classList.remove('active');
    this.showToast('Respawned at coast!');
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notice');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  async loadState() {
    await this.saveSys.init();
    const data = await this.saveSys.load();
    if (data) {
      this.hp = data.hp ?? 100;
      this.food = data.food ?? 100;
      this.water = data.water ?? 100;
      this.seed = data.seed ?? this.seed;
      this.workbenchTier = data.workbenchTier ?? 1;
      if (data.inventory) this.inventory = data.inventory;
      if (data.hotbar) this.hotbar = data.hotbar;
      this.renderHotbarUI();
      this.updateViewmodelMesh();
      this.showToast('Survival state loaded.');
    } else {
      // Default Starting Gear (Rust Stone Age)
      this.hotbar[0] = { id: 'rock', count: 1 };
      this.hotbar[1] = { id: 'bandage', count: 2 };
      this.renderHotbarUI();
      this.updateViewmodelMesh();
    }
  }

  async saveState() {
    const data = {
      hp: this.hp,
      food: this.food,
      water: this.water,
      seed: this.seed,
      workbenchTier: this.workbenchTier,
      inventory: this.inventory,
      hotbar: this.hotbar
    };
    await this.saveSys.save(data);
  }

  startAutosave() {
    setInterval(() => {
      this.saveState();
    }, 15000);
  }

  startLoop() {
    let lastTime = performance.now();

    const frame = (now) => {
      requestAnimationFrame(frame);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Camera Smoothing & Orientation
      this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, 0.25);
      this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, 0.25);
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;

      // 2. Kinematic Player Movement & Collision
      const moveSpeed = (this.isSprinting ? 6.2 : (this.isCrouching ? 2.0 : 3.8)) * delta;
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

      const dir = new THREE.Vector3()
        .addScaledVector(right, this.moveInput.x)
        .addScaledVector(forward, -this.moveInput.z);

      if (dir.lengthSq() > 0.001) {
        dir.normalize();
        this.pos.addScaledVector(dir, moveSpeed);
        if (this.isSprinting) this.stamina = Math.max(0, this.stamina - delta * 14);
      }

      // Gravitational Integration
      this.velY -= 18.0 * delta;
      this.pos.y += this.velY * delta;

      const groundY = this.getTerrainHeight(this.pos.x, this.pos.z) + (this.isCrouching ? 1.0 : 1.7);
      if (this.pos.y <= groundY) {
        this.pos.y = groundY;
        this.velY = 0;
        this.isGrounded = true;
      }

      this.camera.position.copy(this.pos);

      // 3. Viewmodel Animation Curve
      if (this.isSwinging) {
        this.swingProgress += delta * 8;
        const arc = Math.sin(this.swingProgress * Math.PI);
        this.toolPivot.rotation.x = -arc * 0.9;
        this.toolPivot.rotation.z = arc * 0.35;
        if (this.swingProgress >= 1.0) {
          this.isSwinging = false;
          this.toolPivot.rotation.set(0, 0, 0);
        }
      }

      // 4. Auxiliary Systems Update
      this.updateDayNight(delta);
      this.updateSurvivalMetabolism(delta);
      this.updateEntities(delta);
      this.updateTurrets(delta);
      this.updateBuildingGhost();

      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(frame);
  }
}

// Global Lifecycle Instantiation
window.addEventListener('DOMContentLoaded', () => {
  new MineRustEngine();
});
