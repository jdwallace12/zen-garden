import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

// Procedural Japanese Rock (*Ishi*) Generator
// Generates natural weathered stones with granite grain, mossy footings, and authentic Karesansui rock profiles
export class RockGenerator {
  constructor() {
    this.noise = new SimplexNoise(777);
    this.rockMaterials = this.createRockMaterials();
  }

  createRockMaterials() {
    // Generate procedural granite/granodiorite texture
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#6e7072';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const n1 = this.noise.noise2D(x * 0.08, y * 0.08);
        const n2 = this.noise.noise2D(x * 0.25, y * 0.25);
        const fleck = Math.random() > 0.85 ? (Math.random() > 0.5 ? 40 : -40) : 0;

        const val = 110 + (n1 * 35) + (n2 * 20) + fleck;
        // Granite has slight cool bluish-grey or warm brownish-grey undertone
        d[i] = THREE.MathUtils.clamp(val * 0.98, 0, 255);
        d[i + 1] = THREE.MathUtils.clamp(val * 1.0, 0, 255);
        d[i + 2] = THREE.MathUtils.clamp(val * 0.95, 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const graniteTexture = new THREE.CanvasTexture(canvas);
    graniteTexture.wrapS = THREE.RepeatWrapping;
    graniteTexture.wrapT = THREE.RepeatWrapping;

    // Normal map for rugged stone texture
    const normCanvas = document.createElement('canvas');
    normCanvas.width = size;
    normCanvas.height = size;
    const normCtx = normCanvas.getContext('2d');
    normCtx.fillStyle = '#8080ff';
    normCtx.fillRect(0, 0, size, size);

    const nData = normCtx.getImageData(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const nx = Math.floor(128 + this.noise.noise2D(x * 0.1, y * 0.1) * 60);
        const ny = Math.floor(128 + this.noise.noise2D(x * 0.1 + 100, y * 0.1 + 100) * 60);
        nData.data[i] = nx;
        nData.data[i + 1] = ny;
        nData.data[i + 2] = 230;
        nData.data[i + 3] = 255;
      }
    }
    normCtx.putImageData(nData, 0, 0);

    const normalTexture = new THREE.CanvasTexture(normCanvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;

    return {
      granite: new THREE.MeshStandardMaterial({
        map: graniteTexture,
        normalMap: normalTexture,
        roughness: 0.85,
        metalness: 0.08,
        flatShading: false
      }),
      darkBasalt: new THREE.MeshStandardMaterial({
        color: 0x3a3d40,
        map: graniteTexture,
        roughness: 0.82,
        metalness: 0.12
      }),
      mossyStone: new THREE.MeshStandardMaterial({
        color: 0x5a6352,
        map: graniteTexture,
        roughness: 0.9,
        metalness: 0.05
      })
    };
  }

  // Create an organic deformed stone
  // Types: 'standing' (Taido), 'reclining' (Kikyaku), 'flat' (Shintai), 'triad' (San-zon-seki), 'stepping' (Tobi-ishi)
  createRock(type = 'standing', scale = 1.0, seed = Math.random() * 1000) {
    const group = new THREE.Group();
    group.name = `rock_${type}`;

    if (type === 'triad') {
      // Classical Buddhist Trinity Triad: 1 Tall Central Stone + 2 Flanking Attendants
      const center = this.generateSingleRock('standing', scale * 1.35, seed);
      center.position.set(0, 0, 0);

      const left = this.generateSingleRock('reclining', scale * 0.85, seed + 10);
      left.position.set(-scale * 1.5, 0, scale * 0.3);
      left.rotation.y = 0.4;

      const right = this.generateSingleRock('flat', scale * 0.95, seed + 20);
      right.position.set(scale * 1.4, 0, scale * 0.4);
      right.rotation.y = -0.5;

      group.add(center, left, right);
    } else {
      const rockMesh = this.generateSingleRock(type, scale, seed);
      group.add(rockMesh);
    }

    return group;
  }

  generateSingleRock(type, scale, seed) {
    // Start with subdivided icosahedron for spherical topology
    const detail = 3;
    const geometry = new THREE.IcosahedronGeometry(1.0, detail);
    const pos = geometry.attributes.position;
    const v = new THREE.Vector3();

    // Noise parameters
    const n = new SimplexNoise(seed);

    // Shape modifiers based on Japanese stone archetype
    let scaleX = 1.0, scaleY = 1.0, scaleZ = 1.0;
    if (type === 'standing') {
      scaleY = 1.6 + Math.random() * 0.4;
      scaleX = 0.95;
      scaleZ = 0.85;
    } else if (type === 'reclining') {
      scaleX = 1.5 + Math.random() * 0.3;
      scaleY = 0.85;
      scaleZ = 1.1;
    } else if (type === 'flat') {
      scaleX = 1.4;
      scaleY = 0.45;
      scaleZ = 1.3;
    } else if (type === 'stepping') {
      scaleX = 1.2;
      scaleY = 0.28;
      scaleZ = 1.1;
    }

    // Displace vertices with layered simplex noise
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      // Low frequency shape distortion
      const nLow = n.noise3D(v.x * 1.2, v.y * 1.2, v.z * 1.2) * 0.32;
      // High frequency craggy surface
      const nHigh = n.noise3D(v.x * 3.5, v.y * 3.5, v.z * 3.5) * 0.12;
      // Micro crags
      const nMicro = n.noise3D(v.x * 8.0, v.y * 8.0, v.z * 8.0) * 0.04;

      const displacement = 1.0 + nLow + nHigh + nMicro;
      v.multiplyScalar(displacement);

      // Apply archetype proportions
      v.x *= scaleX;
      v.y *= scaleY;
      v.z *= scaleZ;

      // Flatten bottom slightly so stone nests authentically in sand
      if (v.y < 0) {
        v.y *= 0.65;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geometry.computeVertexNormals();

    const mat = (type === 'stepping' || Math.random() > 0.4) 
      ? this.rockMaterials.granite 
      : (Math.random() > 0.5 ? this.rockMaterials.darkBasalt : this.rockMaterials.mossyStone);

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Raise mesh slightly above center so pivot is near its base
    geometry.computeBoundingBox();
    const minY = geometry.boundingBox.min.y * scale;
    mesh.position.y = -minY * 0.75; // Sink lower 25% into sand

    return mesh;
  }
}

export const rockGenerator = new RockGenerator();
