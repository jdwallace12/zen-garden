import * as THREE from 'three';
import { rockGenerator } from './procedural/rockGenerator.js';
import { treeGenerator } from './procedural/treeGenerator.js';
import { decorationGenerator } from './procedural/decorations.js';

export class GardenPresets {
  constructor(app) {
    this.app = app;
  }

  // 1. Classical Ryōan-ji Temple Inspired Rock Sea (15 stones in 5 moss groupings)
  loadRyoanji() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // 5 classic rock clusters
    const clusters = [
      { x: -9, z: -6, count: 5, radius: 3.2 },
      { x: -3, z: 2, count: 2, radius: 2.4 },
      { x: 3, z: -4, count: 3, radius: 2.6 },
      { x: 8, z: 5, count: 2, radius: 2.2 },
      { x: 11, z: -7, count: 3, radius: 2.8 }
    ];

    clusters.forEach((c, idx) => {
      // 1. Paint moss bedding
      this.app.terrain.paintSurface({ x: c.x, z: c.z }, c.radius, 'moss', 0.95);

      // 2. Sculpt subtle elevated moss mound
      this.app.terrain.deformTerrain({ x: c.x, z: c.z }, c.radius * 1.1, 0.28);

      // 3. Generate concentric sand ripples around moss cluster
      this.app.terrain.generateRipplesAround(c.x, c.z, c.radius + 2.2);

      // 4. Place stones within cluster
      for (let s = 0; s < c.count; s++) {
        const stoneType = s === 0 ? 'standing' : (s === 1 ? 'reclining' : 'flat');
        const scale = s === 0 ? 1.6 : (0.8 + Math.random() * 0.5);
        const offsetX = (s === 0 ? 0 : (Math.random() - 0.5) * c.radius * 0.9);
        const offsetZ = (s === 0 ? 0 : (Math.random() - 0.5) * c.radius * 0.9);

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
        this.app.mossManager.growGroundMossBeds({ x: c.x, z: c.z }, c.radius * 0.85, this.app.terrain, 4);
      }
    });

    // Parallel oceanic sand waves connecting the garden
    for (let z = -14; z <= 14; z += 2.0) {
      this.app.terrain.rakeStroke(
        new THREE.Vector3(-15, 0, z),
        new THREE.Vector3(15, 0, z)
      );
    }

