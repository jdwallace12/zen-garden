import * as THREE from 'three';
import { zenAudio } from '../audio/zenAudio.js';

// Procedural Traditional Zen Garden Architecture & Living Elements
export class DecorationGenerator {
  constructor() {
    this.materials = this.createMaterials();
    this.animatedDecorations = [];
  }

  createMaterials() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x8a8880,
      roughness: 0.88,
      metalness: 0.05
    });

    const lanternCapMat = new THREE.MeshStandardMaterial({
      color: 0x76746d,
      roughness: 0.82,
      metalness: 0.05
    });

    const lanternInnerGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      emissive: 0xff8822,
      emissiveIntensity: 0.85,
      roughness: 0.3
    });

    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0x5a7e3a,
      roughness: 0.45,
      metalness: 0.08
    });

    const cedarWoodMat = new THREE.MeshStandardMaterial({
      color: 0x422d1f,
      roughness: 0.75,
      metalness: 0.05
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x336677,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });

    // Koi fish materials: Kohaku (White with vibrant red-orange markings)
    const koiMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.3,
      metalness: 0.1
    });

    const koiOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xe64a19,
      roughness: 0.3,
      metalness: 0.1
    });

    return {
      stone: stoneMat,
      lanternCap: lanternCapMat,
      lanternGlow: lanternInnerGlowMat,
      bamboo: bambooMat,
      cedarWood: cedarWoodMat,
      water: waterMat,
      koi: koiMat,
      koiOrange: koiOrangeMat
    };
  }

  // 1. Traditional Japanese Stone Lantern (Yukimi Tōrō - Snow-viewing Lantern)
  createLantern(scale = 1.0) {
    const group = new THREE.Group();
    group.name = 'zen_lantern';

    // 1. Curved 3-legged pedestal base
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.5, 6);
      const leg = new THREE.Mesh(legGeo, this.materials.stone);
      leg.position.set(Math.cos(angle) * 0.4, 0.25, Math.sin(angle) * 0.4);
      leg.rotation.z = Math.cos(angle) * 0.2;
      leg.rotation.x = Math.sin(angle) * 0.2;
      leg.castShadow = true;
      group.add(leg);
    }

    // 2. Middle base plate
    const midBaseGeo = new THREE.CylinderGeometry(0.65, 0.5, 0.2, 8);
    const midBase = new THREE.Mesh(midBaseGeo, this.materials.stone);
    midBase.position.y = 0.55;
    midBase.castShadow = true;
    group.add(midBase);

    // 3. Light chamber (Fire box / Hibukuro) with carved moon windows
    const chamberGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.45, 6);
    const chamber = new THREE.Mesh(chamberGeo, this.materials.stone);
    chamber.position.y = 0.88;
    chamber.castShadow = true;
    group.add(chamber);

    // Inner glowing paper/candle core
    const candleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 6);
    const candle = new THREE.Mesh(candleGeo, this.materials.lanternGlow);
    candle.position.y = 0.88;
    group.add(candle);

    // Warm lantern point light
    const pointLight = new THREE.PointLight(0xffa834, 1.8, 8, 1.8);
    pointLight.position.set(0, 0.9, 0);
    pointLight.castShadow = false;
    group.add(pointLight);

    // 4. Wide hexagonal umbrella roof (Kasa) that catches snow
    const roofGeo = new THREE.ConeGeometry(1.05, 0.35, 6);
    const roof = new THREE.Mesh(roofGeo, this.materials.lanternCap);
    roof.position.y = 1.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // 5. Sacred jewel finial (Hōju)
    const finialGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const finial = new THREE.Mesh(finialGeo, this.materials.stone);
    finial.position.y = 1.5;
    finial.scale.set(0.9, 1.3, 0.9);
    finial.castShadow = true;
    group.add(finial);

    group.scale.setScalar(scale);

    // Subtle candle flicker animation
    this.animatedDecorations.push({
      type: 'lantern',
      light: pointLight,
      glowMat: this.materials.lanternGlow,
      update: (time) => {
        const flicker = 1.5 + Math.sin(time * 6.5) * 0.15 + Math.sin(time * 19.0) * 0.08;
        pointLight.intensity = flicker;
      }
    });

    return group;
  }

  // 2. Working Bamboo Water Rocker (Shishi-Odoshi / Deer Scarer)
  // Slowly fills with water from spout, tilts forward, spills water, then rocks back & clacks!
  createShishiOdoshi(scale = 1.0) {
    const group = new THREE.Group();
    group.name = 'shishi_odoshi';

    // Stone sound anvil
    const anvilGeo = new THREE.DodecahedronGeometry(0.4, 1);
    const anvil = new THREE.Mesh(anvilGeo, this.materials.stone);
    anvil.scale.set(1.4, 0.6, 1.2);
    anvil.position.set(0.85, 0.2, 0);
    anvil.castShadow = true;
    group.add(anvil);

    // Upright supporting bamboo posts
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
    const postLeft = new THREE.Mesh(postGeo, this.materials.bamboo);
    postLeft.position.set(0, 0.55, -0.3);
    const postRight = new THREE.Mesh(postGeo, this.materials.bamboo);
    postRight.position.set(0, 0.55, 0.3);
    group.add(postLeft, postRight);

    // Horizontal pivot axle pin
    const pinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6);
    pinGeo.rotateX(Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, this.materials.bamboo);
    pin.position.set(0, 0.8, 0);
    group.add(pin);

    // Bamboo water supply spout
    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0, 0),
      new THREE.Vector3(-0.9, 1.25, 0),
      new THREE.Vector3(-0.4, 1.2, 0)
    ]);
    const spoutGeo = new THREE.TubeGeometry(spoutCurve, 8, 0.06, 7, false);
    const spout = new THREE.Mesh(spoutGeo, this.materials.bamboo);
    spout.castShadow = true;
    group.add(spout);

    // The rocking bamboo tube (pivots around axle)
    const rockerGroup = new THREE.Group();
    rockerGroup.position.set(0, 0.8, 0);

    const tubeGeo = new THREE.CylinderGeometry(0.075, 0.085, 1.5, 8);
    tubeGeo.rotateZ(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeo, this.materials.bamboo);
    tube.position.set(0.15, 0, 0);
    tube.castShadow = true;
    rockerGroup.add(tube);

    group.add(rockerGroup);
    group.scale.setScalar(scale);

    // Animation physics state
    let cycleTime = 0;
    const cycleDuration = 7.0; // Clacks every 7 seconds
    let didClack = false;

    this.animatedDecorations.push({
      type: 'shishi_odoshi',
      update: (time, dt) => {
        cycleTime = (cycleTime + dt) % cycleDuration;
        const progress = cycleTime / cycleDuration;

        // Stage 1: Slowly fills with water (0.0 to 0.7) -> tilts back gently
        // Stage 2: Heavy water tips rocker forward (0.7 to 0.85) -> pours out
        // Stage 3: Empty tube falls back rapidly and strikes stone (0.85 to 0.9)
        // Stage 4: Settles at rest (0.9 to 1.0)
        let angle = 0;

        if (progress < 0.7) {
          angle = 0.15 * Math.sin(progress * Math.PI);
          didClack = false;
        } else if (progress < 0.85) {
          // Tip forward to pour out
          const tipP = (progress - 0.7) / 0.15;
          angle = -0.65 * Math.sin(tipP * Math.PI * 0.5);
        } else if (progress < 0.9) {
          // Snap back against stone
          const snapP = (progress - 0.85) / 0.05;
          angle = THREE.MathUtils.lerp(-0.65, 0.25, snapP);

          if (!didClack && snapP > 0.8) {
            zenAudio.playBambooClack();
            didClack = true;
          }
        } else {
          // Rest with slight dampening vibration
          const restP = (progress - 0.9) / 0.1;
          angle = 0.25 * Math.exp(-restP * 6.0) * Math.cos(restP * 25);
        }

        rockerGroup.rotation.z = angle;
      }
    });

    return group;
  }

  // 3. Stone Water Basin (Tsukubai)
  createTsukubai(scale = 1.0) {
    const group = new THREE.Group();
    group.name = 'zen_tsukubai';

    // Rough carved outer boulder
    const basinGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.65, 12);
    const basin = new THREE.Mesh(basinGeo, this.materials.stone);
    basin.position.y = 0.32;
    basin.castShadow = true;
    group.add(basin);

    // Carved square water hollow (representing ancient Chinese coin "ware tada taru o shiru")
    const hollowGeo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
    const hollowMat = new THREE.MeshStandardMaterial({ color: 0x444440, roughness: 0.9 });
    const hollow = new THREE.Mesh(hollowGeo, hollowMat);
    hollow.position.y = 0.5;
    group.add(hollow);

    // Filled water surface
    const waterGeo = new THREE.PlaneGeometry(0.68, 0.68);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, this.materials.water);
    water.position.y = 0.62;
    group.add(water);

    // Wooden bamboo ladle resting on edge
    const ladleStickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6);
    ladleStickGeo.rotateZ(Math.PI / 2);
    const ladleStick = new THREE.Mesh(ladleStickGeo, this.materials.bamboo);
    ladleStick.position.set(0, 0.68, 0.25);
    group.add(ladleStick);

    const ladleCupGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.09, 8);
    const ladleCup = new THREE.Mesh(ladleCupGeo, this.materials.bamboo);
    ladleCup.position.set(0.35, 0.68, 0.25);
    group.add(ladleCup);

    group.scale.setScalar(scale);
    return group;
  }

  // 4. Stepping Stones (Tobi-ishi)
  createSteppingStone(scale = 1.0) {
    const geo = new THREE.CylinderGeometry(0.7, 0.78, 0.22, 9);
    // Slight organic deformation
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setX(i, x * (1.0 + (Math.random() - 0.5) * 0.15));
      pos.setZ(i, z * (1.0 + (Math.random() - 0.5) * 0.15));
    }
    geo.computeVertexNormals();

    const stone = new THREE.Mesh(geo, this.materials.stone);
    stone.position.y = 0.08;
    stone.scale.set(scale, scale * 0.8, scale);
    stone.castShadow = true;
    stone.receiveShadow = true;
    return stone;
  }

  // 5. Swimming Koi Fish (Nishikigoi)
  createKoiFish(centerPos = new THREE.Vector3(0, -0.3, 0), radius = 3.5) {
    const fishGroup = new THREE.Group();
    fishGroup.name = 'koi_fish';

    // Fish body: elongated teardrop
    const bodyGeo = new THREE.ConeGeometry(0.18, 0.9, 8);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.materials.koiOrange);
    body.castShadow = true;
    fishGroup.add(body);

    // White belly & patches
    const bellyGeo = new THREE.SphereGeometry(0.15, 6, 6);
    bellyGeo.scale(1.8, 0.6, 0.8);
    const belly = new THREE.Mesh(bellyGeo, this.materials.koi);
    belly.position.set(-0.1, -0.05, 0);
    fishGroup.add(belly);

    // Tail fin
    const tailGeo = new THREE.PlaneGeometry(0.3, 0.4);
    tailGeo.rotateY(Math.PI / 2);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(-0.55, 0, 0);
    fishGroup.add(tail);

    fishGroup.position.copy(centerPos);

    // Swimming animation logic
    let angle = Math.random() * Math.PI * 2;
    const speed = 0.45 + Math.random() * 0.25;
    const swimRadius = radius * (0.6 + Math.random() * 0.5);

    this.animatedDecorations.push({
      type: 'koi',
      update: (time, dt) => {
        angle += (speed / swimRadius) * dt;
        fishGroup.position.x = centerPos.x + Math.cos(angle) * swimRadius;
        fishGroup.position.z = centerPos.z + Math.sin(angle) * swimRadius;
        fishGroup.position.y = centerPos.y + Math.sin(time * 2.0) * 0.03;

        // Tangent heading
        fishGroup.rotation.y = -angle + Math.PI / 2;

        // Sinuous body wave
        tail.rotation.y = (Math.PI / 2) + Math.sin(time * 7.0) * 0.45;
        fishGroup.rotation.z = Math.sin(time * 3.5) * 0.08;
      }
    });

    return fishGroup;
  }

  update(time, dt) {
    for (const item of this.animatedDecorations) {
      item.update(time, dt);
    }
  }
}

export const decorationGenerator = new DecorationGenerator();
