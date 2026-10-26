import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Static Grass Tuft System
// Follows the same pattern as MossManager — simple MeshStandardMaterial tufts
// placed via brush, no shader animation.
// ─────────────────────────────────────────────────────────────────────────────

export class GrassManager {
  constructor(scene) {
    this.scene = scene;
    this.noise = new SimplexNoise(707);
    this.grassGroup = new THREE.Group();
    this.grassGroup.name = 'grass_tuft_system';
    this.scene.add(this.grassGroup);

    // Track placed tufts: { mesh, worldPos, radius }
    this.grassTufts = [];

    this.initMaterials();
    this.initGeometries();
  }

  initMaterials() {
    // Warm natural grass palette — lighter / yellower than moss
    const grassColors = [
      0x5a8a30, // Medium grass green
      0x6b9e38, // Lush field green
      0x7db847, // Bright lime-chartreuse
      0x4e7a28, // Deep grass shadow
      0x8bc34a  // Fresh spring green
    ];

    this.grassMaterials = grassColors.map(color => new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
      side: THREE.DoubleSide
    }));
  }

  initGeometries() {
    // Create several grass-tuft cluster geometries of varying shape
    this.tuffGeos = [
      this.createGrassTuftGeometry(0.15, 0.30, 5),
      this.createGrassTuftGeometry(0.12, 0.22, 4),
      this.createGrassTuftGeometry(0.18, 0.35, 6)
    ];
  }

  /**
   * Build a small cluster of upright cones/spikes resembling grass blades.
   * @param {number} baseRadius  Horizontal spread of the cluster
   * @param {number} height      Max height of the tallest spike
   * @param {number} bladeCount  Number of spike sub-elements merged together
   */
  createGrassTuftGeometry(baseRadius, height, bladeCount) {
    const merged = new THREE.BufferGeometry();
    const geos = [];

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = Math.random() * baseRadius * 0.7;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const h = height * (0.5 + Math.random() * 0.5);
      const r = 0.015 + Math.random() * 0.015;

      // Cone = single grass blade/spike
      const cone = new THREE.ConeGeometry(r, h, 3, 1);

      // Slight random lean for natural look
      const lean = (Math.random() - 0.5) * 0.3;
      const leanMatrix = new THREE.Matrix4().makeRotationZ(lean);
      cone.applyMatrix4(leanMatrix);

      // Position it within the cluster
      const mat = new THREE.Matrix4().makeTranslation(x, h * 0.5, z);
      cone.applyMatrix4(mat);

      // Add subtle noise deformation
      const pos = cone.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        const vx = pos.getX(v);
        const vy = pos.getY(v);
        const vz = pos.getZ(v);
        const n = this.noise.noise3D(vx * 6, vy * 6, vz * 6) * 0.012;
        pos.setXYZ(v, vx + n, vy + n * 0.5, vz + n);
      }

      geos.push(cone);
    }

    // Merge all blade cones into one geometry
    const mergedGeo = this.mergeGeometries(geos);
    mergedGeo.computeVertexNormals();
    return mergedGeo;
  }

  /**
   * Simple geometry merge — concatenates vertex buffers and indices.
   */
  mergeGeometries(geometries) {
    const positions = [];
    const normals = [];
    const indices = [];
    let vertexOffset = 0;

    for (const geo of geometries) {
      const pos = geo.attributes.position;
      const norm = geo.attributes.normal;
      const idx = geo.index;

      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (norm) {
          normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
        }
      }

      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          indices.push(idx.getJ ? idx.getX(i) + vertexOffset : idx.array[i] + vertexOffset);
        }
      }

      vertexOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length > 0) {
      merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    }
    if (indices.length > 0) {
      merged.setIndex(indices);
    }
    return merged;
  }

  // ─── Paint Grass Tufts on Terrain ──────────────────────────────────────
  /**
   * Scatter grass tufts within a brush circle on the terrain.
   * @param {THREE.Vector3} center  World position of the brush center
   * @param {number}        radius  Brush radius in world units
   * @param {TerrainManager} terrainManager  Terrain reference for height sampling
   * @param {number}        density Number of tufts to attempt per stroke
   */
  paintGrassBlades(center, radius, terrainManager, density = 5) {
    const count = Math.max(2, Math.floor(density * (radius / 1.5)));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius * 0.85;
      const x = center.x + Math.cos(angle) * r;
      const z = center.z + Math.sin(angle) * r;

      const posCandidate = new THREE.Vector3(x, 0, z);
      if (this.isTooClose(posCandidate, 0.18)) continue;

      const y = terrainManager.getHeightAt(x, z);
      posCandidate.y = y + 0.01;

      const geo = this.tuffGeos[Math.floor(Math.random() * this.tuffGeos.length)];
      const mat = this.grassMaterials[Math.floor(Math.random() * this.grassMaterials.length)];

      const grassMesh = new THREE.Mesh(geo, mat);
      const scale = 0.7 + Math.random() * 0.8;
      grassMesh.scale.set(
        scale * (0.8 + Math.random() * 0.4),
        scale * (0.7 + Math.random() * 0.6),
        scale * (0.8 + Math.random() * 0.4)
      );
      grassMesh.rotation.y = Math.random() * Math.PI * 2;
      grassMesh.position.copy(posCandidate);
      grassMesh.castShadow = true;
      grassMesh.receiveShadow = true;

      this.grassGroup.add(grassMesh);
      this.grassTufts.push({
        mesh: grassMesh,
        worldPos: posCandidate.clone(),
        radius: 0.2 * scale
      });
    }
  }

  // ─── Proximity Check ──────────────────────────────────────────────────
  isTooClose(pos, minDist) {
    for (let i = this.grassTufts.length - 1; i >= Math.max(0, this.grassTufts.length - 50); i--) {
      if (this.grassTufts[i].worldPos.distanceTo(pos) < minDist) {
        return true;
      }
    }
    return false;
  }

  // ─── Prune / Remove Grass At Location ─────────────────────────────────
  pruneGrassAt(center, radius) {
    const remaining = [];
    let removedAny = false;

    for (const tuft of this.grassTufts) {
      const dist = Math.hypot(tuft.worldPos.x - center.x, tuft.worldPos.z - center.z);
      if (dist < radius) {
        this.grassGroup.remove(tuft.mesh);
        removedAny = true;
      } else {
        remaining.push(tuft);
      }
    }

    this.grassTufts = remaining;
    return removedAny;
  }

  // ─── Clear All Grass ──────────────────────────────────────────────────
  clearAllGrass() {
    while (this.grassGroup.children.length > 0) {
      this.grassGroup.remove(this.grassGroup.children[0]);
    }
    this.grassTufts = [];
  }

  // ─── Animation Update (no-op, kept for API compatibility) ─────────────
  update(elapsedTime, dt) {
    // Static grass — no animation needed
  }

  // ─── Getters ──────────────────────────────────────────────────────────
  get count() {
    return this.grassTufts.length;
  }
}