    this.app.weather.setPreset('noon');
  }

  // 2. Mountain Sanctuary: Sculpted hill, Bonsai Pine, Buddhist Triad, Stone Lantern & Bamboo
  loadMountainSanctuary() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // Sculpt a gentle mossy hill in north-west
    const hillCenter = { x: -6, z: -5 };
    this.app.terrain.deformTerrain(hillCenter, 6.5, 0.95);
    this.app.terrain.paintSurface(hillCenter, 5.8, 'moss', 1.0);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(hillCenter, 4.5, this.app.terrain, 8);
    }

    // Place heroic Bonsai Pine at top of hill
    const pine = treeGenerator.createTree('pine', 1.35);
    pine.position.set(hillCenter.x + 0.8, this.app.terrain.getHeightAt(hillCenter.x + 0.8, hillCenter.y) + 0.1, hillCenter.z - 0.5);
    pine.rotation.y = 0.8;
    this.app.addPlacedObject(pine, { type: 'tree', subType: 'pine', scale: 1.35 });

    // Buddhist Triad Rock Grouping in front of hill
    const triad = rockGenerator.createRock('triad', 1.25);
    const triadX = hillCenter.x + 3.0;
    const triadZ = hillCenter.z + 3.2;
    triad.position.set(triadX, this.app.terrain.getHeightAt(triadX, triadZ), triadZ);
    triad.rotation.y = -0.6;
    this.app.addPlacedObject(triad, { type: 'rock', subType: 'triad', scale: 1.25 });
    this.app.terrain.generateRipplesAround(triadX, triadZ, 3.8);

    // Stone Lantern overlooking the scene
    const lantern = decorationGenerator.createLantern(1.1);
    const lx = 3.5, lz = -3.0;
    lantern.position.set(lx, this.app.terrain.getHeightAt(lx, lz), lz);
    lantern.rotation.y = 0.4;
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.1 });
    this.app.terrain.paintSurface({ x: lx, z: lz }, 1.8, 'moss', 0.8);
    this.app.terrain.generateRipplesAround(lx, lz, 2.5);

    // Bamboo Grove in north-east corner
    const bamboo = treeGenerator.createTree('bamboo', 1.2);
    bamboo.position.set(8.5, 0, -8.0);
    this.app.addPlacedObject(bamboo, { type: 'tree', subType: 'bamboo', scale: 1.2 });
    this.app.terrain.paintSurface({ x: 8.5, z: -8.0 }, 3.5, 'moss', 0.7);

    // Stepping stones curving from south to lantern
    const stonePoints = [
      { x: 0, z: 8 },
      { x: 1.2, z: 5 },
      { x: 2.1, z: 2 },
      { x: 2.8, z: -0.8 }
    ];
    stonePoints.forEach(p => {
      const step = decorationGenerator.createSteppingStone(0.95);
      step.position.set(p.x, this.app.terrain.getHeightAt(p.x, p.z) + 0.05, p.z);
      this.app.addPlacedObject(step, { type: 'decoration', subType: 'stepping', scale: 0.95 });
      this.app.terrain.generateRipplesAround(p.x, p.z, 1.4);
    });

    // Rake sand in surrounding open space
    for (let r = -12; r <= 12; r += 2.2) {
      this.app.terrain.rakeStroke(
        new THREE.Vector3(-14, 0, r),
        new THREE.Vector3(14, 0, r)
      );
    }

    this.app.weather.setPreset('morning');
  }

  // 3. Strolling Koi Pond & Shishi-Odoshi
  loadKoiPondGarden() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // Carve organic pond depression in center-east
    const pondCenter = { x: 3.5, z: 1.5 };
    this.app.terrain.carveWaterPool(pondCenter, 6.5, 1.0);
    this.app.terrain.paintSurface(pondCenter, 7.5, 'moss', 0.9);
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(pondCenter, 5.0, this.app.terrain, 6);
    }

    // Add swimming Koi Fish pair (Kohaku & companion)
    const koi1 = decorationGenerator.createKoiFish(new THREE.Vector3(pondCenter.x, -0.28, pondCenter.z), 2.8);
    const koi2 = decorationGenerator.createKoiFish(new THREE.Vector3(pondCenter.x + 0.4, -0.26, pondCenter.z - 0.4), 3.8);
    this.app.addPlacedObject(koi1, { type: 'decoration', subType: 'koi', scale: 1.0 });
    this.app.addPlacedObject(koi2, { type: 'decoration', subType: 'koi', scale: 0.85 });

    // Working Shishi-Odoshi bamboo water rocker on pond edge
    const shishi = decorationGenerator.createShishiOdoshi(1.15);
    shishi.position.set(pondCenter.x - 3.8, 0, pondCenter.z - 1.2);
    shishi.rotation.y = 0.5;
    this.app.addPlacedObject(shishi, { type: 'decoration', subType: 'shishi', scale: 1.15 });

    // Weeping Cherry Blossom (Sakura) bowing over the pond
    const sakura = treeGenerator.createTree('sakura', 1.2);
    sakura.position.set(pondCenter.x + 3.2, 0.1, pondCenter.z - 4.2);
    sakura.rotation.y = -0.8;
    this.app.addPlacedObject(sakura, { type: 'tree', subType: 'sakura', scale: 1.2 });

    // Japanese Red Maple (Momiji) on opposite bank
    const maple = treeGenerator.createTree('maple', 1.1);
    maple.position.set(-7.5, 0.05, 4.0);
    this.app.addPlacedObject(maple, { type: 'tree', subType: 'maple', scale: 1.1 });
    this.app.terrain.paintSurface({ x: -7.5, z: 4.0 }, 3.5, 'moss', 0.85);

    // Stone Water Basin (Tsukubai) near bamboo
    const tsukubai = decorationGenerator.createTsukubai(1.1);
    tsukubai.position.set(-4.0, 0, -3.5);
    this.app.addPlacedObject(tsukubai, { type: 'decoration', subType: 'tsukubai', scale: 1.1 });
    this.app.terrain.generateRipplesAround(-4.0, -3.5, 2.2);

    // Stone Lantern reflecting in water at sunset
    const lantern = decorationGenerator.createLantern(1.0);
    lantern.position.set(pondCenter.x + 2.8, 0.05, pondCenter.z + 3.5);
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.0 });
    this.app.terrain.generateRipplesAround(pondCenter.x + 2.8, pondCenter.z + 3.5, 2.4);

    // Sand raking in open dry areas
    for (let r = 0; r < 5; r++) {
      this.app.terrain.rakeConcentric({ x: -7.0, z: -5.0 }, 3.0 + r * 1.5);
    }

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

    // Pick 2-4 focal interest points
    const numFoci = 2 + Math.floor(Math.random() * 3);
    for (let f = 0; f < numFoci; f++) {
      const fx = (Math.random() - 0.5) * 20;
      const fz = (Math.random() - 0.5) * 20;
      const radius = 2.5 + Math.random() * 2.5;

      const isPond = Math.random() > 0.7;
      if (isPond) {
        this.app.terrain.carveWaterPool({ x: fx, z: fz }, radius, 0.9);
        const koi = decorationGenerator.createKoiFish(new THREE.Vector3(fx, -0.28, fz), radius * 0.7);
        this.app.addPlacedObject(koi, { type: 'decoration', subType: 'koi', scale: 1.0 });
      } else {
        // Elevated moss mound
        this.app.terrain.deformTerrain({ x: fx, z: fz }, radius, 0.4 + Math.random() * 0.4);
        this.app.terrain.paintSurface({ x: fx, z: fz }, radius, 'moss', 0.9);

        // Feature element: Tree or Triad Rock
        if (Math.random() > 0.4) {
          const treeTypes = ['pine', 'maple', 'sakura', 'bamboo'];
          const tType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
          const tree = treeGenerator.createTree(tType, 0.9 + Math.random() * 0.4);
          const ty = this.app.terrain.getHeightAt(fx, fz);
          tree.position.set(fx, ty, fz);
          tree.rotation.y = Math.random() * Math.PI * 2;
          this.app.addPlacedObject(tree, { type: 'tree', subType: tType, scale: 1.0 });
        } else {
          const rock = rockGenerator.createRock('triad', 1.0 + Math.random() * 0.4);
          const ry = this.app.terrain.getHeightAt(fx, fz);
          rock.position.set(fx, ry, fz);
          this.app.addPlacedObject(rock, { type: 'rock', subType: 'triad', scale: 1.0 });
        }

        // Concentric sand waves around focal island
        this.app.terrain.generateRipplesAround(fx, fz, radius + 2.0);
      }
    }

    // Always place 1 stone lantern for atmospheric radiance
    const lx = (Math.random() - 0.5) * 16;
    const lz = (Math.random() - 0.5) * 16;
    const lantern = decorationGenerator.createLantern(1.0);
    lantern.position.set(lx, this.app.terrain.getHeightAt(lx, lz), lz);
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.0 });
    this.app.terrain.generateRipplesAround(lx, lz, 2.2);

    // Connect with linear rake lines
    for (let z = -14; z <= 14; z += 2.5) {
      this.app.terrain.rakeStroke(
        new THREE.Vector3(-15, 0, z),
        new THREE.Vector3(15, 0, z)
      );
    }
  }

  // 5. Blank Slate / Clean Canvas
  loadBlankCanvas() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();
    this.app.weather.setPreset('noon');
  }
}
