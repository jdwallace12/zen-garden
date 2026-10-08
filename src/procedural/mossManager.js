import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

// Procedural Volumetric Moss Growth System
// Handles growing thick 3D velvet moss cushions on terrain beds and organic moss clinging to rocks
export class MossManager {
  constructor(scene) {
    this.scene = scene;
    this.noise = new SimplexNoise(404);
    this.mossGroup = new THREE.Group();
    this.mossGroup.name = 'volumetric_moss_system';
    this.scene.add(this.mossGroup);

    // Track moss tufts: { mesh, parentObj, position, worldPos, radius }
    this.mossTufts = [];

    this.initMaterials();
    this.initGeometries();
  }

  initMaterials() {
    // Rich Japanese velvet moss palette
    const mossColors = [
      0x3d6630, // Deep forest moss
      0x4d7c38, // Emerald velvet moss
      0x5e9142, // Lush vibrant moss
      0x78a648, // Fresh sunlit chartreuse tip
      0x2f4d25  // Deep shadow damp crevice moss
    ];

    this.mossMaterials = mossColors.map(color => new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true
    }));
  }

  initGeometries() {
    // Pre-create organic cushion/pillow geometries
    this.cushionGeos = [
      this.createCushionGeometry(0.35, 0.18, 0.35),
      this.createCushionGeometry(0.25, 0.14, 0.28),
      this.createCushionGeometry(0.45, 0.22, 0.40)
    ];
  }

  createCushionGeometry(rx, ry, rz) {
    const geo = new THREE.DodecahedronGeometry(1.0, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) * rx;
      let y = pos.getY(i) * ry;
      let z = pos.getZ(i) * rz;

      // Flatten bottom so it nests flat on rocks/soil
      if (y < 0) {
        y *= 0.25;
      }
      // Add subtle noise deformation
      const n = this.noise.noise3D(x * 4, y * 4, z * 4) * 0.08;
      pos.setXYZ(i, x * (1 + n), Math.max(0, y * (1 + n)), z * (1 + n));
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Grow moss on a 3D Rock or object surface
  growMossOnRock(hit, brushRadius = 1.5, density = 4) {
    const targetObj = hit.object;
    const hitPoint = hit.point;
    const hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

    // Transform normal to world space
    hitNormal.transformDirection(targetObj.matrixWorld).normalize();

    // Spawn 2-5 moss tufts clustered around the contact point
    const count = Math.max(2, Math.floor(density * (brushRadius / 1.5)));
    for (let i = 0; i < count; i++) {
      // Offset slightly along tangent plane
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() * 0.7) * (brushRadius * 0.6);

      // Create tangent coordinate frame
      const tangent = new THREE.Vector3();
      if (Math.abs(hitNormal.y) > 0.9) {
        tangent.set(1, 0, 0);
      } else {
        tangent.crossVectors(hitNormal, new THREE.Vector3(0, 1, 0)).normalize();
      }
      const bitangent = new THREE.Vector3().crossVectors(hitNormal, tangent).normalize();

      const offset = tangent.clone().multiplyScalar(Math.cos(angle) * spread)
        .add(bitangent.clone().multiplyScalar(Math.sin(angle) * spread));

      const spawnPos = hitPoint.clone().add(offset).add(hitNormal.clone().multiplyScalar(0.02));

      // Check for overlapping moss to avoid excessive density in same spot
      if (this.isTooClose(spawnPos, 0.22)) continue;

      const geo = this.cushionGeos[Math.floor(Math.random() * this.cushionGeos.length)];
      const mat = this.mossMaterials[Math.floor(Math.random() * this.mossMaterials.length)];

      const mossMesh = new THREE.Mesh(geo, mat);
      const scale = 0.6 + Math.random() * 0.7;
      mossMesh.scale.setScalar(scale);

      // Orient cushion to hug rock normal
      const up = new THREE.Vector3(0, 1, 0);
      mossMesh.quaternion.setFromUnitVectors(up, hitNormal);
      mossMesh.rotateY(Math.random() * Math.PI * 2);

      mossMesh.position.copy(spawnPos);
      mossMesh.castShadow = true;
      mossMesh.receiveShadow = true;

      this.mossGroup.add(mossMesh);
      this.mossTufts.push({
        mesh: mossMesh,
        worldPos: spawnPos.clone(),
        parentObj: targetObj,
        radius: 0.25 * scale,
        isRock: true
      });
    }
  }

  // Grow thick 3D cushion moss beds on the ground
  growGroundMossBeds(center, radius = 2.0, terrainManager, count = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius * 0.85;
      const x = center.x + Math.cos(angle) * r;
      const z = center.z + Math.sin(angle) * r;

      const posCandidate = new THREE.Vector3(x, 0, z);
      if (this.isTooClose(posCandidate, 0.38)) continue;

      const y = terrainManager.getHeightAt(x, z);
      posCandidate.y = y + 0.02;

      const geo = this.cushionGeos[Math.floor(Math.random() * this.cushionGeos.length)];
      const mat = this.mossMaterials[Math.floor(Math.random() * this.mossMaterials.length)];

      const mossMesh = new THREE.Mesh(geo, mat);
      const scale = 0.9 + Math.random() * 0.8;
      mossMesh.scale.set(scale * (0.9 + Math.random() * 0.3), scale * (0.6 + Math.random() * 0.4), scale * (0.9 + Math.random() * 0.3));
      mossMesh.rotation.y = Math.random() * Math.PI * 2;
      mossMesh.position.copy(posCandidate);
      mossMesh.castShadow = true;
      mossMesh.receiveShadow = true;

      this.mossGroup.add(mossMesh);
      this.mossTufts.push({
        mesh: mossMesh,
        worldPos: posCandidate.clone(),
        parentObj: null,
        radius: 0.35 * scale,
        isRock: false
      });
    }
  }

  isTooClose(pos, minDist) {
    for (let i = this.mossTufts.length - 1; i >= Math.max(0, this.mossTufts.length - 50); i--) {
      if (this.mossTufts[i].worldPos.distanceTo(pos) < minDist) {
        return true;
      }
    }
    return false;
  }

  // Prune/remove moss tufts within a radius (e.g. when Sand Brush or Smooth Brush is used)
  pruneMossAt(center, radius) {
    const remaining = [];
    let removedAny = false;

    for (const tuft of this.mossTufts) {
      const dist = Math.hypot(tuft.worldPos.x - center.x, tuft.worldPos.z - center.z);
      if (dist < radius) {
        this.mossGroup.remove(tuft.mesh);
        removedAny = true;
      } else {
        remaining.push(tuft);
      }
    }

    this.mossTufts = remaining;
    return removedAny;
  }

  // Remove moss attached to a specific removed rock/object
  removeMossForObject(obj) {
    const remaining = [];
    for (const tuft of this.mossTufts) {
      if (tuft.parentObj === obj || (obj.children && obj.children.includes(tuft.parentObj))) {
        this.mossGroup.remove(tuft.mesh);
      } else {
        remaining.push(tuft);
      }
    }
    this.mossTufts = remaining;
  }

  clearAllMoss() {
    while (this.mossGroup.children.length > 0) {
      this.mossGroup.remove(this.mossGroup.children[0]);
    }
    this.mossTufts = [];
  }
}
