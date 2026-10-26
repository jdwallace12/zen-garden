import * as THREE from 'three';
import { rockGenerator } from './procedural/rockGenerator.js';
import { treeGenerator } from './procedural/treeGenerator.js';
import { decorationGenerator } from './procedural/decorations.js';

export class GardenPresets {
  constructor(app) {
    this.app = app;
  }

  // 1. Mostly Sand: Classical Ryōan-ji Minimalist Dry Landscape
  // Expansive, calm, pristine sand sea with 15 sacred stones in 5 discrete groupings
  loadRyoanji() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // 5 classic rock clusters (15 stones total: 5, 2, 3, 2, 3)
    const clusters = [
      { x: -9.5, z: -6.5, count: 5, radius: 2.2 },
      { x: -3.5, z: 2.5, count: 2, radius: 1.5 },
      { x: 3.2, z: -4.2, count: 3, radius: 1.8 },
      { x: 8.5, z: 5.2, count: 2, radius: 1.4 },
      { x: 11.2, z: -7.2, count: 3, radius: 1.8 }
    ];

    clusters.forEach((c) => {
      // Small, neat moss cushion bed around rock roots
      this.app.terrain.paintSurface({ x: c.x, z: c.z }, c.radius, 'moss', 0.95);
      this.app.terrain.deformTerrain({ x: c.x, z: c.z }, c.radius * 1.1, 0.16);

      // Place stones within cluster
      for (let s = 0; s < c.count; s++) {
        const stoneType = s === 0 ? 'standing' : (s === 1 ? 'reclining' : 'flat');
        const scale = s === 0 ? 1.55 : (0.75 + Math.random() * 0.45);
        const offsetX = (s === 0 ? 0 : (Math.random() - 0.5) * c.radius * 0.85);
        const offsetZ = (s === 0 ? 0 : (Math.random() - 0.5) * c.radius * 0.85);

        const rockObj = rockGenerator.createRock(stoneType, scale);
        const wx = c.x + offsetX;
        const wz = c.z + offsetZ;
        const wy = this.app.terrain.getHeightAt(wx, wz);
        rockObj.position.set(wx, wy, wz);
        rockObj.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(rockObj, { type: 'rock', subType: stoneType, scale });
      }

      // Grow plush 3D velvet moss bed cushions
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds({ x: c.x, z: c.z }, c.radius * 0.8, this.app.terrain, 3);
      }
    });

    // Subtle traditional stone lantern in the perimeter corner
    const lantern = decorationGenerator.createLantern(0.95);
    lantern.position.set(13.5, 0, 13.5);
    lantern.rotation.y = -Math.PI / 4;
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 0.95 });

    // Bamboo fence edging along the south perimeter
    const fence1 = decorationGenerator.createBambooFence(0.9, 6.0);
    fence1.position.set(-6, 0, 16.5);
    this.app.addPlacedObject(fence1, { type: 'decoration', subType: 'bamboo-fence', scale: 0.9 });

    const fence2 = decorationGenerator.createBambooFence(0.9, 6.0);
    fence2.position.set(6, 0, 16.5);
    this.app.addPlacedObject(fence2, { type: 'decoration', subType: 'bamboo-fence', scale: 0.9 });

    this.app.weather.setPreset('noon');
  }

  // 2. Hilly & Greenery: Moss Hills Sanctuary (Inspired by Saihō-ji & Tōfuku-ji)
  // Sculpted green moss mounds rising out of pure sand, crowned with Bonsai Pine & Maples
  loadMountainSanctuary() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // 1. Majestic Northwest Mount Horai (Prominent rounded green moss hill)
    const hillNorth = { x: -6.5, z: -5.5 };
    this.app.terrain.deformTerrain(hillNorth, 7.5, 1.45);
    this.app.terrain.paintSurface(hillNorth, 6.5, 'moss', 1.0);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(hillNorth, 5.0, this.app.terrain, 9);
    }

    // Heroic Bonsai Pine at the crest of the northwest hill
    const pine = treeGenerator.createTree('pine', 1.4);
    const pineY = this.app.terrain.getHeightAt(hillNorth.x + 0.6, hillNorth.z - 0.5);
    pine.position.set(hillNorth.x + 0.6, pineY, hillNorth.z - 0.5);
    pine.rotation.y = 0.85;
    this.app.addPlacedObject(pine, { type: 'tree', subType: 'pine', scale: 1.4 });

    // Sacred Buddhist Triad rock grouping nestled on the southern slope of the hill
    const triad = rockGenerator.createRock('triad', 1.3);
    const triadX = hillNorth.x + 3.2;
    const triadZ = hillNorth.z + 3.0;
    triad.position.set(triadX, this.app.terrain.getHeightAt(triadX, triadZ), triadZ);
    triad.rotation.y = -0.6;
    this.app.addPlacedObject(triad, { type: 'rock', subType: 'triad', scale: 1.3 });

    // 2. East Rolling Green Hill (Kamejima - Turtle Island mound)
    const hillEast = { x: 6.8, z: -4.5 };
    this.app.terrain.deformTerrain(hillEast, 6.4, 1.15);
    this.app.terrain.paintSurface(hillEast, 5.5, 'moss', 0.95);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(hillEast, 4.2, this.app.terrain, 7);
    }

    // Japanese Red Maple (Momiji) atop the east hill
    const maple = treeGenerator.createTree('maple', 1.25);
    const mapleY = this.app.terrain.getHeightAt(hillEast.x, hillEast.z);
    maple.position.set(hillEast.x, mapleY, hillEast.z);
    maple.rotation.y = -0.4;
    this.app.addPlacedObject(maple, { type: 'tree', subType: 'maple', scale: 1.25 });

    // Standing companion stone on east slope
    const rockEast = rockGenerator.createRock('standing', 1.1);
    rockEast.position.set(hillEast.x - 2.5, this.app.terrain.getHeightAt(hillEast.x - 2.5, hillEast.z + 2.0), hillEast.z + 2.0);
    this.app.addPlacedObject(rockEast, { type: 'rock', subType: 'standing', scale: 1.1 });

    // 3. South Gentle Knoll (Tsurujima - Crane Island mound)
    const hillSouth = { x: -3.5, z: 6.5 };
    this.app.terrain.deformTerrain(hillSouth, 5.5, 0.85);
    this.app.terrain.paintSurface(hillSouth, 4.5, 'moss', 0.9);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(hillSouth, 3.5, this.app.terrain, 5);
    }

    // Stone Lantern standing on the southern knoll
    const lantern = decorationGenerator.createLantern(1.15);
    lantern.position.set(hillSouth.x, this.app.terrain.getHeightAt(hillSouth.x, hillSouth.z), hillSouth.z);
    lantern.rotation.y = 0.5;
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.15 });

    // Sculpted Flowering Azalea shrubs nestled near stones & lanterns
    const azalea1 = treeGenerator.createTree('azalea', 1.1);
    const az1X = hillNorth.x + 3.8;
    const az1Z = hillNorth.z + 1.2;
    azalea1.position.set(az1X, this.app.terrain.getHeightAt(az1X, az1Z), az1Z);
    azalea1.rotation.y = 0.4;
    this.app.addPlacedObject(azalea1, { type: 'flora', subType: 'azalea', scale: 1.1 });

    const azalea2 = treeGenerator.createTree('azalea-white', 1.05);
    const az2X = hillSouth.x + 2.0;
    const az2Z = hillSouth.z - 1.2;
    azalea2.position.set(az2X, this.app.terrain.getHeightAt(az2X, az2Z), az2Z);
    azalea2.rotation.y = -0.8;
    this.app.addPlacedObject(azalea2, { type: 'flora', subType: 'azalea-white', scale: 1.05 });

    // 4. Southeast Bamboo Mound
    const hillBamboo = { x: 7.5, z: 6.5 };
    this.app.terrain.deformTerrain(hillBamboo, 4.8, 0.7);
    this.app.terrain.paintSurface(hillBamboo, 4.0, 'moss', 0.85);
    const bamboo = treeGenerator.createTree('bamboo', 1.2);
    bamboo.position.set(hillBamboo.x, this.app.terrain.getHeightAt(hillBamboo.x, hillBamboo.z), hillBamboo.z);
    this.app.addPlacedObject(bamboo, { type: 'tree', subType: 'bamboo', scale: 1.2 });

    // 5. Curved stepping stones meandering through the sand pass between the moss mounds
    const stonePoints = [
      { x: -0.5, z: 10 },
      { x: 0.5, z: 6.5 },
      { x: 1.2, z: 3.0 },
      { x: 1.8, z: -0.5 },
      { x: 1.5, z: -4.0 }
    ];
    stonePoints.forEach(p => {
      const step = decorationGenerator.createSteppingStone(0.95);
      step.position.set(p.x, this.app.terrain.getHeightAt(p.x, p.z) + 0.04, p.z);
      this.app.addPlacedObject(step, { type: 'decoration', subType: 'stepping', scale: 0.95 });
    });

    // Shinto Torii gate standing at the garden's entrance path
    const torii = decorationGenerator.createToriiGate(0.95);
    const toriiX = 1.5, toriiZ = 12.5;
    torii.position.set(toriiX, this.app.terrain.getHeightAt(toriiX, toriiZ), toriiZ);
    torii.rotation.y = Math.PI;
    this.app.addPlacedObject(torii, { type: 'decoration', subType: 'torii', scale: 0.95 });

    // Bamboo fence flanking the stepping stone path
    const fenceL = decorationGenerator.createBambooFence(0.85, 5.0);
    fenceL.position.set(-5.5, 0, 10.0);
    fenceL.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceL, { type: 'decoration', subType: 'bamboo-fence', scale: 0.85 });

    const fenceR = decorationGenerator.createBambooFence(0.85, 5.0);
    fenceR.position.set(5.5, 0, 10.0);
    fenceR.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceR, { type: 'decoration', subType: 'bamboo-fence', scale: 0.85 });

    this.app.weather.setPreset('morning');
  }

  // 3. Water & Ponds: Classical Chisen-kaiyushiki Strolling Pond Sanctuary
  // Expansive carved ponds, swimming Koi fish, Shishi-Odoshi & weeping Sakura
  loadKoiPondGarden() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // 1. Carve expansive connected organic pond system across center and east
    const pondCenter = { x: 2.5, z: 1.0 };
    this.app.terrain.carveWaterPool(pondCenter, 8.2, 1.2);

    const pondNorth = { x: 5.5, z: -4.5 };
    this.app.terrain.carveWaterPool(pondNorth, 5.5, 1.0);

    const pondWestInlet = { x: -3.0, z: -2.0 };
    this.app.terrain.carveWaterPool(pondWestInlet, 4.8, 0.9);

    // Green mossy banks framing the water's edge
    this.app.terrain.paintSurface(pondCenter, 9.5, 'moss', 0.85);
    this.app.terrain.paintSurface({ x: -6.5, z: 3.5 }, 4.5, 'moss', 0.9);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds({ x: -4.5, z: 2.5 }, 3.5, this.app.terrain, 6);
      this.app.mossManager.growGroundMossBeds({ x: 6.5, z: 4.5 }, 3.2, this.app.terrain, 5);
    }

    // 2. Swimming pair of Nishikigoi (Koi fish)
    const koi1 = decorationGenerator.createKoiFish(new THREE.Vector3(pondCenter.x - 0.5, -0.17, pondCenter.z), 3.4);
    const koi2 = decorationGenerator.createKoiFish(new THREE.Vector3(pondCenter.x + 1.2, -0.17, pondCenter.z - 1.2), 2.8);
    this.app.addPlacedObject(koi1, { type: 'decoration', subType: 'koi', scale: 1.05 });
    this.app.addPlacedObject(koi2, { type: 'decoration', subType: 'koi', scale: 0.88 });

    // 3. Working Shishi-Odoshi bamboo water rocker on pond bank
    const shishi = decorationGenerator.createShishiOdoshi(1.15);
    const shishiX = -3.8;
    const shishiZ = pondCenter.z - 0.8;
    shishi.position.set(shishiX, this.app.terrain.getHeightAt(shishiX, shishiZ), shishiZ);
    shishi.rotation.y = 0.5;
    this.app.addPlacedObject(shishi, { type: 'decoration', subType: 'shishi', scale: 1.15 });

    // 4. Tsukubai carved stone water basin near bamboo
    const tsukubai = decorationGenerator.createTsukubai(1.1);
    tsukubai.position.set(-6.2, this.app.terrain.getHeightAt(-6.2, -2.5), -2.5);
    this.app.addPlacedObject(tsukubai, { type: 'decoration', subType: 'tsukubai', scale: 1.1 });

    // 5. Weeping Cherry Blossom (Sakura) bowing over the pond water
    const sakura = treeGenerator.createTree('sakura', 1.3);
    const sakX = 4.5, sakZ = -6.2;
    sakura.position.set(sakX, this.app.terrain.getHeightAt(sakX, sakZ), sakZ);
    sakura.rotation.y = -0.7;
    this.app.addPlacedObject(sakura, { type: 'tree', subType: 'sakura', scale: 1.3 });

    // 6. Japanese Red Maple on the opposite western shore
    const maple = treeGenerator.createTree('maple', 1.15);
    const mapX = -7.5, mapZ = 4.2;
    maple.position.set(mapX, this.app.terrain.getHeightAt(mapX, mapZ), mapZ);
    this.app.addPlacedObject(maple, { type: 'tree', subType: 'maple', scale: 1.15 });

    // 6b. Arched Japanese Cedar Bridge (Taiko-bashi) spanning over the pond channel
    const bridge = decorationGenerator.createWoodBridge(0.95);
    const brX = 2.8, brZ = -2.2;
    bridge.position.set(brX, 0.02, brZ);
    bridge.rotation.y = -0.75;
    this.app.addPlacedObject(bridge, { type: 'decoration', subType: 'bridge', scale: 0.95 });

    // 7. Stone Lantern reflecting in the pond water
    const lantern = decorationGenerator.createLantern(1.1);
    const lX = 3.2, lZ = 5.2;
    lantern.position.set(lX, this.app.terrain.getHeightAt(lX, lZ), lZ);
    lantern.rotation.y = 0.3;
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.1 });

    // Sculpted flowering azalea shrub nestled near lantern & pond shore
    const pondAzalea = treeGenerator.createTree('azalea', 1.15);
    const paX = 4.6, paZ = 4.2;
    pondAzalea.position.set(paX, this.app.terrain.getHeightAt(paX, paZ), paZ);
    pondAzalea.rotation.y = 0.8;
    this.app.addPlacedObject(pondAzalea, { type: 'flora', subType: 'azalea', scale: 1.15 });

    // White azalea shrub tucked along western moss bank
    const pondAzaleaW = treeGenerator.createTree('azalea-white', 1.0);
    const pawX = -5.8, pawZ = 1.8;
    pondAzaleaW.position.set(pawX, this.app.terrain.getHeightAt(pawX, pawZ), pawZ);
    pondAzaleaW.rotation.y = -0.5;
    this.app.addPlacedObject(pondAzaleaW, { type: 'flora', subType: 'azalea-white', scale: 1.0 });

    // 8. Stepping stones crossing the shallow bank of the pond
    const pondSteps = [
      { x: -1.5, z: 4.5 },
      { x: -0.2, z: 3.5 },
      { x: 1.2, z: 3.2 },
      { x: 2.4, z: 4.2 }
    ];
    pondSteps.forEach(p => {
      const step = decorationGenerator.createSteppingStone(0.9);
      step.position.set(p.x, Math.max(-0.15, this.app.terrain.getHeightAt(p.x, p.z)) + 0.05, p.z);
      this.app.addPlacedObject(step, { type: 'decoration', subType: 'stepping', scale: 0.9 });
    });

    // Vermilion Torii gate reflected at the pond's edge
    const torii = decorationGenerator.createToriiGate(1.05);
    const tX = -8.5, tZ = -6.5;
    torii.position.set(tX, this.app.terrain.getHeightAt(tX, tZ), tZ);
    torii.rotation.y = -0.4;
    this.app.addPlacedObject(torii, { type: 'decoration', subType: 'torii', scale: 1.05 });

    // Bamboo fence along the west bank
    const fenceW = decorationGenerator.createBambooFence(0.9, 5.5);
    fenceW.position.set(-11.0, 0, 1.0);
    fenceW.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceW, { type: 'decoration', subType: 'bamboo-fence', scale: 0.9 });

    this.app.weather.setPreset('sunset');
  }

  // 4. Procedural Zen Generator (Asymmetric Harmony / Wabi-Sabi)
  generateProceduralSanctuary() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // Randomize time of day
    const times = ['morning', 'noon', 'sunset', 'night'];
    const chosenTime = times[Math.floor(Math.random() * times.length)];
    this.app.weather.setPreset(chosenTime);

    // ════════════════════════════════════════════════════════════════════
    // Phase 1: Interconnected Water Network
    // Build 3-5 pond nodes and carve channels between them
    // ════════════════════════════════════════════════════════════════════
    const numPonds = 3 + Math.floor(Math.random() * 3);
    const pondNodes = [];

    // Place pond nodes — bias towards one side for a natural river feel
    const waterBias = (Math.random() - 0.5) * 8;
    for (let p = 0; p < numPonds; p++) {
      const px = waterBias + (Math.random() - 0.5) * 16;
      const pz = -10 + (p / numPonds) * 22 + (Math.random() - 0.5) * 4;
      const pr = 3.5 + Math.random() * 4.5;
      pondNodes.push({ x: px, z: pz, radius: pr });
    }

    // Carve each pond
    pondNodes.forEach(pond => {
      const depth = 0.85 + Math.random() * 0.55;
      this.app.terrain.carveWaterPool({ x: pond.x, z: pond.z }, pond.radius, depth);

      // Koi fish
      const koiCount = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < koiCount; k++) {
        const kOff = (Math.random() - 0.5) * pond.radius * 0.35;
        const koi = decorationGenerator.createKoiFish(
          new THREE.Vector3(pond.x + kOff, -0.25, pond.z + kOff * 0.6),
          pond.radius * 0.5
        );
        this.app.addPlacedObject(koi, { type: 'decoration', subType: 'koi', scale: 0.85 + Math.random() * 0.25 });
      }

      // Mossy banks + grass fringe
      this.app.terrain.paintSurface({ x: pond.x, z: pond.z }, pond.radius * 1.4, 'moss', 0.7);
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds({ x: pond.x, z: pond.z }, pond.radius * 1.1, this.app.terrain, 5);
      }
      if (this.app.grassManager) {
        this.app.terrain.paintSurface({ x: pond.x, z: pond.z }, pond.radius * 1.5, 'grass', 0.45);
        this.app.grassManager.paintGrassBlades(
          new THREE.Vector3(pond.x, 0, pond.z), pond.radius * 1.3, this.app.terrain, 7
        );
      }
    });

    // Carve connecting channels between adjacent ponds
    for (let i = 0; i < pondNodes.length - 1; i++) {
      const from = pondNodes[i];
      const to = pondNodes[i + 1];
      const steps = 6 + Math.floor(Math.random() * 5);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const midOffX = (Math.random() - 0.5) * 4;
        const cx = from.x + (to.x - from.x) * t + midOffX * Math.sin(t * Math.PI);
        const cz = from.z + (to.z - from.z) * t;
        const channelR = 1.5 + Math.random() * 1.5;
        this.app.terrain.carveWaterPool({ x: cx, z: cz }, channelR, 0.6 + Math.random() * 0.3);
        this.app.terrain.paintSurface({ x: cx, z: cz }, channelR * 1.6, 'moss', 0.5);
      }
    }

    // Bridge over one of the ponds
    const bridgePond = pondNodes[Math.floor(Math.random() * pondNodes.length)];
    const bridge1 = decorationGenerator.createWoodBridge(0.9 + Math.random() * 0.2);
    bridge1.position.set(bridgePond.x, 0.02, bridgePond.z);
    bridge1.rotation.y = Math.random() * Math.PI;
    this.app.addPlacedObject(bridge1, { type: 'decoration', subType: 'bridge', scale: 0.95 });

    // Second bridge if many ponds
    if (pondNodes.length >= 4 && Math.random() > 0.4) {
      const bp2 = pondNodes[pondNodes.length - 2];
      const bridge2 = decorationGenerator.createWoodBridge(0.85 + Math.random() * 0.2);
      bridge2.position.set(bp2.x, 0.02, bp2.z);
      bridge2.rotation.y = Math.random() * Math.PI;
      this.app.addPlacedObject(bridge2, { type: 'decoration', subType: 'bridge', scale: 0.9 });
    }

    // ════════════════════════════════════════════════════════════════════
    // Phase 2: Big Hills & Green Mounds (4-6 major hills)
    // ════════════════════════════════════════════════════════════════════
    const numHills = 4 + Math.floor(Math.random() * 3);

    for (let h = 0; h < numHills; h++) {
      // Place hills away from the water network
      let hx, hz, tries = 0;
      do {
        hx = (Math.random() - 0.5) * 24;
        hz = (Math.random() - 0.5) * 24;
        tries++;
      } while (tries < 10 && pondNodes.some(pn =>
        Math.hypot(pn.x - hx, pn.z - hz) < pn.radius + 2
      ));

      const hillRadius = 4.0 + Math.random() * 5.0;
      const hillHeight = 1.2 + Math.random() * 1.6;

      this.app.terrain.deformTerrain({ x: hx, z: hz }, hillRadius, hillHeight);
      this.app.terrain.paintSurface({ x: hx, z: hz }, hillRadius, 'moss', 0.9);

      // Dense moss cushions
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: hx, z: hz }, hillRadius * 0.75, this.app.terrain,
          5 + Math.floor(Math.random() * 5)
        );
      }

      // Grass patches on multiple sides
      if (this.app.grassManager) {
        const numGrassPatches = 2 + Math.floor(Math.random() * 2);
        for (let g = 0; g < numGrassPatches; g++) {
          const ga = Math.random() * Math.PI * 2;
          const gd = hillRadius * (0.3 + Math.random() * 0.5);
          const gx = hx + Math.cos(ga) * gd;
          const gz = hz + Math.sin(ga) * gd;
          this.app.terrain.paintSurface({ x: gx, z: gz }, hillRadius * 0.45, 'grass', 0.6);
          this.app.grassManager.paintGrassBlades(
            new THREE.Vector3(gx, 0, gz), hillRadius * 0.45, this.app.terrain, 5
          );
        }
      }

      // Feature on the hilltop
      if (Math.random() > 0.25) {
        const floraTypes = ['pine', 'maple', 'sakura', 'bamboo', 'azalea', 'azalea-white'];
        const fType = floraTypes[Math.floor(Math.random() * floraTypes.length)];
        const isShrub = fType.startsWith('azalea');
        const floraScale = isShrub ? (1.0 + Math.random() * 0.4) : (1.0 + Math.random() * 0.6);
        const flora = treeGenerator.createTree(fType, floraScale);
        flora.position.set(hx, this.app.terrain.getHeightAt(hx, hz), hz);
        flora.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(flora, { type: isShrub ? 'shrub' : 'tree', subType: fType, scale: floraScale });
      } else {
        const rockType = Math.random() > 0.5 ? 'triad' : 'standing';
        const rock = rockGenerator.createRock(rockType, 1.0 + Math.random() * 0.6);
        rock.position.set(hx, this.app.terrain.getHeightAt(hx, hz), hz);
        rock.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(rock, { type: 'rock', subType: rockType, scale: 1.2 });
      }

      // Secondary shrub on slopes
      if (Math.random() > 0.5) {
        const sa = Math.random() * Math.PI * 2;
        const sfx = hx + Math.cos(sa) * hillRadius * 0.55;
        const sfz = hz + Math.sin(sa) * hillRadius * 0.55;
        const shrubType = Math.random() > 0.5 ? 'azalea' : 'azalea-white';
        const shrub = treeGenerator.createTree(shrubType, 0.8 + Math.random() * 0.4);
        shrub.position.set(sfx, this.app.terrain.getHeightAt(sfx, sfz), sfz);
        shrub.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(shrub, { type: 'shrub', subType: shrubType, scale: 1.0 });
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // Phase 3: Decorations & Details
    // ════════════════════════════════════════════════════════════════════

    // Accent rocks
    const numAccentRocks = 3 + Math.floor(Math.random() * 5);
    for (let r = 0; r < numAccentRocks; r++) {
      const rx = (Math.random() - 0.5) * 22;
      const rz = (Math.random() - 0.5) * 22;
      const rockTypes = ['standing', 'reclining', 'flat'];
      const rt = rockTypes[Math.floor(Math.random() * rockTypes.length)];
      const rs = 0.6 + Math.random() * 0.7;
      const rock = rockGenerator.createRock(rt, rs);
      rock.position.set(rx, this.app.terrain.getHeightAt(rx, rz), rz);
      rock.rotation.y = Math.random() * Math.PI * 2;
      this.app.addPlacedObject(rock, { type: 'rock', subType: rt, scale: rs });
    }

    // Stepping stone path
    const numSteps = 4 + Math.floor(Math.random() * 4);
    const pathStartX = (Math.random() - 0.5) * 10;
    const pathStartZ = 10 + Math.random() * 4;
    for (let s = 0; s < numSteps; s++) {
      const sx = pathStartX + (Math.random() - 0.5) * 2.5;
      const sz = pathStartZ - s * (2.2 + Math.random());
      const step = decorationGenerator.createSteppingStone(0.85 + Math.random() * 0.2);
      step.position.set(sx, Math.max(-0.1, this.app.terrain.getHeightAt(sx, sz)) + 0.04, sz);
      this.app.addPlacedObject(step, { type: 'decoration', subType: 'stepping', scale: 0.9 });
    }

    // Stone lanterns
    const lx = (Math.random() - 0.5) * 16;
    const lz = (Math.random() - 0.5) * 16;
    const lantern = decorationGenerator.createLantern(0.95 + Math.random() * 0.2);
    lantern.position.set(lx, this.app.terrain.getHeightAt(lx, lz), lz);
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.0 });

    // Second lantern near water
    if (pondNodes.length > 0) {
      const lp = pondNodes[pondNodes.length - 1];
      const l2x = lp.x + lp.radius * 1.1;
      const l2z = lp.z + (Math.random() - 0.5) * 3;
      const lantern2 = decorationGenerator.createLantern(0.9 + Math.random() * 0.2);
      lantern2.position.set(l2x, this.app.terrain.getHeightAt(l2x, l2z), l2z);
      lantern2.rotation.y = Math.random() * Math.PI;
      this.app.addPlacedObject(lantern2, { type: 'decoration', subType: 'lantern', scale: 1.0 });
    }

    // Torii gate
    if (Math.random() > 0.3) {
      const torii = decorationGenerator.createToriiGate(0.9 + Math.random() * 0.2);
      const tx = (Math.random() - 0.5) * 18;
      const tz = 11 + Math.random() * 4;
      torii.position.set(tx, this.app.terrain.getHeightAt(tx, tz), tz);
      torii.rotation.y = Math.PI + (Math.random() - 0.5) * 0.4;
      this.app.addPlacedObject(torii, { type: 'decoration', subType: 'torii', scale: 1.0 });
    }

    // Bamboo fences
    const numFences = 1 + (Math.random() > 0.5 ? 1 : 0);
    for (let f = 0; f < numFences; f++) {
      const fence = decorationGenerator.createBambooFence(0.85, 5.0 + Math.random() * 4.0);
      const fenceX = (f === 0 ? 1 : -1) * (10 + Math.random() * 3);
      fence.position.set(fenceX, 0, (Math.random() - 0.5) * 12);
      fence.rotation.y = Math.PI / 2;
      this.app.addPlacedObject(fence, { type: 'decoration', subType: 'bamboo-fence', scale: 0.85 });
    }

    // Shishi-odoshi near a pond
    if (pondNodes.length > 0) {
      const pf = pondNodes[Math.floor(Math.random() * pondNodes.length)];
      const shishi = decorationGenerator.createShishiOdoshi(1.0 + Math.random() * 0.2);
      const shX = pf.x + pf.radius * 0.85;
      const shZ = pf.z + (Math.random() - 0.5) * 2;
      shishi.position.set(shX, this.app.terrain.getHeightAt(shX, shZ), shZ);
      shishi.rotation.y = Math.random() * Math.PI * 2;
      this.app.addPlacedObject(shishi, { type: 'decoration', subType: 'shishi', scale: 1.1 });
    }

    // Tsukubai water basin
    if (pondNodes.length > 1 && Math.random() > 0.3) {
      const tp = pondNodes[1];
      const tbx = tp.x - tp.radius * 0.9;
      const tbz = tp.z + (Math.random() - 0.5) * 2;
      const tsukubai = decorationGenerator.createTsukubai(1.0 + Math.random() * 0.15);
      tsukubai.position.set(tbx, this.app.terrain.getHeightAt(tbx, tbz), tbz);
      this.app.addPlacedObject(tsukubai, { type: 'decoration', subType: 'tsukubai', scale: 1.0 });
    }
  }

  // 5. Blank Slate / Clean Sand Canvas
  loadBlankCanvas() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();
    this.app.weather.setPreset('noon');
  }
}
