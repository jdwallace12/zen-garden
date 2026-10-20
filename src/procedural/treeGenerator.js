import * as THREE from 'three';
import { SimplexNoise } from '../utils/noise.js';

// Procedural Tree & Shrub Generator for Japanese Garden flora:
// - Matsu (Japanese Black/Red Pine / Bonsai)
// - Momiji (Japanese Red Maple)
// - Take (Bamboo Culm Grove)
// - Sakura (Japanese Cherry Blossom)
// - Tsutsuji / Satsuki (Cloud-Pruned Azalea Shrub)

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

    // 6. Azalea (Tsutsuji / Satsuki) Shrub Materials
    const azaleaBarkMat = new THREE.MeshStandardMaterial({
      color: 0x3a281c,
      roughness: 0.88,
      metalness: 0.04
    });

    const azaleaFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x1d3d22, // Rich dark evergreen clipped foliage
      roughness: 0.74,
      metalness: 0.03,
      flatShading: true
    });

    const azaleaFoliageLightMat = new THREE.MeshStandardMaterial({
      color: 0x2b522e, // Sunlit crest foliage highlight
      roughness: 0.70,
      metalness: 0.03,
      flatShading: true
    });

    const azaleaFoliageDarkMat = new THREE.MeshStandardMaterial({
      color: 0x132616, // Shadowed deep pillow foliage
      roughness: 0.85,
      metalness: 0.02,
      flatShading: true
    });

    const azaleaFlowerPinkMat = new THREE.MeshStandardMaterial({
      color: 0xe92a76, // Vibrant fuchsia-rose Tsutsuji petal
      roughness: 0.42,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    const azaleaFlowerPinkCenterMat = new THREE.MeshStandardMaterial({
      color: 0x990038, // Deep ruby blossom throat
      roughness: 0.5
    });

    const azaleaFlowerWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb, // Pure snowy white Satsuki petal
      roughness: 0.40,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const azaleaFlowerWhiteCenterMat = new THREE.MeshStandardMaterial({
      color: 0xb7d686, // Pale lime-green heart
      roughness: 0.5
    });

    const azaleaStamenMat = new THREE.MeshStandardMaterial({
      color: 0xffd149,
      emissive: 0xff9900,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });

    const azaleaBudPinkMat = new THREE.MeshStandardMaterial({
      color: 0xb71c53,
      roughness: 0.6,
      flatShading: true
    });

    const azaleaBudWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xdde6cf,
      roughness: 0.6,
      flatShading: true
    });

    return {
      pineBark: pineBarkMat,
      mapleBark: mapleBarkMat,
      pineFoliage: pineFoliageMat,
      mapleFoliage: mapleFoliageMat,
      sakuraFoliage: sakuraFoliageMat,
      bamboo: bambooMat,
      bambooLeaf: bambooLeafMat,
      azaleaBark: azaleaBarkMat,
      azaleaFoliage: azaleaFoliageMat,
      azaleaFoliageLight: azaleaFoliageLightMat,
      azaleaFoliageDark: azaleaFoliageDarkMat,
      azaleaFlowerPink: azaleaFlowerPinkMat,
      azaleaFlowerPinkCenter: azaleaFlowerPinkCenterMat,
      azaleaFlowerWhite: azaleaFlowerWhiteMat,
      azaleaFlowerWhiteCenter: azaleaFlowerWhiteCenterMat,
      azaleaStamen: azaleaStamenMat,
      azaleaBudPink: azaleaBudPinkMat,
      azaleaBudWhite: azaleaBudWhiteMat
    };
  }

  // Create tree / shrub entry point
  // Type: 'pine', 'maple', 'sakura', 'bamboo', 'azalea', 'azalea-white'
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
    } else if (type === 'azalea-white') {
      this.buildAzaleaShrub(group, scale, 'white');
    } else if (type === 'azalea' || type === 'shrub' || type === 'azaleas' || type === 'azalea-pink') {
      this.buildAzaleaShrub(group, scale, 'pink');
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

  // 5. Traditional Sculpted Azalea Shrub (Tsutsuji / Satsuki Tamamono)
  // Pruned into undulating rounded pillow mounds with dense foliage, star blossoms & buds
  buildAzaleaShrub(group, scale, variant = 'pink') {
    const isWhite = variant === 'white';
    const flowerMat = isWhite ? this.materials.azaleaFlowerWhite : this.materials.azaleaFlowerPink;
    const centerMat = isWhite ? this.materials.azaleaFlowerWhiteCenter : this.materials.azaleaFlowerPinkCenter;
    const budMat = isWhite ? this.materials.azaleaBudWhite : this.materials.azaleaBudPink;

    // 1. Gnarled low woody trunk and ground stems
    const baseGroup = new THREE.Group();
    const centralStemGeo = new THREE.CylinderGeometry(0.045, 0.08, 0.22, 6);
    const centralStem = new THREE.Mesh(centralStemGeo, this.materials.azaleaBark);
    centralStem.position.y = 0.11;
    centralStem.castShadow = true;
    baseGroup.add(centralStem);

    // Radiating branch supports into foliage mounds
    const armConfigs = [
      new THREE.Vector3(0.35, 0.22, 0.18),
      new THREE.Vector3(-0.32, 0.24, -0.16),
      new THREE.Vector3(-0.18, 0.18, 0.30),
      new THREE.Vector3(0.18, 0.16, -0.32)
    ];

    armConfigs.forEach(armEnd => {
      const armCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.08, 0),
        new THREE.Vector3(armEnd.x * 0.5, armEnd.y * 0.6, armEnd.z * 0.5),
        armEnd
      ]);
      const armGeo = new THREE.TubeGeometry(armCurve, 6, 0.035, 5, false);
      const armMesh = new THREE.Mesh(armGeo, this.materials.azaleaBark);
      armMesh.castShadow = true;
      baseGroup.add(armMesh);
    });
    group.add(baseGroup);

    // 2. Sculpted Tamamono (Cloud Pillow) Foliage Mounds
    // A primary central dome flanked by 4 asymmetrical overlapping cushions
    const mounds = [
      {
        pos: new THREE.Vector3(0, 0.38, 0),
        radius: 0.62,
        scale: new THREE.Vector3(1.22, 0.64, 1.14),
        mat: this.materials.azaleaFoliageLight,
        flowerCount: 22,
        budCount: 8
      },
      {
        pos: new THREE.Vector3(0.44, 0.28, 0.22),
        radius: 0.48,
        scale: new THREE.Vector3(1.15, 0.58, 1.05),
        mat: this.materials.azaleaFoliage,
        flowerCount: 16,
        budCount: 5
      },
      {
        pos: new THREE.Vector3(-0.38, 0.28, -0.22),
        radius: 0.45,
        scale: new THREE.Vector3(1.12, 0.60, 1.06),
        mat: this.materials.azaleaFoliage,
        flowerCount: 15,
        budCount: 5
      },
      {
        pos: new THREE.Vector3(-0.24, 0.22, 0.38),
        radius: 0.40,
        scale: new THREE.Vector3(1.08, 0.54, 1.0),
        mat: this.materials.azaleaFoliageDark,
        flowerCount: 12,
        budCount: 4
      },
      {
        pos: new THREE.Vector3(0.24, 0.20, -0.38),
        radius: 0.38,
        scale: new THREE.Vector3(1.05, 0.52, 1.0),
        mat: this.materials.azaleaFoliageDark,
        flowerCount: 12,
        budCount: 4
      }
    ];

    // Shared reusable single blossom geometry (5 flared star petals)
    const flowerGeo = this.createAzaleaFlowerGeometry();
    const flowerCenterGeo = new THREE.CircleGeometry(0.026, 6);
    const stamenGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.022, 4);
    const budGeo = new THREE.DodecahedronGeometry(0.032, 1);

    mounds.forEach((mound) => {
      const mGeo = new THREE.IcosahedronGeometry(mound.radius, 2);
      const posAttr = mGeo.attributes.position;

      // Deform foliage vertices for lush organic pruned hedge effect
      for (let i = 0; i < posAttr.count; i++) {
        let vx = posAttr.getX(i);
        let vy = posAttr.getY(i);
        let vz = posAttr.getZ(i);

        // Flatten underside so mound nestles firmly on ground/moss
        if (vy < -0.05) {
          vy *= 0.26;
        }

        // Noise micro-undulations for foliage texture
        const n = this.noise.noise2D((vx + mound.pos.x) * 4.0, (vz + mound.pos.z) * 4.0) * 0.045;
        vx += vx * n;
        vy += vy * n;
        vz += vz * n;

        posAttr.setXYZ(i, vx, vy, vz);
      }
      mGeo.computeVertexNormals();

      const mMesh = new THREE.Mesh(mGeo, mound.mat);
      mMesh.position.copy(mound.pos);
      mMesh.scale.copy(mound.scale);
      mMesh.castShadow = true;
      mMesh.receiveShadow = true;
      group.add(mMesh);

      // Place flowering blossoms across upper canopy of this mound
      for (let f = 0; f < mound.flowerCount; f++) {
        const phi = 0.18 + Math.random() * 0.95; // Polar angle (upper hemisphere)
        const theta = Math.random() * Math.PI * 2; // Azimuth angle

        // Position on ellipsoid surface
        const rx = mound.radius * mound.scale.x;
        const ry = mound.radius * mound.scale.y;
        const rz = mound.radius * mound.scale.z;

        const lx = Math.sin(phi) * Math.cos(theta) * rx;
        const ly = Math.cos(phi) * ry;
        const lz = Math.sin(phi) * Math.sin(theta) * rz;

        const worldFlowerPos = new THREE.Vector3(
          mound.pos.x + lx * 0.98,
          mound.pos.y + ly * 0.98,
          mound.pos.z + lz * 0.98
        );

        // Normal pointing outward from mound center
        const normal = new THREE.Vector3(lx / (rx * rx), ly / (ry * ry), lz / (rz * rz)).normalize();

        const flowerGroup = new THREE.Group();
        flowerGroup.position.copy(worldFlowerPos);

        // Orient along surface normal with random axial spin
        flowerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        flowerGroup.rotateY(Math.random() * Math.PI * 2);

        // Petal mesh
        const petalMesh = new THREE.Mesh(flowerGeo, flowerMat);
        petalMesh.castShadow = true;
        flowerGroup.add(petalMesh);

        // Center throat disc
        const centerMesh = new THREE.Mesh(flowerCenterGeo, centerMat);
        centerMesh.position.y = 0.005;
        centerMesh.rotation.x = -Math.PI / 2;
        flowerGroup.add(centerMesh);

        // Delicate golden stamen cluster
        for (let s = 0; s < 3; s++) {
          const sMesh = new THREE.Mesh(stamenGeo, this.materials.azaleaStamen);
          sMesh.position.set(
            (Math.random() - 0.5) * 0.012,
            0.014,
            (Math.random() - 0.5) * 0.012
          );
          sMesh.rotation.z = (Math.random() - 0.5) * 0.35;
          sMesh.rotation.x = (Math.random() - 0.5) * 0.35;
          flowerGroup.add(sMesh);
        }

        const flowerScale = 0.85 + Math.random() * 0.35;
        flowerGroup.scale.setScalar(flowerScale);
        group.add(flowerGroup);
      }

      // Add unopened flower buds tucked into foliage
      for (let b = 0; b < mound.budCount; b++) {
        const phi = 0.3 + Math.random() * 0.9;
        const theta = Math.random() * Math.PI * 2;

        const rx = mound.radius * mound.scale.x;
        const ry = mound.radius * mound.scale.y;
        const rz = mound.radius * mound.scale.z;

        const bPos = new THREE.Vector3(
          mound.pos.x + Math.sin(phi) * Math.cos(theta) * rx * 0.97,
          mound.pos.y + Math.cos(phi) * ry * 0.97,
          mound.pos.z + Math.sin(phi) * Math.sin(theta) * rz * 0.97
        );

        const budMesh = new THREE.Mesh(budGeo, budMat);
        budMesh.scale.set(0.8, 1.4, 0.8);
        budMesh.position.copy(bPos);
        budMesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        budMesh.castShadow = true;
        group.add(budMesh);
      }
    });

    group.scale.setScalar(scale);
  }

  createAzaleaFlowerGeometry() {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    // Center vertex (index 0)
    positions.push(0, 0.003, 0);

    let vIdx = 1;
    // 5 flared petals
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const baseSpread = 0.28;
      const midSpread = 0.44;

      // Base left & right
      const blX = Math.cos(angle - baseSpread) * 0.024;
      const blZ = Math.sin(angle - baseSpread) * 0.024;
      const brX = Math.cos(angle + baseSpread) * 0.024;
      const brZ = Math.sin(angle + baseSpread) * 0.024;

      // Mid flared left & right (slightly cupped upward)
      const mlX = Math.cos(angle - midSpread) * 0.065;
      const mlZ = Math.sin(angle - midSpread) * 0.065;
      const mrX = Math.cos(angle + midSpread) * 0.065;
      const mrZ = Math.sin(angle + midSpread) * 0.065;

      // Petal rounded tip (flared slightly upward)
      const tipX = Math.cos(angle) * 0.096;
      const tipZ = Math.sin(angle) * 0.096;

      const idxBL = vIdx++;
      const idxBR = vIdx++;
      const idxML = vIdx++;
      const idxMR = vIdx++;
      const idxTip = vIdx++;

      positions.push(
        blX, 0.006, blZ,
        brX, 0.006, brZ,
        mlX, 0.018, mlZ,
        mrX, 0.018, mrZ,
        tipX, 0.028, tipZ
      );

      // Triangles:
      // Center -> BL -> ML
      indices.push(0, idxBL, idxML);
      // Center -> ML -> Tip
      indices.push(0, idxML, idxTip);
      // Center -> Tip -> MR
      indices.push(0, idxTip, idxMR);
      // Center -> MR -> BR
      indices.push(0, idxMR, idxBR);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
}

export const treeGenerator = new TreeGenerator();
