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

    // 7. Stone Lantern reflecting in the pond water
    const lantern = decorationGenerator.createLantern(1.1);
    const lX = 3.2, lZ = 5.2;
    lantern.position.set(lX, this.app.terrain.getHeightAt(lX, lZ), lZ);
    lantern.rotation.y = 0.3;
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.1 });

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

    // Pick 3-5 focal interest points
    const numFoci = 3 + Math.floor(Math.random() * 3);
    for (let f = 0; f < numFoci; f++) {
      const fx = (Math.random() - 0.5) * 20;
      const fz = (Math.random() - 0.5) * 20;
      const radius = 3.0 + Math.random() * 3.0;

      const isPond = Math.random() > 0.65;
      if (isPond) {
        this.app.terrain.carveWaterPool({ x: fx, z: fz }, radius, 0.95);
        const koi = decorationGenerator.createKoiFish(new THREE.Vector3(fx, -0.28, fz), radius * 0.7);
        this.app.addPlacedObject(koi, { type: 'decoration', subType: 'koi', scale: 0.95 });
      } else {
        // Elevated moss mound (turns green automatically via height system!)
        const moundHeight = 0.5 + Math.random() * 0.8;
        this.app.terrain.deformTerrain({ x: fx, z: fz }, radius, moundHeight);
        this.app.terrain.paintSurface({ x: fx, z: fz }, radius, 'moss', 0.9);

        if (this.app.mossManager) {
          this.app.mossManager.growGroundMossBeds({ x: fx, z: fz }, radius * 0.7, this.app.terrain, 3);
        }

        // Feature element: Tree or Triad Rock
        if (Math.random() > 0.45) {
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
      }
    }

    // Place 1 stone lantern for atmospheric radiance
    const lx = (Math.random() - 0.5) * 16;
    const lz = (Math.random() - 0.5) * 16;
    const lantern = decorationGenerator.createLantern(1.0);
    lantern.position.set(lx, this.app.terrain.getHeightAt(lx, lz), lz);
    this.app.addPlacedObject(lantern, { type: 'decoration', subType: 'lantern', scale: 1.0 });
  }

  // 5. Blank Slate / Clean Sand Canvas
  loadBlankCanvas() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();
    this.app.weather.setPreset('noon');
  }
}
