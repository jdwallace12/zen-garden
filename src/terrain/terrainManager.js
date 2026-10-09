import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

export class TerrainManager {
  constructor(scene, size = 36, segments = 160) {
    this.scene = scene;
    this.size = size;
    this.segments = segments;
    this.noise = new SimplexNoise(108);

    this.texResolution = 1024;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.texResolution;
    this.canvas.height = this.texResolution;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Brush settings
    this.brush = {
      tool: 'sculpt-raise', // 'sculpt-raise', 'sculpt-lower', 'smooth', 'paint-moss', 'paint-sand', 'water-pool'
      radius: 3.2,
      strength: 0.5
    };

    // History for Undo/Redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 15;

    this.initTextures();
    this.createTerrainMesh();
    this.createWaterPlane();
    this.createWoodenBorders();
    this.saveState();
  }

  initTextures() {
    // Fill canvas texture with initial fine white/cream zen sand
    this.ctx.fillStyle = '#e8dec8'; // Warm sand base
    this.ctx.fillRect(0, 0, this.texResolution, this.texResolution);

    // Add subtle procedural sand grain speckles
    const imgData = this.ctx.getImageData(0, 0, this.texResolution, this.texResolution);
    const data = imgData.data;
    for (let y = 0; y < this.texResolution; y++) {
      for (let x = 0; x < this.texResolution; x++) {
        const i = (y * this.texResolution + x) * 4;
        const n = (this.noise.noise2D(x * 0.15, y * 0.15) + 1) * 0.5;
        const grain = (Math.random() - 0.5) * 16;
        const r = 236 + grain + (n * 10 - 5);
        const g = 227 + grain + (n * 8 - 4);
        const b = 208 + grain + (n * 6 - 3);

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
        data[i + 3] = 255;
      }
    }
    this.ctx.putImageData(imgData, 0, 0);

    this.sandTexture = new THREE.CanvasTexture(this.canvas);
    this.sandTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.sandTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.sandTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.sandTexture.magFilter = THREE.LinearFilter;
    this.sandTexture.generateMipmaps = true;

    // Normal map canvas for high-frequency fine texture
    this.normalCanvas = document.createElement('canvas');
    this.normalCanvas.width = this.texResolution;
    this.normalCanvas.height = this.texResolution;
    this.normalCtx = this.normalCanvas.getContext('2d', { willReadFrequently: true });
    this.normalCtx.fillStyle = '#8080ff'; // Flat normal vector (0, 0, 1) in tangent space
    this.normalCtx.fillRect(0, 0, this.texResolution, this.texResolution);

    this.normalTexture = new THREE.CanvasTexture(this.normalCanvas);
    this.normalTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.normalTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.normalTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.normalTexture.magFilter = THREE.LinearFilter;
  }

  createTerrainMesh() {
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    this.geometry.rotateX(-Math.PI / 2);

    // Initial flat sand with gentle sub-millimeter organic waviness
    const pos = this.geometry.attributes.position;
    this.initialHeights = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle calm natural surface
      const y = this.noise.noise2D(x * 0.05, z * 0.05) * 0.012;
      pos.setY(i, y);
      this.initialHeights[i] = y;
    }
    this.geometry.computeVertexNormals();

    this.material = new THREE.MeshStandardMaterial({
      map: this.sandTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.90,
      metalness: 0.04,
      flatShading: false
    });

    // Dynamic Shader Enhancement:
    // When terrain elevation increases, mounds organically become lush, velvety Japanese moss
    // (matching classical Saihō-ji & Tōfuku-ji green moss mounds rising out of pristine zen sand)
    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vTerrainWorldPos;
        varying float vElevation;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `vElevation = position.y;
        vTerrainWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        #include <project_vertex>`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vTerrainWorldPos;
        varying float vElevation;

