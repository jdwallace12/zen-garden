import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainManager } from './terrain/terrainManager.js';
import { WeatherEnvironment } from './atmosphere/weatherEnvironment.js';
import { rockGenerator } from './procedural/rockGenerator.js';
import { treeGenerator } from './procedural/treeGenerator.js';
import { decorationGenerator } from './procedural/decorations.js';
import { GardenPresets } from './gardenPresets.js';
import { GardenSerializer } from './gardenSerializer.js';
import { zenAudio } from './audio/zenAudio.js';
import { MossManager } from './procedural/mossManager.js';

class ZenGardenApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.placedObjects = [];
    this.currentMode = 'tool'; // 'tool', 'place', 'delete'
    this.selectedElement = { category: 'rocks', type: 'standing' };
    this.elementScale = 1.0;
    this.autoMoss = true;

    this.isMouseDown = false;
    this.lastHitPoint = null;
    this.currentHitPoint = null;
    this.isDraggingTerrain = false;

    // Keyboard camera navigation state
    this.keysPressed = new Set();
    this.moveSpeed = 16.0; // Units per second
    this.camForward = new THREE.Vector3();
    this.camRight = new THREE.Vector3();
    this.moveDelta = new THREE.Vector3();

    this.initThree();
    this.initTerrain();
    this.initWeather();
    this.initBrushCursor();
    this.initPresets();
    this.initSerializer();
    this.initUI();
    this.initInteraction();

    // Load initial preset
    this.presets.loadRyoanji();

    this.clock = new THREE.Clock();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 18, 26);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep above ground
    this.controls.minDistance = 5;
    this.controls.maxDistance = 65;
    this.controls.target.set(0, 0, 0);

    // Default right-click or Alt+drag to orbit so left-click carves terrain smoothly
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.NONE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initTerrain() {
    this.terrain = new TerrainManager(this.scene, 36, 160);
    this.mossManager = new MossManager(this.scene);
  }

  initWeather() {
    this.weather = new WeatherEnvironment(this.scene, this.renderer);
  }

  initPresets() {
    this.presets = new GardenPresets(this);
  }

  initSerializer() {
    this.serializer = new GardenSerializer(this);
  }

  initBrushCursor() {
    // 3D Visualizer on sand showing brush size & prongs
    this.brushCursorGroup = new THREE.Group();

    // Outer ring
    const ringGeo = new THREE.RingGeometry(0.95, 1.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xb83324,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.cursorRing = new THREE.Mesh(ringGeo, ringMat);
    this.brushCursorGroup.add(this.cursorRing);

    // Center indicator dot
    const dotGeo = new THREE.CircleGeometry(0.08, 16);
    dotGeo.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xb83324, side: THREE.DoubleSide });
    this.cursorDot = new THREE.Mesh(dotGeo, dotMat);
    this.brushCursorGroup.add(this.cursorDot);

    this.brushCursorGroup.visible = false;
    this.scene.add(this.brushCursorGroup);
  }

  updateBrushCursor(point, normal = null) {
    if (!point || this.currentMode === 'delete') {
      this.brushCursorGroup.visible = false;
      return;
    }
    this.brushCursorGroup.visible = true;
    const r = this.terrain.brush.radius;
    this.cursorRing.scale.set(r, 1, r);
    this.brushCursorGroup.position.copy(point);

    if (normal) {
      this.brushCursorGroup.position.addScaledVector(normal, 0.04);
      this.brushCursorGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    } else {
      this.brushCursorGroup.position.y += 0.04;
      this.brushCursorGroup.quaternion.identity();
    }
  }

  // Placed Objects Management
  addPlacedObject(mesh, metadata = {}) {
    mesh.userData = metadata;
    this.scene.add(mesh);
    this.placedObjects.push(mesh);
    zenAudio.playPlacementThud();
  }

  removePlacedObject(obj) {
    // Find top-level placed group
    let current = obj;
    while (current.parent && current.parent !== this.scene) {
      current = current.parent;
    }
    const idx = this.placedObjects.indexOf(current);
    if (idx !== -1) {
      this.mossManager.removeMossForObject(current);
      this.scene.remove(current);
      this.placedObjects.splice(idx, 1);
      zenAudio.playPlacementThud();
      return true;
    }
    return false;
  }

  clearPlacedObjects() {
    if (this.mossManager) {
      this.mossManager.clearAllMoss();
    }
    for (const obj of this.placedObjects) {
      this.scene.remove(obj);
    }
    this.placedObjects = [];
  }

  // Catalog definition
  getCatalogItems() {
    return {
      rocks: [
        { id: 'standing', name: 'Taido Stone', desc: 'Tall soul/mountain rock', icon: '🪨', type: 'rock' },
        { id: 'reclining', name: 'Kikyaku Stone', desc: 'Reclining ox-shaped rock', icon: '⛰️', type: 'rock' },
        { id: 'flat', name: 'Shintai Stone', desc: 'Flat recumbent water rock', icon: '🥌', type: 'rock' },
        { id: 'triad', name: 'San-zon Triad', desc: 'Sacred 3-stone Trinity', icon: '⛩️', type: 'rock' },
        { id: 'stepping', name: 'Tobi-ishi Step', desc: 'Path stepping slate', icon: '◽', type: 'rock' }
      ],
      flora: [
        { id: 'pine', name: 'Bonsai Pine', desc: 'Matsu cloud foliage', icon: '🌲', type: 'tree' },
        { id: 'maple', name: 'Red Maple', desc: 'Crimson Momiji tree', icon: '🍁', type: 'tree' },
        { id: 'sakura', name: 'Cherry Blossom', desc: 'Pink blossoming Sakura', icon: '🌸', type: 'tree' },
        { id: 'bamboo', name: 'Bamboo Grove', desc: 'Segmented Take culms', icon: '🎋', type: 'tree' }
      ],
      traditional: [
        { id: 'lantern', name: 'Stone Lantern', desc: 'Snow Yukimi Tōrō', icon: '🏮', type: 'decoration' },
        { id: 'torii', name: 'Torii Gate', desc: 'Shinto sacred gateway', icon: '⛩️', type: 'decoration' },
        { id: 'bamboo-fence', name: 'Bamboo Fence', desc: 'Kenninji-gaki edging', icon: '🎍', type: 'decoration' },
        { id: 'shishi', name: 'Shishi-Odoshi', desc: 'Ticking bamboo rocker', icon: '🎋', type: 'decoration' },
        { id: 'tsukubai', name: 'Water Basin', desc: 'Chiseled stone basin', icon: '🥣', type: 'decoration' },
        { id: 'koi', name: 'Koi Fish', desc: 'Swimming Nishikigoi', icon: '🐟', type: 'decoration' }
      ]
    };
  }

  populateCatalog(cat = 'rocks') {
    const listEl = document.getElementById('element-list');
    listEl.innerHTML = '';
    const catalog = this.getCatalogItems();
    const items = catalog[cat] || [];

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `element-card ${index === 0 && this.currentMode === 'place' ? 'active' : ''}`;
      card.innerHTML = `
        <span class="el-icon">${item.icon}</span>
        <span class="el-title">${item.name}</span>
        <span class="el-desc">${item.desc}</span>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.element-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.currentMode = 'place';
        this.selectedElement = { category: cat, ...item };

        // Deactivate landscape tools visually
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-delete-mode').classList.remove('active');

        this.updateHint(`Click anywhere on the sand to place ${item.name}.`);
      });

      listEl.appendChild(card);
    });
  }

  // UI Event Bindings
  initUI() {
    // 1. Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const p = btn.dataset.preset;
        zenAudio.playSingingBowl(240);

        if (p === 'ryoanji') this.presets.loadRyoanji();
        else if (p === 'sanctuary') this.presets.loadMountainSanctuary();
        else if (p === 'koi-pond') this.presets.loadKoiPondGarden();
        else if (p === 'procedural') this.presets.generateProceduralSanctuary();
        else if (p === 'blank') this.presets.loadBlankCanvas();

        document.querySelectorAll('.tod-btn').forEach(tb => {
          tb.classList.toggle('active', tb.dataset.time === this.weather.currentPreset);
        });
      });
    });

    // 2. Landscape Sculpt & Carve Tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.element-card').forEach(c => c.classList.remove('active'));
        document.getElementById('btn-delete-mode').classList.remove('active');

        btn.classList.add('active');
        this.currentMode = 'tool';
        this.terrain.brush.tool = btn.dataset.tool;

        const hints = {
          'sculpt-raise': 'Click & drag to elevate lush green moss mounds and hills.',
          'sculpt-lower': 'Click & drag to carve depressions into the earth.',
          'water-pool': 'Click & drag to carve deep ponds filled with clear water.',
          'paint-moss': 'Click & drag to paint velvety emerald moss cushions.',
          'paint-sand': 'Click & drag to restore pristine smooth cream sand.',
          'smooth': 'Click & drag to gently level and blend the landscape.'
        };
        this.updateHint(hints[btn.dataset.tool] || 'Drag on terrain to carve.');
      });
    });

    // 3. Tool Parameters
    const sizeSlider = document.getElementById('brush-size');
    const sizeVal = document.getElementById('val-brush-size');
    sizeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.terrain.brush.radius = val;
      sizeVal.textContent = `${val.toFixed(1)}m`;
    });

    const strengthSlider = document.getElementById('brush-strength');
    const strengthVal = document.getElementById('val-brush-strength');
    strengthSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.terrain.brush.strength = val;
      strengthVal.textContent = `${Math.round(val * 100)}%`;
    });

    // 4. Catalog Categories & Element Scale
    this.populateCatalog('rocks');
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.populateCatalog(tab.dataset.cat);
      });
    });

    const scaleSlider = document.getElementById('elem-scale');
    const scaleVal = document.getElementById('val-elem-scale');
    scaleSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.elementScale = val;
      scaleVal.textContent = `${val.toFixed(1)}x`;
    });

    const chkMoss = document.getElementById('chk-auto-moss');
    if (chkMoss) {
      chkMoss.addEventListener('change', (e) => {
        this.autoMoss = e.target.checked;
      });
    }

    // 5. Delete Tool
    const deleteBtn = document.getElementById('btn-delete-mode');
    deleteBtn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.element-card').forEach(c => c.classList.remove('active'));
      deleteBtn.classList.toggle('active');

      if (deleteBtn.classList.contains('active')) {
        this.currentMode = 'delete';
        this.updateHint('Click any placed rock, tree, or lantern to remove it from the garden.');
      } else {
        this.currentMode = 'tool';
        const sculptBtn = document.querySelector('.tool-btn[data-tool="sculpt-raise"]');
        if (sculptBtn) sculptBtn.classList.add('active');
        this.terrain.brush.tool = 'sculpt-raise';
      }
    });

    // 6. Undo / Redo / Clear
    document.getElementById('btn-undo').addEventListener('click', () => {
      if (this.terrain.undo()) zenAudio.playPlacementThud();
    });
    document.getElementById('btn-redo').addEventListener('click', () => {
      if (this.terrain.redo()) zenAudio.playPlacementThud();
    });
    document.getElementById('btn-clear-sand').addEventListener('click', () => {
      this.terrain.resetToFlat();
      zenAudio.playSingingBowl(216);
    });

    // 7. Time of Day
    document.querySelectorAll('.tod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tod-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.weather.setPreset(btn.dataset.time);
      });
    });

    // 8. Snow Precipitation Toggle
    const snowToggleBtn = document.getElementById('btn-toggle-snow');
    const snowStatusText = document.getElementById('snow-status-text');
    if (snowToggleBtn) {
      snowToggleBtn.addEventListener('click', () => {
        const isEnabled = this.weather.toggleSnow();
        snowToggleBtn.classList.toggle('active', isEnabled);
        if (snowStatusText) {
          snowStatusText.textContent = isEnabled ? 'On' : 'Off';
        }
        zenAudio.playMossRustle();
      });
    }

    // 9. Camera Views
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setCameraView(btn.dataset.cam);
      });
    });

    // 9. Audio Controls
    document.getElementById('btn-singing-bowl').addEventListener('click', () => {
      zenAudio.playSingingBowl(216);
    });

    const audioToggle = document.getElementById('btn-audio-toggle');
    const audioIcon = document.getElementById('audio-icon');
    audioToggle.addEventListener('click', () => {
      const isMuted = zenAudio.toggleMute();
      audioIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // 10. Meditation Mode
    const btnMeditate = document.getElementById('btn-meditate');
    const uiLayer = document.getElementById('ui-layer');
    const btnExitMeditate = document.getElementById('btn-exit-meditate');

    btnMeditate.addEventListener('click', () => {
      uiLayer.classList.add('meditation-hidden');
      btnExitMeditate.classList.remove('hidden');
      this.brushCursorGroup.visible = false;
      zenAudio.playSingingBowl(192);
    });

    btnExitMeditate.addEventListener('click', () => {
      uiLayer.classList.remove('meditation-hidden');
      btnExitMeditate.classList.add('hidden');
    });

    window.addEventListener('keydown', (e) => {
      const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (!isInput) {
          e.preventDefault();
        }
      }

      this.keysPressed.add(e.code);
      this.keysPressed.add(e.key);

      if (e.key === 'Escape' && uiLayer.classList.contains('meditation-hidden')) {
        uiLayer.classList.remove('meditation-hidden');
        btnExitMeditate.classList.add('hidden');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) this.terrain.redo();
        else this.terrain.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        this.terrain.redo();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
      this.keysPressed.delete(e.key);
    });

    window.addEventListener('blur', () => {
      this.keysPressed.clear();
    });

    // 11. Save / Load Garden
    document.getElementById('btn-save-garden').addEventListener('click', () => {
      this.serializer.exportGarden();
      zenAudio.playSingingBowl(280);
    });
    document.getElementById('btn-load-garden').addEventListener('click', () => {
      this.serializer.importGarden();
    });

    // 12. Drawer Toggles
    document.getElementById('toggle-left').addEventListener('click', () => {
      document.getElementById('left-sidebar').classList.toggle('collapsed');
    });
    document.getElementById('toggle-right').addEventListener('click', () => {
      document.getElementById('right-sidebar').classList.toggle('collapsed');
    });
  }

  setCameraView(mode) {
    if (mode === 'orbit') {
      this.camera.position.set(0, 18, 26);
      this.controls.target.set(0, 0, 0);
      this.controls.enableRotate = true;
    } else if (mode === 'eye') {
      // Sitting at the edge of the temple veranda (Engawa)
      this.camera.position.set(0, 1.8, 19.5);
      this.controls.target.set(0, 0.8, 0);
      this.controls.enableRotate = true;
    } else if (mode === 'top') {
      this.camera.position.set(0, 36, 0.1);
      this.controls.target.set(0, 0, 0);
      this.controls.enableRotate = false;
    }
    this.controls.update();
  }

  updateHint(text) {
    const hintEl = document.getElementById('interaction-hint');
    if (hintEl) hintEl.textContent = text;
  }

  // Pointer / Mouse Interaction
  initInteraction() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      if (document.activeElement && document.activeElement.blur && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
      }

      // If user right-clicks or holds Alt, let OrbitControls handle camera rotation
      if (e.button === 2 || e.altKey) {
        return;
      }

      if (e.button === 0) {
        this.isMouseDown = true;
        zenAudio.resume();

        const hit = this.raycastGarden(e);
        if (hit) {
          if (this.currentMode === 'tool') {
            this.isDraggingTerrain = true;
            this.lastHitPoint = hit.point.clone();
            this.applyCurrentTool(hit, false);
          } else if (this.currentMode === 'place') {
            this.placeCurrentElement(hit.point);
          } else if (this.currentMode === 'delete') {
            this.checkDeleteObject(e);
          }
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const hit = this.raycastGarden(e);
      if (hit) {
        this.currentHitPoint = hit.point.clone();
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() : null;
        this.updateBrushCursor(hit.point, normal);

        if (this.isMouseDown && this.isDraggingTerrain && this.currentMode === 'tool') {
          const dist = this.lastHitPoint ? this.lastHitPoint.distanceTo(hit.point) : 1;
          if (dist > 0.04) {
            this.applyCurrentTool(hit, true);
            this.lastHitPoint = hit.point.clone();
          }
        }
      } else {
        this.updateBrushCursor(null);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (this.isDraggingTerrain) {
        this.isDraggingTerrain = false;
        this.terrain.saveState();
      }
      this.isMouseDown = false;
      this.lastHitPoint = null;
    });

    // Prevent default context menu on right click so camera can orbit cleanly
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  applyCurrentTool(hit, isDragging = false) {
    const tool = this.terrain.brush.tool;
    const isRockOrObject = hit.object !== this.terrain.mesh;

    if (tool === 'paint-moss') {
      if (isRockOrObject) {
        // Grow moss directly clinging to the rock or lantern surface!
        this.mossManager.growMossOnRock(hit, this.terrain.brush.radius, 4);
        zenAudio.playMossRustle();
      } else {
        // Paint thick cushion bed on the terrain (elevates physical height & paints texture)
        this.terrain.paintSurface(hit.point, this.terrain.brush.radius, 'moss', this.terrain.brush.strength);
        // Grow volumetric 3D cushion moss pillows
        this.mossManager.growGroundMossBeds(hit.point, this.terrain.brush.radius, this.terrain, 2);
        zenAudio.playMossRustle();
      }
    } else if (tool === 'paint-sand' || tool === 'smooth') {
      // Restore sand & prune moss from rocks/ground
      this.terrain.applyBrush(hit.point, this.lastHitPoint || hit.point, isDragging);
      this.mossManager.pruneMossAt(hit.point, this.terrain.brush.radius);
    } else if (tool === 'sculpt-raise') {
      this.terrain.applyBrush(hit.point, this.lastHitPoint || hit.point, isDragging);
      if (!isDragging || Math.random() < 0.15) {
        zenAudio.playMossRustle();
      }
    } else {
      // Other terrain tools (sculpt-lower, water-pool)
      this.terrain.applyBrush(hit.point, this.lastHitPoint || hit.point, isDragging);
    }
  }

  raycastGarden(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const isMoss = this.currentMode === 'tool' && this.terrain.brush.tool === 'paint-moss';
    const isDelete = this.currentMode === 'delete';

    // When using the moss tool or delete tool, check rocks and placed elements
    const targets = (isMoss || isDelete)
      ? [this.terrain.mesh, ...this.placedObjects]
      : [this.terrain.mesh];

    const intersects = this.raycaster.intersectObjects(targets, true);
    return intersects.length > 0 ? intersects[0] : null;
  }

  placeCurrentElement(point) {
    const { category, id, type } = this.selectedElement;
    const scale = this.elementScale;
    let newObj = null;

    if (category === 'rocks') {
      newObj = rockGenerator.createRock(id, scale);
    } else if (category === 'flora') {
      newObj = treeGenerator.createTree(id, scale);
    } else if (category === 'traditional') {
      if (id === 'lantern') newObj = decorationGenerator.createLantern(scale);
      else if (id === 'torii') newObj = decorationGenerator.createToriiGate(scale);
      else if (id === 'bamboo-fence') newObj = decorationGenerator.createBambooFence(scale);
      else if (id === 'shishi') newObj = decorationGenerator.createShishiOdoshi(scale);
      else if (id === 'tsukubai') newObj = decorationGenerator.createTsukubai(scale);
      else if (id === 'koi') {
        const waterY = Math.min(-0.16, this.terrain.getHeightAt(point.x, point.z) - 0.02);
        newObj = decorationGenerator.createKoiFish(new THREE.Vector3(point.x, waterY, point.z), 3.0 * scale);
      }
    }

    if (newObj) {
      if (id !== 'koi') {
        const terrainY = this.terrain.getHeightAt(point.x, point.z);
        newObj.position.set(point.x, terrainY, point.z);
        newObj.rotation.y = Math.random() * Math.PI * 2;
      }
      this.addPlacedObject(newObj, { category, id, scale });

      // Automatically nest stone in traditional moss bedding
      if (this.autoMoss && category === 'rocks') {
        const mossR = 1.6 * scale;
        this.terrain.nestStoneInMoss(point.x, point.z, mossR);
        if (this.mossManager) {
          this.mossManager.growGroundMossBeds(point, 1.2 * scale, this.terrain, 2);
        }
      }
    }
  }

  checkDeleteObject(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.placedObjects, true);
    if (intersects.length > 0) {
      this.removePlacedObject(intersects[0].object);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  updateCameraKeyboardMovement(dt) {
    if (this.keysPressed.size === 0) return;

    let moveX = 0;
    let moveZ = 0;
    let moveY = 0;

    // Arrow keys or WASD
    if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('KeyW')) {
      moveZ += 1;
    }
    if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('KeyS')) {
      moveZ -= 1;
    }
    if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA')) {
      moveX -= 1;
    }
    if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD')) {
      moveX += 1;
    }
    // Height elevation adjust (PageUp / PageDown / E / Q)
    if (this.keysPressed.has('PageUp') || this.keysPressed.has('KeyE')) {
      moveY += 1;
    }
    if (this.keysPressed.has('PageDown') || this.keysPressed.has('KeyQ')) {
      moveY -= 1;
    }

    if (moveX === 0 && moveZ === 0 && moveY === 0) return;

    // Sprint glide speed if Shift held
    const speedMultiplier = (this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight')) ? 2.2 : 1.0;
    const speed = this.moveSpeed * speedMultiplier * dt;

    // Calculate camera forward direction on horizontal XZ plane
    this.camForward.subVectors(this.controls.target, this.camera.position);
    this.camForward.y = 0;
    if (this.camForward.lengthSq() < 0.001) {
      this.camForward.set(0, 0, -1);
    } else {
      this.camForward.normalize();
    }

    // Right vector (forward x up)
    this.camRight.crossVectors(this.camForward, THREE.Object3D.DEFAULT_UP).normalize();

    this.moveDelta.set(0, 0, 0);
    if (moveZ !== 0) {
      this.moveDelta.addScaledVector(this.camForward, moveZ * speed);
    }
    if (moveX !== 0) {
      this.moveDelta.addScaledVector(this.camRight, moveX * speed);
    }
    if (moveY !== 0) {
      this.moveDelta.y += moveY * speed;
    }

    // Apply movement to both camera position and orbit target so camera glides smoothly
    this.camera.position.add(this.moveDelta);
    this.controls.target.add(this.moveDelta);

    // Keep orbit target within reasonable garden perimeter bounds
    const maxBound = this.terrain.size * 0.75;
    this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -maxBound, maxBound);
    this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -maxBound, maxBound);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.updateCameraKeyboardMovement(dt);
    this.controls.update();
    this.weather.update(elapsedTime, dt);
    decorationGenerator.update(elapsedTime, dt);

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new ZenGardenApp();
});
