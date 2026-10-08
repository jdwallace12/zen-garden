import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

// Procedural Tree Generator for Japanese Garden flora:
// - Matsu (Japanese Black/Red Pine / Bonsai)
// - Momiji (Japanese Red Maple)
// - Take (Bamboo Culm Grove)
// - Sakura (Japanese Cherry Blossom)

export class TreeGenerator {
  constructor() {
    this.noise = new SimplexNoise(555);
    this.materials = this.createMaterials();
  }

  createMaterials() {
    // 1. Trunk Wood Bark Material
    const barkCanvas = document.createElement('canvas');
    barkCanvas.width = 256;
    barkCanvas.height = 256;
    const bCtx = barkCanvas.getContext('2d');
    bCtx.fillStyle = '#443224';
    bCtx.fillRect(0, 0, 256, 256);

    // Bark grooves
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x += 3) {
        const n = this.noise.noise2D(x * 0.2, y * 0.05);
        if (n > 0.15) {
          bCtx.fillStyle = 'rgba(28, 18, 12, 0.45)';
          bCtx.fillRect(x, y, 2, 1);
        } else if (n < -0.15) {
          bCtx.fillStyle = 'rgba(85, 65, 48, 0.35)';
          bCtx.fillRect(x, y, 2, 1);
        }
      }
    }
    const barkTex = new THREE.CanvasTexture(barkCanvas);
    barkTex.wrapS = THREE.RepeatWrapping;
    barkTex.wrapT = THREE.RepeatWrapping;

    const pineBarkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      roughness: 0.9,
      metalness: 0.05
    });

    const mapleBarkMat = new THREE.MeshStandardMaterial({
      color: 0x3d3028,
      roughness: 0.85,
      metalness: 0.05
    });

    // 2. Pine Cloud Foliage (Deep evergreen needle clusters)
    const pineFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x1d472c,
      roughness: 0.82,
      metalness: 0.02,
      flatShading: true
    });

    // 3. Momiji Red Maple Foliage (Luminous scarlet / crimson)
    const mapleFoliageMat = new THREE.MeshStandardMaterial({
      color: 0xaf2b2b,
      roughness: 0.65,
      metalness: 0.05,
      flatShading: true
    });

    // 4. Sakura Blossom Foliage (Soft pastel pink)
    const sakuraFoliageMat = new THREE.MeshStandardMaterial({
      color: 0xf5b5c8,
      roughness: 0.7,
      metalness: 0.02,
      flatShading: true
    });

    // 5. Bamboo Culm Material (Glossy green stem with darker node rings)
    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0x5a8a3a,
      roughness: 0.45,
      metalness: 0.08
    });

    const bambooLeafMat = new THREE.MeshStandardMaterial({
      color: 0x76ab42,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    return {
      pineBark: pineBarkMat,
      mapleBark: mapleBarkMat,
      pineFoliage: pineFoliageMat,
      mapleFoliage: mapleFoliageMat,
      sakuraFoliage: sakuraFoliageMat,
      bamboo: bambooMat,
      bambooLeaf: bambooLeafMat
    };
  }

  // Create tree entry point
  // Type: 'pine', 'maple', 'sakura', 'bamboo'
  createTree(type = 'pine', scale = 1.0) {
    const group = new THREE.Group();
    group.name = `tree_${type}`;

    if (type === 'pine') {
      this.buildPineTree(group, scale);
    } else if (type === 'maple') {
      this.buildMapleTree(group, scale);
    } else if (type === 'sakura') {
      this.buildSakuraTree(group, scale);
    } else if (type === 'bamboo') {
      this.buildBambooGrove(group, scale);
    }

    return group;
  }

  // 1. Traditional Bonsai Pine (Niwaki / Matsu)
  // Characterized by sinuous angled trunk and tiered horizontal cloud foliage pads
  buildPineTree(group, scale) {
    const trunkCurvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 1.2, 0.2),
      new THREE.Vector3(1.1, 2.3, -0.2),
      new THREE.Vector3(0.8, 3.4, 0.3),
      new THREE.Vector3(0.3, 4.3, 0.0)
    ];

    // Add subtle procedural variation
    for (let i = 1; i < trunkCurvePoints.length; i++) {
      trunkCurvePoints[i].x += (Math.random() - 0.5) * 0.4;
      trunkCurvePoints[i].z += (Math.random() - 0.5) * 0.4;
    }

    const curve = new THREE.CatmullRomCurve3(trunkCurvePoints);
    const trunkGeo = new THREE.TubeGeometry(curve, 20, 0.28, 8, false);

    // Taper trunk geometry toward top
    const pos = trunkGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const taper = Math.max(0.3, 1.0 - (y / 4.5) * 0.65);
      pos.setX(i, pos.getX(i) * taper);
      pos.setZ(i, pos.getZ(i) * taper);
    }
    trunkGeo.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.pineBark);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    group.add(trunkMesh);

    // Major horizontal branching arms and foliage clouds
    const branchConfigs = [
      { start: trunkCurvePoints[2], dir: new THREE.Vector3(1.6, -0.2, 0.6), scalePad: 1.3 },
      { start: trunkCurvePoints[2], dir: new THREE.Vector3(-1.4, 0.3, -0.5), scalePad: 1.1 },
      { start: trunkCurvePoints[3], dir: new THREE.Vector3(1.2, 0.4, -0.7), scalePad: 1.2 },
      { start: trunkCurvePoints[3], dir: new THREE.Vector3(-0.9, 0.5, 0.8), scalePad: 1.0 },
      { start: trunkCurvePoints[4], dir: new THREE.Vector3(0.2, 0.6, 0.1), scalePad: 1.4 } // Crown
    ];

    branchConfigs.forEach(b => {
      // Branch arm
      const bCurve = new THREE.CatmullRomCurve3([
        b.start,
        b.start.clone().add(b.dir.clone().multiplyScalar(0.55)).add(new THREE.Vector3(0, 0.15, 0)),
        b.start.clone().add(b.dir)
      ]);
      const bGeo = new THREE.TubeGeometry(bCurve, 8, 0.12, 6, false);
      const bMesh = new THREE.Mesh(bGeo, this.materials.pineBark);
      bMesh.castShadow = true;
      group.add(bMesh);

      // Cloud foliage pad (flattened tiered ellipsoid / cluster)
      const padGroup = this.createCloudFoliagePad(b.scalePad, this.materials.pineFoliage);
      const tip = b.start.clone().add(b.dir);
      padGroup.position.copy(tip);
      group.add(padGroup);
    });

    group.scale.setScalar(scale);
  }

  createCloudFoliagePad(scale, material) {
    const pad = new THREE.Group();
    // Clustered low-poly flattened spheres
    const numSubClouds = 4;
    for (let i = 0; i < numSubClouds; i++) {
      const geo = new THREE.DodecahedronGeometry(0.55 * scale, 1);
      const m = new THREE.Mesh(geo, material);
      m.scale.set(1.4, 0.45, 1.2); // Distinct horizontal flattening
      m.position.set(
        (Math.random() - 0.5) * 0.6 * scale,
        (Math.random() - 0.5) * 0.2 * scale,
        (Math.random() - 0.5) * 0.6 * scale
      );
      m.rotation.y = Math.random() * Math.PI;
      m.castShadow = true;
      m.receiveShadow = true;
      pad.add(m);
    }
    return pad;
  }

  // 2. Japanese Red Maple (Momiji)
  buildMapleTree(group, scale) {
    const trunkCurvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.2, 1.4, 0.1),
      new THREE.Vector3(0.3, 2.6, -0.2),
      new THREE.Vector3(0.1, 3.8, 0.1)
    ];

    const curve = new THREE.CatmullRomCurve3(trunkCurvePoints);
    const trunkGeo = new THREE.TubeGeometry(curve, 14, 0.22, 7, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.mapleBark);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    group.add(trunkMesh);

    // Delicate airy radiating branches with crimson foliage
    const branchAngles = [0, 1.2, 2.4, 3.8, 5.0];
    branchAngles.forEach(ang => {
      const bLen = 1.3 + Math.random() * 0.5;
      const bTip = new THREE.Vector3(
        Math.cos(ang) * bLen,
        3.2 + (Math.random() - 0.5) * 0.8,
        Math.sin(ang) * bLen
      );

      const bCurve = new THREE.CatmullRomCurve3([
        trunkCurvePoints[2],
        new THREE.Vector3(bTip.x * 0.5, bTip.y - 0.2, bTip.z * 0.5),
        bTip
      ]);
      const bGeo = new THREE.TubeGeometry(bCurve, 6, 0.08, 5, false);
      const bMesh = new THREE.Mesh(bGeo, this.materials.mapleBark);
      bMesh.castShadow = true;
      group.add(bMesh);

      // Crimson foliage cluster
      const fGeo = new THREE.IcosahedronGeometry(0.85, 1);
      const fMesh = new THREE.Mesh(fGeo, this.materials.mapleFoliage);
      fMesh.scale.set(1.2, 0.6, 1.1);
      fMesh.position.copy(bTip);
      fMesh.castShadow = true;
      group.add(fMesh);
    });

    group.scale.setScalar(scale);
  }

  // 3. Japanese Cherry Blossom (Sakura)
  buildSakuraTree(group, scale) {
    const trunkCurvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 1.2, -0.1),
      new THREE.Vector3(0.6, 2.5, 0.2),
      new THREE.Vector3(0.2, 3.6, 0.0)
    ];

    const curve = new THREE.CatmullRomCurve3(trunkCurvePoints);
    const trunkGeo = new THREE.TubeGeometry(curve, 16, 0.26, 8, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.pineBark);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    group.add(trunkMesh);

    // Flowing canopy of soft pink blossoms
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
      const rad = 1.2 + Math.random() * 0.9;
      const pos = new THREE.Vector3(
        Math.cos(angle) * rad,
        3.2 + Math.random() * 1.2,
        Math.sin(angle) * rad
      );

      const flowerBall = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.75 + Math.random() * 0.35, 1),
        this.materials.sakuraFoliage
      );
      flowerBall.scale.set(1.2, 0.8, 1.2);
      flowerBall.position.copy(pos);
      flowerBall.castShadow = true;
      group.add(flowerBall);
    }

    group.scale.setScalar(scale);
  }

  // 4. Bamboo Grove (Take)
  // Cluster of 4-6 slender segmented bamboo stalks with joints and graceful foliage
  buildBambooGrove(group, scale) {
    const stalkCount = 4 + Math.floor(Math.random() * 3);

    for (let s = 0; s < stalkCount; s++) {
      const stalk = new THREE.Group();
      const offsetX = (Math.random() - 0.5) * 1.6;
      const offsetZ = (Math.random() - 0.5) * 1.6;
      stalk.position.set(offsetX, 0, offsetZ);

      const stalkHeight = 3.5 + Math.random() * 2.2;
      const segments = 8;
      const segHeight = stalkHeight / segments;

      // Segments with joint rings
      for (let j = 0; j < segments; j++) {
        const segGeo = new THREE.CylinderGeometry(0.065, 0.075, segHeight * 0.96, 7);
        const segMesh = new THREE.Mesh(segGeo, this.materials.bamboo);
        segMesh.position.y = j * segHeight + segHeight / 2;
        segMesh.castShadow = true;
        stalk.add(segMesh);

        // Bamboo node ring
        const ringGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.04, 7);
        const ringMesh = new THREE.Mesh(ringGeo, this.materials.bamboo);
        ringMesh.position.y = (j + 1) * segHeight;
        stalk.add(ringMesh);

        // Upper joints have delicate leaf tufts
        if (j >= segments - 4) {
          const leafGroup = this.createBambooLeaves();
          leafGroup.position.set(0, (j + 1) * segHeight, 0);
          leafGroup.rotation.y = Math.random() * Math.PI * 2;
          stalk.add(leafGroup);
        }
      }

      // Slight natural tilt
      stalk.rotation.z = (Math.random() - 0.5) * 0.12;
      stalk.rotation.x = (Math.random() - 0.5) * 0.12;

      group.add(stalk);
    }

    group.scale.setScalar(scale);
  }

  createBambooLeaves() {
    const leafGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const leafGeo = new THREE.PlaneGeometry(0.12, 0.6);
      const leafMesh = new THREE.Mesh(leafGeo, this.materials.bambooLeaf);
      leafMesh.position.set(0.2, -0.15, 0);
      leafMesh.rotation.z = -0.5 - (i * 0.2);
      leafMesh.rotation.y = (i * Math.PI) / 2;
      leafGroup.add(leafMesh);
    }
    return leafGroup;
  }
}

export const treeGenerator = new TreeGenerator();