        // Procedural noise for natural moss mound edge clumping & velvety micro-texture
        float terrainHash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float terrainNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = terrainHash(i);
          float b = terrainHash(i + vec2(1.0, 0.0));
          float c = terrainHash(i + vec2(0.0, 1.0));
          float d = terrainHash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float terrainFbm(vec2 p) {
          float v = 0.0;
          v += terrainNoise(p) * 0.5;
          v += terrainNoise(p * 2.1) * 0.25;
          v += terrainNoise(p * 4.3) * 0.125;
          return v;
        }`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        
        // Edge breakup for organic clumping of moss along the mound perimeter
        float nEdge = (terrainFbm(vTerrainWorldPos.xz * 1.4) - 0.5) * 0.09;
        float nMicro = terrainFbm(vTerrainWorldPos.xz * 5.2);
        float effectiveH = vElevation + nEdge;

        // Lush moss blend: starts at ~0.035m baseline, transitions to full moss cover by 0.18m
        float mossBlend = smoothstep(0.035, 0.18, effectiveH);

        // Authentic Japanese moss palette (Kyoto Saihō-ji / Tōfuku-ji velvet moss mounds)
        vec3 cMossDeep = vec3(0.19, 0.35, 0.15);   // Rich forest velvet
        vec3 cMossMid = vec3(0.28, 0.48, 0.20);    // Vibrant emerald moss
        vec3 cMossLight = vec3(0.38, 0.59, 0.25);  // Sunlit chartreuse tips
        vec3 cMossWarm = vec3(0.44, 0.53, 0.22);   // Autumnal golden moss tip

        float patchNoise = terrainFbm(vTerrainWorldPos.xz * 0.65);
        vec3 mossColor = mix(cMossDeep, cMossMid, patchNoise);
        mossColor = mix(mossColor, cMossLight, nMicro * 0.42);
        mossColor = mix(mossColor, cMossWarm, patchNoise * 0.22);

        // Pond silt and damp pebble bank when carved below baseline
        float pondBlend = smoothstep(-0.02, -0.16, vElevation);
        vec3 siltColor = vec3(0.15, 0.21, 0.19) * (0.8 + 0.35 * nMicro);

        // Blend diffuse color: pristine sand -> lush moss mounds -> pond bed
        diffuseColor.rgb = mix(diffuseColor.rgb, mossColor, mossBlend);
        diffuseColor.rgb = mix(diffuseColor.rgb, siltColor, pondBlend);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        // Velvet moss has soft high roughness for plush velvet look
        roughnessFactor = mix(roughnessFactor, 0.96, mossBlend * 0.9);
        // Pond basin bed is wet and smoother
        roughnessFactor = mix(roughnessFactor, 0.28, pondBlend * 0.85);`
      );
    };

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.name = 'zen_terrain';
    this.scene.add(this.mesh);
  }

  createWaterPlane() {
    // Reflective translucent pond layer revealed when carved down
    const waterGeo = new THREE.PlaneGeometry(this.size * 0.98, this.size * 0.98, 40, 40);
    waterGeo.rotateX(-Math.PI / 2);

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x328ea8,
      roughness: 0.04,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.position.y = -0.16; // Placed right below flat sand baseline (y = 0.0)
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  createWoodenBorders() {
    // Traditional dark cedar / Japanese cypress (Hinoki) sandbox frame
    const frameGroup = new THREE.Group();
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.7,
      metalness: 0.1
    });

    const borderThickness = 0.7;
    const borderHeight = 0.55;
    const halfSize = this.size / 2;

    // 4 Border beams
    const beamGeoX = new THREE.BoxGeometry(this.size + borderThickness * 2, borderHeight, borderThickness);
    const beamGeoZ = new THREE.BoxGeometry(borderThickness, borderHeight, this.size);

    const northBeam = new THREE.Mesh(beamGeoX, borderMat);
    northBeam.position.set(0, borderHeight * 0.35, -halfSize - borderThickness / 2);
    northBeam.castShadow = true;
    northBeam.receiveShadow = true;

    const southBeam = new THREE.Mesh(beamGeoX, borderMat);
    southBeam.position.set(0, borderHeight * 0.35, halfSize + borderThickness / 2);
    southBeam.castShadow = true;
    southBeam.receiveShadow = true;

    const eastBeam = new THREE.Mesh(beamGeoZ, borderMat);
    eastBeam.position.set(halfSize + borderThickness / 2, borderHeight * 0.35, 0);
    eastBeam.castShadow = true;
    eastBeam.receiveShadow = true;

    const westBeam = new THREE.Mesh(beamGeoZ, borderMat);
    westBeam.position.set(-halfSize - borderThickness / 2, borderHeight * 0.35, 0);
    westBeam.castShadow = true;
    westBeam.receiveShadow = true;

    frameGroup.add(northBeam, southBeam, eastBeam, westBeam);

    // Surrounding outer dark river pebble bed
    const outerGeo = new THREE.RingGeometry(this.size * 0.7, this.size * 1.3, 32);
    outerGeo.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.95,
      metalness: 0.05
    });
    const outerPebble = new THREE.Mesh(outerGeo, outerMat);
    outerPebble.position.y = -0.25;
    outerPebble.receiveShadow = true;
    frameGroup.add(outerPebble);

    this.scene.add(frameGroup);
    this.borders = frameGroup;
  }

  // World coordinate to canvas UV pixel coordinates
  worldToCanvas(worldX, worldZ) {
    const u = (worldX / this.size) + 0.5;
    const v = (worldZ / this.size) + 0.5;
    return {
      x: Math.floor(THREE.MathUtils.clamp(u, 0, 1) * this.texResolution),
      y: Math.floor(THREE.MathUtils.clamp(v, 0, 1) * this.texResolution)
    };
  }

  canvasToWorld(cx, cy) {
    const u = cx / this.texResolution;
    const v = cy / this.texResolution;
    return {
      x: (u - 0.5) * this.size,
      z: (v - 0.5) * this.size
    };
  }

  // Apply brush action at world coordinate
  applyBrush(point, lastPoint, isDragging) {
    const tool = this.brush.tool;
    const radius = this.brush.radius;
    const strength = this.brush.strength;

    switch (tool) {
      case 'sculpt-raise':
        this.deformTerrain(point, radius, strength * 0.15);
        break;
      case 'sculpt-lower':
        this.deformTerrain(point, radius, -strength * 0.15);
        break;
      case 'smooth':
        this.smoothTerrain(point, radius, strength * 0.35);
        break;
      case 'paint-moss':
        this.paintSurface(point, radius, 'moss', strength);
        break;
      case 'paint-sand':
        this.paintSurface(point, radius, 'sand', strength);
        break;
      case 'water-pool':
        this.carveWaterPool(point, radius, strength);
        break;
    }
  }

  // Nest placed stone in moss bedding if requested
  nestStoneInMoss(x, z, radius = 1.6) {
    this.paintSurface({ x, z }, radius, 'moss', 0.85);
  }

  // 3. Terrain Sculpting (Raise hills / Lower depressions)
  deformTerrain(center, radius, amount) {
    const pos = this.geometry.attributes.position;
    let modified = false;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const dist = Math.hypot(vx - center.x, vz - center.z);

      if (dist < radius) {
        // Smooth cosine bell curve falloff
        const falloff = 0.5 * (1 + Math.cos((dist / radius) * Math.PI));
        const delta = amount * falloff;
        const newY = Math.max(-1.8, Math.min(2.5, pos.getY(i) + delta));
        pos.setY(i, newY);
        modified = true;
      }
    }

    if (modified) {
      pos.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }
  }

  // 4. Smooth / Level Brush
  smoothTerrain(center, radius, strength) {
    const pos = this.geometry.attributes.position;
    const indicesInBrush = [];
    let avgY = 0;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const dist = Math.hypot(vx - center.x, vz - center.z);
      if (dist < radius) {
        indicesInBrush.push({ index: i, dist });
        avgY += pos.getY(i);
      }
    }

    if (indicesInBrush.length > 0) {
      avgY /= indicesInBrush.length;
      for (const item of indicesInBrush) {
        const falloff = 0.5 * (1 + Math.cos((item.dist / radius) * Math.PI));
        const curY = pos.getY(item.index);
        pos.setY(item.index, curY + (avgY - curY) * strength * falloff);
      }
      pos.needsUpdate = true;
      this.geometry.computeVertexNormals();
    }

    // Also smooth sand texture towards base sand color
    this.paintSurface(center, radius, 'smooth-sand', strength * 0.4);
  }

  // 5. Paint Surface (Lush Green Moss or Pure White Sand)
  paintSurface(center, radius, type, strength) {
    const cp = this.worldToCanvas(center.x, center.z);
    const radiusPx = (radius / this.size) * this.texResolution;

    const grad = this.ctx.createRadialGradient(
      cp.x, cp.y, 0,
      cp.x, cp.y, radiusPx
    );

    if (type === 'moss') {
      // Elevate terrain vertices under moss brush to grow thick cushion beds
      const pos = this.geometry.attributes.position;
      let modified = false;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const dist = Math.hypot(vx - center.x, vz - center.z);
        if (dist < radius) {
          const falloff = 0.5 * (1 + Math.cos((dist / radius) * Math.PI));
          const curY = pos.getY(i);
          // Gently lift up to a plush cushion bed cap (~0.4m)
          if (curY < 0.42) {
            pos.setY(i, curY + 0.04 * strength * falloff);
            modified = true;
          }
        }
      }
      if (modified) {
        pos.needsUpdate = true;
        this.geometry.computeVertexNormals();
      }

      // Lush multi-hue Japanese garden moss (velvet emerald & chartreuse)
      const mossHue = Math.random() > 0.5 ? 'rgba(74, 119, 61, ' : 'rgba(52, 90, 48, ';
      grad.addColorStop(0, `${mossHue}${Math.min(1, strength * 0.95)})`);
      grad.addColorStop(0.4, `rgba(82, 126, 62, ${strength * 0.75})`);
      grad.addColorStop(0.7, `rgba(98, 142, 70, ${strength * 0.5})`);
      grad.addColorStop(1, 'rgba(88, 128, 68, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cp.x, cp.y, radiusPx, 0, Math.PI * 2);
      this.ctx.fill();

      // Organic stippling around edges
      this.addOrganicMossSplat(cp.x, cp.y, radiusPx);
      this.addMossNormals(cp.x, cp.y, radiusPx);
    } else if (type === 'sand' || type === 'smooth-sand') {
      // Restore sand - gently lower moss cushions back towards baseline
      const pos = this.geometry.attributes.position;
      let modified = false;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const dist = Math.hypot(vx - center.x, vz - center.z);
        if (dist < radius) {
          const falloff = 0.5 * (1 + Math.cos((dist / radius) * Math.PI));
          const curY = pos.getY(i);
          if (curY > 0.05) {
            pos.setY(i, Math.max(0, curY - 0.05 * strength * falloff));
            modified = true;
          }
        }
      }
      if (modified) {
        pos.needsUpdate = true;
        this.geometry.computeVertexNormals();
      }

      grad.addColorStop(0, `rgba(235, 225, 206, ${Math.min(1, strength * 0.85)})`);
      grad.addColorStop(0.7, `rgba(232, 222, 200, ${strength * 0.45})`);
      grad.addColorStop(1, 'rgba(232, 222, 200, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cp.x, cp.y, radiusPx, 0, Math.PI * 2);
      this.ctx.fill();

      // Clear normal bumps back to flat normal
      this.normalCtx.save();
      this.normalCtx.fillStyle = 'rgba(128, 128, 255, 0.4)';
      this.normalCtx.beginPath();
      this.normalCtx.arc(cp.x, cp.y, radiusPx, 0, Math.PI * 2);
      this.normalCtx.fill();
      this.normalCtx.restore();
      this.normalTexture.needsUpdate = true;
    }

    this.sandTexture.needsUpdate = true;
  }

  addMossNormals(cx, cy, rPx) {
    this.normalCtx.save();
    const count = Math.min(22, Math.floor(rPx * 0.35));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * rPx;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const spotR = 3 + Math.random() * 8;

      const nr = 120 + Math.floor(Math.random() * 30);
      const ng = 120 + Math.floor(Math.random() * 30);
      this.normalCtx.fillStyle = `rgb(${nr}, ${ng}, 240)`;
      this.normalCtx.beginPath();
      this.normalCtx.arc(px, py, spotR, 0, Math.PI * 2);
      this.normalCtx.fill();
    }
    this.normalCtx.restore();
    this.normalTexture.needsUpdate = true;
  }

  addOrganicMossSplat(cx, cy, rPx) {
    this.ctx.save();
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (0.3 + Math.random() * 0.7) * rPx;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const spotR = (2 + Math.random() * 8) * (rPx / 60);

      this.ctx.fillStyle = Math.random() > 0.4 ? 'rgba(68, 105, 52, 0.4)' : 'rgba(92, 138, 70, 0.35)';
      this.ctx.beginPath();
      this.ctx.arc(px, py, spotR, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  // 6. Carve Water Pool / Pond
  carveWaterPool(center, radius, strength) {
    this.deformTerrain(center, radius, -strength * 0.45);
    // Darken pool floor with pebble and damp wet silt
    const cp = this.worldToCanvas(center.x, center.z);
    const radiusPx = (radius / this.size) * this.texResolution;

    const grad = this.ctx.createRadialGradient(
      cp.x, cp.y, 0,
      cp.x, cp.y, radiusPx
    );
    grad.addColorStop(0, 'rgba(42, 60, 58, 0.65)');
    grad.addColorStop(0.7, 'rgba(60, 80, 72, 0.4)');
    grad.addColorStop(1, 'rgba(60, 80, 72, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cp.x, cp.y, radiusPx, 0, Math.PI * 2);
    this.ctx.fill();
    this.sandTexture.needsUpdate = true;
  }

  // Get exact terrain height at world (x, z)
  getHeightAt(x, z) {
    const half = this.size / 2;
    if (x < -half || x > half || z < -half || z > half) return 0;

    const u = (x / this.size) + 0.5;
    const v = (z / this.size) + 0.5;

    const seg = this.segments;
    const gx = THREE.MathUtils.clamp(u * seg, 0, seg - 1);
    const gz = THREE.MathUtils.clamp(v * seg, 0, seg - 1);

    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const fx = gx - x0;
    const fz = gz - z0;

    const pos = this.geometry.attributes.position;
    const getH = (ix, iz) => {
      const idx = iz * (seg + 1) + ix;
      return idx < pos.count ? pos.getY(idx) : 0;
    };

    // Bilinear interpolation
    const h00 = getH(x0, z0);
    const h10 = getH(x0 + 1, z0);
    const h01 = getH(x0, z0 + 1);
    const h11 = getH(x0 + 1, z0 + 1);

    const hTop = THREE.MathUtils.lerp(h00, h10, fx);
    const hBottom = THREE.MathUtils.lerp(h01, h11, fx);
    return THREE.MathUtils.lerp(hTop, hBottom, fz);
  }

  // Reset terrain to calm pristine flat sand
  resetToFlat() {
    const pos = this.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, this.initialHeights[i]);
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();

    this.initTextures();
    this.saveState();
  }

  // Undo / Redo State Management
  saveState() {
    const pos = this.geometry.attributes.position;
    const heightSnapshot = new Float32Array(pos.array);
    const imgData = this.ctx.getImageData(0, 0, this.texResolution, this.texResolution);

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push({
      heights: heightSnapshot,
      imgData: imgData
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
      return true;
    }
    return false;
  }

  restoreState(state) {
    if (!state) return;
    const pos = this.geometry.attributes.position;
    pos.array.set(state.heights);
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();

    this.ctx.putImageData(state.imgData, 0, 0);
    this.sandTexture.needsUpdate = true;
  }
}
