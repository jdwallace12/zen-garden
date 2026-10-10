/**
 * GardenSerializer
 * Handles exporting and importing complete zen garden state as JSON files.
 *
 * Serialized state includes:
 *   - Terrain vertex heights (Float32Array → base64)
 *   - Sand/moss canvas texture (PNG data URL)
 *   - Every placed object (type, position, rotation, scale)
 *   - Weather / time-of-day preset
 *   - Camera position & orbit target
 *   - Snow toggle state
 */
import * as THREE from 'three';
import { rockGenerator } from './procedural/rockGenerator.js';
import { treeGenerator } from './procedural/treeGenerator.js';
import { decorationGenerator } from './procedural/decorations.js';

export class GardenSerializer {
  constructor(app) {
    this.app = app;
    this.FORMAT_VERSION = 1;
  }

  // ── Export ──────────────────────────────────────────────────────────

  exportGarden() {
    const app = this.app;

    // 1. Terrain heights → base64-encoded binary
    const posAttr = app.terrain.geometry.attributes.position;
    const heightsB64 = this._float32ToBase64(posAttr.array);

    // 2. Sand/moss canvas texture → PNG data URL
    const textureDataUrl = app.terrain.canvas.toDataURL('image/png');

    // 3. Placed objects
    const objects = app.placedObjects.map(obj => {
      const ud = obj.userData || {};
      return {
        category: ud.category || ud.type || 'unknown',
        id: ud.id || ud.subType || 'unknown',
        scale: ud.scale || 1.0,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z }
      };
    });

    // 4. Weather
    const weather = {
      preset: app.weather.currentPreset,
      snowEnabled: app.weather.isSnowEnabled !== undefined ? app.weather.isSnowEnabled : true
    };

    // 5. Camera
    const camera = {
      position: {
        x: app.camera.position.x,
        y: app.camera.position.y,
        z: app.camera.position.z
      },
      target: {
        x: app.controls.target.x,
        y: app.controls.target.y,
        z: app.controls.target.z
      }
    };

    const gardenData = {
      version: this.FORMAT_VERSION,
      name: `Zen Garden – ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      terrain: {
        size: app.terrain.size,
        segments: app.terrain.segments,
        heights: heightsB64,
        texture: textureDataUrl
      },
      objects,
      weather,
      camera
    };

    // Trigger download
    const jsonStr = JSON.stringify(gardenData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `zen-garden-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ─────────────────────────────────────────────────────────

  importGarden() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          this._loadGardenData(data);
        } catch (err) {
          console.error('Failed to load garden file:', err);
          alert('Could not load garden file. Please check the file is valid.');
        }
      };
      reader.readAsText(file);
      document.body.removeChild(input);
    });

    input.click();
  }

  _loadGardenData(data) {
    const app = this.app;

    // Validate format
    if (!data.version || !data.terrain) {
      throw new Error('Invalid garden file format.');
    }

    // 1. Clear current state
    app.clearPlacedObjects();

    // 2. Restore terrain heights
    const heightsArray = this._base64ToFloat32(data.terrain.heights);
    const posAttr = app.terrain.geometry.attributes.position;
    posAttr.array.set(heightsArray);
    posAttr.needsUpdate = true;
    app.terrain.geometry.computeVertexNormals();

    // 3. Restore terrain texture from PNG data URL
    this._loadTextureFromDataUrl(data.terrain.texture, app.terrain);

    // 4. Restore placed objects
    if (data.objects && data.objects.length > 0) {
      this._restorePlacedObjects(data.objects);
    }

    // 5. Restore weather
    if (data.weather) {
      app.weather.setPreset(data.weather.preset || 'noon');

      // Sync snow toggle
      if (data.weather.snowEnabled !== undefined && app.weather.isSnowEnabled !== undefined) {
        if (data.weather.snowEnabled !== app.weather.isSnowEnabled) {
          app.weather.toggleSnow();
        }
      }

      // Sync UI toggle buttons
      document.querySelectorAll('.tod-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.time === (data.weather.preset || 'noon'));
      });

      const snowBtn = document.getElementById('btn-toggle-snow');
      const snowText = document.getElementById('snow-status-text');
      if (snowBtn) {
        const isSnow = data.weather.snowEnabled !== false;
        snowBtn.classList.toggle('active', isSnow);
        if (snowText) snowText.textContent = isSnow ? 'On' : 'Off';
      }
    }

    // 6. Restore camera
    if (data.camera) {
      if (data.camera.position) {
        app.camera.position.set(
          data.camera.position.x,
          data.camera.position.y,
          data.camera.position.z
        );
      }
      if (data.camera.target) {
        app.controls.target.set(
          data.camera.target.x,
          data.camera.target.y,
          data.camera.target.z
        );
      }
      app.controls.update();
    }

    // 7. Save state for undo history
    app.terrain.saveState();

    // Sync preset buttons (clear active since this is a custom garden)
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

    app.updateHint(`Garden "${data.name || 'Untitled'}" loaded successfully.`);
  }

  // ── Object Restoration ─────────────────────────────────────────────

  _restorePlacedObjects(objects) {
    const app = this.app;

    for (const objData of objects) {
      const { category, id, scale, position, rotation } = objData;
      let newObj = null;

      // Map category/id to generator calls (mirrors placeCurrentElement & gardenPresets logic)
      if (category === 'rocks' || category === 'rock') {
        newObj = rockGenerator.createRock(id, scale);
      } else if (category === 'flora' || category === 'tree') {
        newObj = treeGenerator.createTree(id, scale);
      } else if (category === 'traditional' || category === 'decoration') {
        if (id === 'lantern') newObj = decorationGenerator.createLantern(scale);
        else if (id === 'torii') newObj = decorationGenerator.createToriiGate(scale);
        else if (id === 'bamboo-fence') newObj = decorationGenerator.createBambooFence(scale);
        else if (id === 'shishi') newObj = decorationGenerator.createShishiOdoshi(scale);
        else if (id === 'tsukubai') newObj = decorationGenerator.createTsukubai(scale);
        else if (id === 'stepping') {
          if (typeof decorationGenerator.createSteppingStone === 'function') {
            newObj = decorationGenerator.createSteppingStone(scale);
          }
        } else if (id === 'koi') {
          newObj = decorationGenerator.createKoiFish(
            new THREE.Vector3(position.x, position.y, position.z),
            3.0 * scale
          );
        }
      }

      if (newObj) {
        newObj.position.set(position.x, position.y, position.z);
        newObj.rotation.set(rotation.x, rotation.y, rotation.z);
        // Store userData for re-serialization & deletion
        newObj.userData = { category, id, scale };
        // Add silently without playing sound for each object
        app.scene.add(newObj);
        app.placedObjects.push(newObj);
      }
    }
  }

  // ── Texture Restoration ────────────────────────────────────────────

  _loadTextureFromDataUrl(dataUrl, terrain) {
    const img = new Image();
    img.onload = () => {
      terrain.ctx.clearRect(0, 0, terrain.texResolution, terrain.texResolution);
      terrain.ctx.drawImage(img, 0, 0, terrain.texResolution, terrain.texResolution);
      terrain.sandTexture.needsUpdate = true;
    };
    img.src = dataUrl;
  }

  // ── Binary Helpers ─────────────────────────────────────────────────

  _float32ToBase64(float32Array) {
    const bytes = new Uint8Array(float32Array.buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  _base64ToFloat32(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Float32Array(bytes.buffer);
  }
}
