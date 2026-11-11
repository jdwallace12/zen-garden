import * as THREE from "three";
import { rockGenerator } from "./procedural/rockGenerator.js";
import { treeGenerator } from "./procedural/treeGenerator.js";
import { decorationGenerator } from "./procedural/decorations.js";

export class GardenPresets {
  constructor(app) {
    this.app = app;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. Classical Ryōan-ji Minimalist Dry Landscape (Sand Sea)
  // Pristine raked sand sea framed by an authentic earthen boundary ridge,
  // stepped dry waterfall cascade, noble leaning Bonsai Pine, and 15 sacred
  // stones resting in 5 sculpted moss island groupings.
  // ═════════════════════════════════════════════════════════════════════════
  loadRyoanji() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // ── 1. Borrowed Scenery (Shakkei) Earthen Wall & Backdrop Terraces ──
    // Authentic earthen wall berm running along the north and northwest border
    const backdropRidges = [
      { x: -13.0, z: -11.0, r: 6.5, h: 1.25 },
      { x: -7.0, z: -14.0, r: 7.0, h: 0.95 },
      { x: 3.0, z: -14.5, r: 6.5, h: 0.85 },
      { x: 12.0, z: -13.0, r: 6.0, h: 1.1 },
      { x: -14.5, z: -3.0, r: 5.5, h: 0.75 },
    ];

    backdropRidges.forEach((b) => {
      this.app.terrain.deformTerrain({ x: b.x, z: b.z }, b.r, b.h);
      // this.app.terrain.paintSurface(
      //   { x: b.x, z: b.z },
      //   b.r * 0.95,
      //   "moss",
      //   0.92,
      // );
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: b.x, z: b.z },
          b.r * 0.65,
          this.app.terrain,
          4,
        );
      }
    });

    // Dry waterfall (Karedaki) terrace in northwest corner descending toward the gravel
    const waterfallNodes = [
      { x: -12.5, z: -9.5, r: 3.2, h: 0.7 },
      { x: -10.5, z: -8.0, r: 2.4, h: 0.35 },
    ];
    waterfallNodes.forEach((w) => {
      this.app.terrain.deformTerrain({ x: w.x, z: w.z }, w.r, w.h);
      this.app.terrain.paintSurface(
        { x: w.x, z: w.z },
        w.r * 1.1,
        "moss",
        0.95,
      );
    });

    // Cascading stones of the dry waterfall
    const cascadeStones = [
      { x: -13.0, z: -10.2, type: "standing", scale: 1.35, rot: 0.4 },
      { x: -11.8, z: -9.0, type: "reclining", scale: 1.15, rot: -0.6 },
      { x: -10.2, z: -8.2, type: "flat", scale: 1.05, rot: 1.2 },
      { x: -9.2, z: -7.2, type: "flat", scale: 0.85, rot: -0.3 },
    ];
    cascadeStones.forEach((s) => {
      const rockObj = rockGenerator.createRock(s.type, s.scale);
      const y = this.app.terrain.getHeightAt(s.x, s.z);
      rockObj.position.set(s.x, y, s.z);
      rockObj.rotation.y = s.rot;
      this.app.addPlacedObject(rockObj, {
        category: "rocks",
        id: s.type,
        scale: s.scale,
        type: "rock",
        subType: s.type,
      });
    });

    // ── 2. The 5 Sacred Stone Clusters (15 Stones Total) ───────────────
    // Multi-tiered moss islands rising gracefully above the raked sand
    const clusters = [
      {
        x: -8.5,
        z: -4.5,
        count: 5,
        radius: 2.8,
        h: 0.28,
        mainType: "standing",
        mainScale: 1.7,
      },
      {
        x: -3.0,
        z: 3.5,
        count: 2,
        radius: 2.0,
        h: 0.22,
        mainType: "reclining",
        mainScale: 1.3,
      },
      {
        x: 3.5,
        z: -3.5,
        count: 3,
        radius: 2.3,
        h: 0.25,
        mainType: "standing",
        mainScale: 1.45,
      },
      {
        x: 8.5,
        z: 5.5,
        count: 2,
        radius: 1.8,
        h: 0.2,
        mainType: "reclining",
        mainScale: 1.2,
      },
      {
        x: 11.5,
        z: -6.5,
        count: 3,
        radius: 2.4,
        h: 0.26,
        mainType: "standing",
        mainScale: 1.5,
      },
    ];

    clusters.forEach((c, idx) => {
      // Tiered moss island base
      this.app.terrain.deformTerrain({ x: c.x, z: c.z }, c.radius * 1.3, c.h);
      this.app.terrain.paintSurface(
        { x: c.x, z: c.z },
        c.radius * 1.1,
        "moss",
        0.95,
      );

      // Place rocks with authentic asymmetrical balance
      for (let s = 0; s < c.count; s++) {
        let stoneType, scale, offsetX, offsetZ;
        if (s === 0) {
          stoneType = c.mainType;
          scale = c.mainScale;
          offsetX = 0;
          offsetZ = 0;
        } else if (s === 1) {
          stoneType = c.mainType === "standing" ? "reclining" : "flat";
          scale = c.mainScale * 0.72;
          offsetX = (idx % 2 === 0 ? 0.7 : -0.7) * (c.radius * 0.45);
          offsetZ = (idx % 2 === 0 ? 0.5 : -0.4) * (c.radius * 0.45);
        } else if (s === 2) {
          stoneType = "flat";
          scale = c.mainScale * 0.58;
          offsetX = -offsetX * 0.85;
          offsetZ = offsetZ * 0.7;
        } else {
          stoneType = s % 2 === 0 ? "reclining" : "flat";
          scale = c.mainScale * (0.45 + s * 0.08);
          const angle = (s / c.count) * Math.PI * 2;
          offsetX = Math.cos(angle) * c.radius * 0.55;
          offsetZ = Math.sin(angle) * c.radius * 0.55;
        }

        const rockObj = rockGenerator.createRock(stoneType, scale);
        const wx = c.x + offsetX;
        const wz = c.z + offsetZ;
        const wy = this.app.terrain.getHeightAt(wx, wz);
        rockObj.position.set(wx, wy, wz);
        rockObj.rotation.y = idx * 1.3 + s * 1.7;
        this.app.addPlacedObject(rockObj, {
          category: "rocks",
          id: stoneType,
          scale,
          type: "rock",
          subType: stoneType,
        });
      }

      // Plush 3D velvet moss cushions around roots
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: c.x, z: c.z },
          c.radius * 0.85,
          this.app.terrain,
          3 + (idx % 2),
        );
      }
    });

    // ── 3. Flora & Architectural Accents ──────────────────────────────
    // Heroic Leaning Bonsai Pine arching over northern backdrop ridge
    const pine = treeGenerator.createTree("pine", 1.4);
    const pineX = -4.5,
      pineZ = -13.5;
    pine.position.set(pineX, this.app.terrain.getHeightAt(pineX, pineZ), pineZ);
    pine.rotation.y = 0.55;
    this.app.addPlacedObject(pine, {
      category: "flora",
      id: "pine",
      scale: 1.4,
      type: "tree",
      subType: "pine",
    });

    // Crimson Japanese Maple behind the dry waterfall terrace
    const maple = treeGenerator.createTree("maple", 1.15);
    const mapX = -13.5,
      mapZ = -12.5;
    maple.position.set(mapX, this.app.terrain.getHeightAt(mapX, mapZ), mapZ);
    maple.rotation.y = -0.4;
    this.app.addPlacedObject(maple, {
      category: "flora",
      id: "maple",
      scale: 1.15,
      type: "tree",
      subType: "maple",
    });

    // Clustered Bamboo Culms framing eastern corner
    const bamboo = treeGenerator.createTree("bamboo", 1.2);
    const bamX = 13.5,
      bamZ = -11.5;
    bamboo.position.set(bamX, this.app.terrain.getHeightAt(bamX, bamZ), bamZ);
    bamboo.rotation.y = 0.2;
    this.app.addPlacedObject(bamboo, {
      category: "flora",
      id: "bamboo",
      scale: 1.2,
      type: "tree",
      subType: "bamboo",
    });

    // Sculpted Flowering Azaleas nestled into moss cushions
    const azaleas = [
      { x: -6.8, z: -3.5, type: "azalea", scale: 1.1 },
      { x: 4.8, z: -4.8, type: "azalea-white", scale: 0.95 },
      { x: 12.8, z: -5.2, type: "azalea", scale: 1.05 },
    ];
    azaleas.forEach((az, i) => {
      const azObj = treeGenerator.createTree(az.type, az.scale);
      azObj.position.set(az.x, this.app.terrain.getHeightAt(az.x, az.z), az.z);
      azObj.rotation.y = i * 1.5;
      this.app.addPlacedObject(azObj, {
        category: "flora",
        id: az.type,
        scale: az.scale,
        type: "shrub",
        subType: az.type,
      });
    });

    // Snow lantern (Yukimi-dōrō) on the southeast moss knoll
    const lantern = decorationGenerator.createLantern(1.0);
    lantern.position.set(12.5, this.app.terrain.getHeightAt(12.5, 12.0), 12.0);
    lantern.rotation.y = -Math.PI / 4;
    this.app.addPlacedObject(lantern, {
      category: "traditional",
      id: "lantern",
      scale: 1.0,
      type: "decoration",
      subType: "lantern",
    });

    // Traditional bamboo fences edging the south perimeter
    const fence1 = decorationGenerator.createBambooFence(0.9, 6.0);
    fence1.position.set(-6, 0, 16.5);
    this.app.addPlacedObject(fence1, {
      category: "traditional",
      id: "bamboo-fence",
      scale: 0.9,
      type: "decoration",
      subType: "bamboo-fence",
    });

    const fence2 = decorationGenerator.createBambooFence(0.9, 6.0);
    fence2.position.set(6, 0, 16.5);
    this.app.addPlacedObject(fence2, {
      category: "traditional",
      id: "bamboo-fence",
      scale: 0.9,
      type: "decoration",
      subType: "bamboo-fence",
    });

    this.app.weather.setPreset("noon");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. Saihō-ji & Tōfuku-ji Inspired Moss Hills Sanctuary
  // Dramatic mountainous landscape: soaring Mount Horai summit, tiered
  // green ridges, deep mountain glen, ancient bonsai pines, crimson maples,
  // sacred San-zon stone triad, and winding stepping stone pass.
  // ═════════════════════════════════════════════════════════════════════════
  loadMountainSanctuary() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // ── 1. Sculpt Dramatic Multi-Tiered Mountain Topography ───────────
    // Northwest Mount Horai: Grand peak + secondary shoulder ridge
    const horaiMain = { x: -7.5, z: -6.5, r: 8.5, h: 2.65 };
    const horaiShoulder = { x: -3.5, z: -9.5, r: 6.5, h: 1.85 };
    const horaiFoot = { x: -9.5, z: -1.5, r: 5.5, h: 1.15 };

    // East Kamejima (Turtle Island) ridge & terraced knoll
    const kameMain = { x: 7.5, z: -4.0, r: 7.2, h: 1.95 };
    const kameTerrace = { x: 9.8, z: 1.5, r: 5.4, h: 1.25 };

    // South Tsurujima (Crane Island) cascading knolls
    const tsuruMain = { x: -4.5, z: 7.2, r: 6.2, h: 1.45 };
    const tsuruFoot = { x: -8.5, z: 4.8, r: 4.8, h: 0.95 };

    // Southeast Bamboo Ridge
    const bambooMound = { x: 8.2, z: 7.5, r: 5.6, h: 1.35 };

    const mountainMounds = [
      horaiMain,
      horaiShoulder,
      horaiFoot,
      kameMain,
      kameTerrace,
      tsuruMain,
      tsuruFoot,
      bambooMound,
    ];

    mountainMounds.forEach((m) => {
      this.app.terrain.deformTerrain({ x: m.x, z: m.z }, m.r, m.h);
      this.app.terrain.paintSurface(
        { x: m.x, z: m.z },
        m.r * 0.95,
        "moss",
        0.95,
      );
      if (this.app.mossManager) {
        const bedDensity = m.h > 1.8 ? 8 : m.h > 1.2 ? 5 : 3;
        this.app.mossManager.growGroundMossBeds(
          { x: m.x, z: m.z },
          m.r * 0.7,
          this.app.terrain,
          bedDensity,
        );
      }
    });

    // ── 2. Sacred Rock Compositions ───────────────────────────────────
    // Sacred Buddhist San-zon Triad at the Mount Horai summit
    const triad = rockGenerator.createRock("triad", 1.45);
    const triadX = -7.2,
      triadZ = -5.8;
    triad.position.set(
      triadX,
      this.app.terrain.getHeightAt(triadX, triadZ),
      triadZ,
    );
    triad.rotation.y = -0.55;
    this.app.addPlacedObject(triad, {
      category: "rocks",
      id: "triad",
      scale: 1.45,
      type: "rock",
      subType: "triad",
    });

    // Rugged Taido standing mountain stone on Mount Horai shoulder
    const taido = rockGenerator.createRock("standing", 1.3);
    const tX = -3.2,
      tZ = -9.2;
    taido.position.set(tX, this.app.terrain.getHeightAt(tX, tZ), tZ);
    taido.rotation.y = 0.4;
    this.app.addPlacedObject(taido, {
      category: "rocks",
      id: "standing",
      scale: 1.3,
      type: "rock",
      subType: "standing",
    });

    // Reclining companion stone on East Kamejima crest
    const kameRock = rockGenerator.createRock("reclining", 1.25);
    const krX = 6.2,
      krZ = -3.2;
    kameRock.position.set(krX, this.app.terrain.getHeightAt(krX, krZ), krZ);
    kameRock.rotation.y = 0.75;
    this.app.addPlacedObject(kameRock, {
      category: "rocks",
      id: "reclining",
      scale: 1.25,
      type: "rock",
      subType: "reclining",
    });

    // Flat altar meditation stone on East lower terrace
    const flatRock = rockGenerator.createRock("flat", 1.2);
    const frX = 8.8,
      frZ = 1.0;
    flatRock.position.set(frX, this.app.terrain.getHeightAt(frX, frZ), frZ);
    flatRock.rotation.y = -0.3;
    this.app.addPlacedObject(flatRock, {
      category: "rocks",
      id: "flat",
      scale: 1.2,
      type: "rock",
      subType: "flat",
    });

    // Guard stone at mountain pass entrance
    const guardRock = rockGenerator.createRock("standing", 1.05);
    const grX = -1.8,
      grZ = 3.5;
    guardRock.position.set(grX, this.app.terrain.getHeightAt(grX, grZ), grZ);
    guardRock.rotation.y = -0.8;
    this.app.addPlacedObject(guardRock, {
      category: "rocks",
      id: "standing",
      scale: 1.05,
      type: "rock",
      subType: "standing",
    });

    // ── 3. Diverse Layered Flora ──────────────────────────────────────
    // Ancient Heroic Bonsai Pine on Mount Horai crest
    const grandPine = treeGenerator.createTree("pine", 1.55);
    const gpX = -8.2,
      gpZ = -7.2;
    grandPine.position.set(gpX, this.app.terrain.getHeightAt(gpX, gpZ), gpZ);
    grandPine.rotation.y = 0.85;
    this.app.addPlacedObject(grandPine, {
      category: "flora",
      id: "pine",
      scale: 1.55,
      type: "tree",
      subType: "pine",
    });

    // Second leaning Bonsai Pine on Kamejima ridge
    const pine2 = treeGenerator.createTree("pine", 1.25);
    const p2X = 8.5,
      p2Z = -4.5;
    pine2.position.set(p2X, this.app.terrain.getHeightAt(p2X, p2Z), p2Z);
    pine2.rotation.y = -0.65;
    this.app.addPlacedObject(pine2, {
      category: "flora",
      id: "pine",
      scale: 1.25,
      type: "tree",
      subType: "pine",
    });

    // Japanese Red Maple (Momiji) blazing on East terrace
    const maple1 = treeGenerator.createTree("maple", 1.35);
    const m1X = 7.0,
      m1Z = -1.5;
    maple1.position.set(m1X, this.app.terrain.getHeightAt(m1X, m1Z), m1Z);
    maple1.rotation.y = -0.35;
    this.app.addPlacedObject(maple1, {
      category: "flora",
      id: "maple",
      scale: 1.35,
      type: "tree",
      subType: "maple",
    });

    // Second Red Maple framing the western pass
    const maple2 = treeGenerator.createTree("maple", 1.15);
    const m2X = -5.8,
      m2Z = 1.5;
    maple2.position.set(m2X, this.app.terrain.getHeightAt(m2X, m2Z), m2Z);
    maple2.rotation.y = 0.45;
    this.app.addPlacedObject(maple2, {
      category: "flora",
      id: "maple",
      scale: 1.15,
      type: "tree",
      subType: "maple",
    });

    // Blossoming Weeping Sakura sheltered in the central mountain glen
    const sakura = treeGenerator.createTree("sakura", 1.3);
    const sX = 1.8,
      sZ = -6.2;
    sakura.position.set(sX, this.app.terrain.getHeightAt(sX, sZ), sZ);
    sakura.rotation.y = -0.75;
    this.app.addPlacedObject(sakura, {
      category: "flora",
      id: "sakura",
      scale: 1.3,
      type: "tree",
      subType: "sakura",
    });

    // Bamboo Groves
    const bamboo1 = treeGenerator.createTree("bamboo", 1.3);
    bamboo1.position.set(8.2, this.app.terrain.getHeightAt(8.2, 7.5), 7.5);
    this.app.addPlacedObject(bamboo1, {
      category: "flora",
      id: "bamboo",
      scale: 1.3,
      type: "tree",
      subType: "bamboo",
    });

    const bamboo2 = treeGenerator.createTree("bamboo", 1.15);
    bamboo2.position.set(
      -1.5,
      this.app.terrain.getHeightAt(-1.5, -12.0),
      -12.0,
    );
    this.app.addPlacedObject(bamboo2, {
      category: "flora",
      id: "bamboo",
      scale: 1.15,
      type: "tree",
      subType: "bamboo",
    });

    // Sculpted Cloud-Pruned Azalea Shrubs (Tsutsuji & Satsuki)
    const shrubList = [
      { x: -5.0, z: -4.5, type: "azalea", scale: 1.2 },
      { x: -2.8, z: 6.0, type: "azalea-white", scale: 1.1 },
      { x: 5.2, z: 1.8, type: "azalea", scale: 1.15 },
      { x: 7.8, z: -6.5, type: "azalea-white", scale: 1.05 },
      { x: -7.5, z: 6.2, type: "azalea", scale: 1.0 },
    ];
    shrubList.forEach((sh, idx) => {
      const az = treeGenerator.createTree(sh.type, sh.scale);
      az.position.set(sh.x, this.app.terrain.getHeightAt(sh.x, sh.z), sh.z);
      az.rotation.y = idx * 1.25;
      this.app.addPlacedObject(az, {
        category: "flora",
        id: sh.type,
        scale: sh.scale,
        type: "shrub",
        subType: sh.type,
      });
    });

    // ── 4. Traditional Architecture & Garden Trail ────────────────────
    // Curved stepping stone path winding through the mountain pass
    const pathCoords = [
      { x: 0.5, z: 12.0 },
      { x: 0.8, z: 9.0 },
      { x: 1.5, z: 5.5 },
      { x: 0.8, z: 2.0 },
      { x: -0.5, z: -1.5 },
      { x: 0.2, z: -4.8 },
      { x: -0.8, z: -7.5 },
    ];
    pathCoords.forEach((p) => {
      const step = decorationGenerator.createSteppingStone(0.95);
      const sy = this.app.terrain.getHeightAt(p.x, p.z) + 0.04;
      step.position.set(p.x, sy, p.z);
      this.app.addPlacedObject(step, {
        category: "traditional",
        id: "stepping",
        scale: 0.95,
        type: "decoration",
        subType: "stepping",
      });
    });

    // Stone Lanterns
    const lanternSouth = decorationGenerator.createLantern(1.15);
    lanternSouth.position.set(
      -3.2,
      this.app.terrain.getHeightAt(-3.2, 7.5),
      7.5,
    );
    lanternSouth.rotation.y = 0.5;
    this.app.addPlacedObject(lanternSouth, {
      category: "traditional",
      id: "lantern",
      scale: 1.15,
      type: "decoration",
      subType: "lantern",
    });

    const lanternPass = decorationGenerator.createLantern(1.05);
    lanternPass.position.set(2.8, this.app.terrain.getHeightAt(2.8, 3.2), 3.2);
    lanternPass.rotation.y = -0.4;
    this.app.addPlacedObject(lanternPass, {
      category: "traditional",
      id: "lantern",
      scale: 1.05,
      type: "decoration",
      subType: "lantern",
    });

    // Tsukubai water basin tucked in the moss glen
    const tsukubai = decorationGenerator.createTsukubai(1.1);
    const tbX = 3.5,
      tbZ = -3.2;
    tsukubai.position.set(tbX, this.app.terrain.getHeightAt(tbX, tbZ), tbZ);
    this.app.addPlacedObject(tsukubai, {
      category: "traditional",
      id: "tsukubai",
      scale: 1.1,
      type: "decoration",
      subType: "tsukubai",
    });

    // Shishi-odoshi rocker next to the basin
    const shishi = decorationGenerator.createShishiOdoshi(1.1);
    const shX = 4.6,
      shZ = -2.8;
    shishi.position.set(shX, this.app.terrain.getHeightAt(shX, shZ), shZ);
    shishi.rotation.y = 1.1;
    this.app.addPlacedObject(shishi, {
      category: "traditional",
      id: "shishi",
      scale: 1.1,
      type: "decoration",
      subType: "shishi",
    });

    // Shinto Torii Gate marking the garden's sacred threshold
    const torii = decorationGenerator.createToriiGate(1.05);
    torii.position.set(0.6, this.app.terrain.getHeightAt(0.6, 12.8), 12.8);
    torii.rotation.y = Math.PI;
    this.app.addPlacedObject(torii, {
      category: "traditional",
      id: "torii",
      scale: 1.05,
      type: "decoration",
      subType: "torii",
    });

    // Bamboo fencing flanking entrance
    const fenceL = decorationGenerator.createBambooFence(0.9, 5.0);
    fenceL.position.set(-5.5, 0, 11.5);
    fenceL.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceL, {
      category: "traditional",
      id: "bamboo-fence",
      scale: 0.9,
      type: "decoration",
      subType: "bamboo-fence",
    });

    const fenceR = decorationGenerator.createBambooFence(0.9, 5.0);
    fenceR.position.set(6.5, 0, 11.5);
    fenceR.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceR, {
      category: "traditional",
      id: "bamboo-fence",
      scale: 0.9,
      type: "decoration",
      subType: "bamboo-fence",
    });

    this.app.weather.setPreset("morning");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. Strolling Pond Garden (Water Pond Sanctuary)
  // Deep reflective koi lake, central rocky island (Nakajima), soaring north
  // lookout bluff, weeping Sakura & crimson Maples, arched cedar bridge,
  // shoreline boulder armor, swimming Nishikigoi, and stone lanterns.
  // ═════════════════════════════════════════════════════════════════════════
  loadKoiPondGarden() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // ── 1. Sculpt Surrounding Hills & Central Island ──────────────────
    // North High Lookout Bluff overlooking water
    const northBluff = { x: 4.5, z: -8.5, r: 7.2, h: 2.35 };
    // West Shore Knoll
    const westKnoll = { x: -8.5, z: 3.5, r: 6.2, h: 1.55 };
    // East Stream Ridge
    const eastRidge = { x: 9.0, z: 4.0, r: 5.5, h: 1.25 };
    // Southwest boundary knoll
    const swKnoll = { x: -7.5, z: -6.5, r: 5.0, h: 1.15 };

    const hills = [northBluff, westKnoll, eastRidge, swKnoll];
    hills.forEach((hl) => {
      this.app.terrain.deformTerrain({ x: hl.x, z: hl.z }, hl.r, hl.h);
      this.app.terrain.paintSurface(
        { x: hl.x, z: hl.z },
        hl.r * 0.95,
        "moss",
        0.95,
      );
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: hl.x, z: hl.z },
          hl.r * 0.65,
          this.app.terrain,
          6,
        );
      }
    });

    // ── 2. Carve Organic Interconnected Pond System ───────────────────
    const pondCenter = { x: 1.8, z: 0.5, r: 8.2, depth: 1.2 };
    const pondNorth = { x: 5.2, z: -4.8, r: 5.6, depth: 1.0 };
    const pondWestInlet = { x: -3.8, z: -2.2, r: 4.8, depth: 0.85 };

    const pools = [pondCenter, pondNorth, pondWestInlet];
    pools.forEach((p) => {
      this.app.terrain.carveWaterPool({ x: p.x, z: p.z }, p.r, p.depth);
      this.app.terrain.paintSurface(
        { x: p.x, z: p.z },
        p.r * 1.35,
        "moss",
        0.88,
      );
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: p.x, z: p.z },
          p.r * 1.05,
          this.app.terrain,
          5,
        );
      }
    });

    // Central Rocky Pond Island (Nakajima) rising out of the water
    const island = { x: 0.5, z: -0.6, r: 2.5, h: 0.35 };
    this.app.terrain.deformTerrain(
      { x: island.x, z: island.z },
      island.r,
      island.h,
    );
    this.app.terrain.paintSurface(
      { x: island.x, z: island.z },
      island.r,
      "moss",
      1.0,
    );
    if (this.app.mossManager) {
      this.app.mossManager.growGroundMossBeds(
        { x: island.x, z: island.z },
        island.r * 0.8,
        this.app.terrain,
        4,
      );
    }

    // ── 3. Shoreline Armor & Island Rocks ─────────────────────────────
    // San-zon Triad commanding the high North Bluff
    const triad = rockGenerator.createRock("triad", 1.4);
    const trY = this.app.terrain.getHeightAt(
      northBluff.x + 0.5,
      northBluff.z + 1.2,
    );
    triad.position.set(northBluff.x + 0.5, trY, northBluff.z + 1.2);
    triad.rotation.y = -0.4;
    this.app.addPlacedObject(triad, {
      category: "rocks",
      id: "triad",
      scale: 1.4,
      type: "rock",
      subType: "triad",
    });

    // Rocks on Central Island
    const islandRock1 = rockGenerator.createRock("standing", 1.15);
    const ir1Y = this.app.terrain.getHeightAt(island.x - 0.5, island.z + 0.3);
    islandRock1.position.set(island.x - 0.5, ir1Y, island.z + 0.3);
    islandRock1.rotation.y = 0.6;
    this.app.addPlacedObject(islandRock1, {
      category: "rocks",
      id: "standing",
      scale: 1.15,
      type: "rock",
      subType: "standing",
    });

    const islandRock2 = rockGenerator.createRock("reclining", 0.95);
    const ir2Y = this.app.terrain.getHeightAt(island.x + 0.7, island.z - 0.4);
    islandRock2.position.set(island.x + 0.7, ir2Y, island.z - 0.4);
    islandRock2.rotation.y = -0.7;
    this.app.addPlacedObject(islandRock2, {
      category: "rocks",
      id: "reclining",
      scale: 0.95,
      type: "rock",
      subType: "reclining",
    });

    // Shoreline Armor Stones lining pond perimeters
    const bankStones = [
      { x: -1.8, z: -3.8, type: "standing", scale: 1.1 },
      { x: -5.2, z: -0.8, type: "reclining", scale: 1.2 },
      { x: 3.5, z: 4.8, type: "reclining", scale: 1.15 },
      { x: -0.5, z: 4.2, type: "flat", scale: 1.05 },
      { x: 7.2, z: -1.2, type: "standing", scale: 1.25 },
    ];
    bankStones.forEach((bs) => {
      const rObj = rockGenerator.createRock(bs.type, bs.scale);
      const ry = this.app.terrain.getHeightAt(bs.x, bs.z);
      rObj.position.set(bs.x, ry, bs.z);
      rObj.rotation.y = Math.random() * Math.PI * 2;
      this.app.addPlacedObject(rObj, {
        category: "rocks",
        id: bs.type,
        scale: bs.scale,
        type: "rock",
        subType: bs.type,
      });
    });

    // ── 4. Swimming Nishikigoi (Koi Fish) ─────────────────────────────
    const koiData = [
      { pos: new THREE.Vector3(1.2, -0.22, 1.2), r: 3.8, scale: 1.1 },
      { pos: new THREE.Vector3(2.8, -0.2, -1.0), r: 3.2, scale: 0.92 },
      { pos: new THREE.Vector3(4.8, -0.22, -4.2), r: 2.6, scale: 1.0 },
      { pos: new THREE.Vector3(-2.5, -0.2, -1.8), r: 2.4, scale: 0.85 },
    ];
    koiData.forEach((k) => {
      const koi = decorationGenerator.createKoiFish(k.pos, k.r);
      this.app.addPlacedObject(koi, {
        category: "traditional",
        id: "koi",
        scale: k.scale,
        type: "decoration",
        subType: "koi",
      });
    });

    const goldfishData = [
      { pos: new THREE.Vector3(0.5, -0.21, -2.2), r: 2.2, scale: 0.9 },
      { pos: new THREE.Vector3(3.2, -0.21, 2.0), r: 2.0, scale: 0.85 },
    ];
    goldfishData.forEach((g) => {
      const gf = decorationGenerator.createGoldfish(g.pos, g.r);
      this.app.addPlacedObject(gf, {
        category: "traditional",
        id: "goldfish",
        scale: g.scale,
        type: "decoration",
        subType: "goldfish",
      });
    });

    // ── 5. Flora & Trees ──────────────────────────────────────────────
    // Splendid Weeping Cherry Blossom (Sakura) bowing over northern pool
    const sakura = treeGenerator.createTree("sakura", 1.45);
    const sakX = 4.2,
      sakZ = -6.8;
    sakura.position.set(sakX, this.app.terrain.getHeightAt(sakX, sakZ), sakZ);
    sakura.rotation.y = -0.7;
    this.app.addPlacedObject(sakura, {
      category: "flora",
      id: "sakura",
      scale: 1.45,
      type: "tree",
      subType: "sakura",
    });

    // Bonsai Pine rooted onto the Central Island
    const islandPine = treeGenerator.createTree("pine", 1.15);
    const ipY = this.app.terrain.getHeightAt(island.x + 0.2, island.z + 0.2);
    islandPine.position.set(island.x + 0.2, ipY, island.z + 0.2);
    islandPine.rotation.y = 0.45;
    this.app.addPlacedObject(islandPine, {
      category: "flora",
      id: "pine",
      scale: 1.15,
      type: "tree",
      subType: "pine",
    });

    // Majestic Pine atop the North Bluff
    const bluffPine = treeGenerator.createTree("pine", 1.4);
    const bpY = this.app.terrain.getHeightAt(
      northBluff.x - 1.5,
      northBluff.z - 0.5,
    );
    bluffPine.position.set(northBluff.x - 1.5, bpY, northBluff.z - 0.5);
    bluffPine.rotation.y = 0.9;
    this.app.addPlacedObject(bluffPine, {
      category: "flora",
      id: "pine",
      scale: 1.4,
      type: "tree",
      subType: "pine",
    });

    // Japanese Red Maple (Momiji) on West Shore Knoll
    const mapleWest = treeGenerator.createTree("maple", 1.3);
    const mwY = this.app.terrain.getHeightAt(westKnoll.x, westKnoll.z);
    mapleWest.position.set(westKnoll.x, mwY, westKnoll.z);
    mapleWest.rotation.y = -0.4;
    this.app.addPlacedObject(mapleWest, {
      category: "flora",
      id: "maple",
      scale: 1.3,
      type: "tree",
      subType: "maple",
    });

    // Second Red Maple on the East Ridge
    const mapleEast = treeGenerator.createTree("maple", 1.1);
    const meY = this.app.terrain.getHeightAt(eastRidge.x, eastRidge.z);
    mapleEast.position.set(eastRidge.x, meY, eastRidge.z);
    mapleEast.rotation.y = 0.3;
    this.app.addPlacedObject(mapleEast, {
      category: "flora",
      id: "maple",
      scale: 1.1,
      type: "tree",
      subType: "maple",
    });

    // Bamboo Grove screening northeast boundary
    const bamboo = treeGenerator.createTree("bamboo", 1.35);
    const bmY = this.app.terrain.getHeightAt(8.5, -7.5);
    bamboo.position.set(8.5, bmY, -7.5);
    this.app.addPlacedObject(bamboo, {
      category: "flora",
      id: "bamboo",
      scale: 1.35,
      type: "tree",
      subType: "bamboo",
    });

    // Sculpted Flowering Azaleas around water shores and paths
    const azaleaSpots = [
      { x: 4.8, z: 3.8, type: "azalea", scale: 1.2 },
      { x: -5.5, z: 1.5, type: "azalea-white", scale: 1.1 },
      { x: -2.8, z: 4.8, type: "azalea", scale: 1.05 },
      { x: 1.8, z: 5.5, type: "azalea-white", scale: 1.15 },
      { x: -7.5, z: -3.8, type: "azalea", scale: 1.0 },
      { x: 6.8, z: -3.2, type: "azalea-white", scale: 1.0 },
    ];
    azaleaSpots.forEach((az, i) => {
      const azObj = treeGenerator.createTree(az.type, az.scale);
      azObj.position.set(az.x, this.app.terrain.getHeightAt(az.x, az.z), az.z);
      azObj.rotation.y = i * 1.1;
      this.app.addPlacedObject(azObj, {
        category: "flora",
        id: az.type,
        scale: az.scale,
        type: "shrub",
        subType: az.type,
      });
    });

    // ── 6. Traditional Architecture & Paths ───────────────────────────
    // Arched Cedar Bridge (Taiko-bashi) spanning over the pond channel
    const bridge = decorationGenerator.createWoodBridge(0.95);
    const brX = 2.6,
      brZ = -2.2;
    bridge.position.set(brX, 0.02, brZ);
    bridge.rotation.y = -0.75;
    this.app.addPlacedObject(bridge, {
      category: "traditional",
      id: "bridge",
      scale: 0.95,
      type: "decoration",
      subType: "bridge",
    });

    // Stepping stones crossing the pond shallows to Central Island
    const pondSteps = [
      { x: -1.6, z: 3.5 },
      { x: -0.6, z: 2.2 },
      { x: -0.2, z: 0.8 },
      { x: -0.1, z: -0.4 },
    ];
    pondSteps.forEach((p) => {
      const step = decorationGenerator.createSteppingStone(0.92);
      step.position.set(
        p.x,
        Math.max(-0.15, this.app.terrain.getHeightAt(p.x, p.z)) + 0.05,
        p.z,
      );
      this.app.addPlacedObject(step, {
        category: "traditional",
        id: "stepping",
        scale: 0.92,
        type: "decoration",
        subType: "stepping",
      });
    });

    // Stone Lanterns
    const lanternWater = decorationGenerator.createLantern(1.15);
    lanternWater.position.set(3.8, this.app.terrain.getHeightAt(3.8, 4.8), 4.8);
    lanternWater.rotation.y = 0.3;
    this.app.addPlacedObject(lanternWater, {
      category: "traditional",
      id: "lantern",
      scale: 1.15,
      type: "decoration",
      subType: "lantern",
    });

    const lanternWest = decorationGenerator.createLantern(1.0);
    lanternWest.position.set(
      -7.5,
      this.app.terrain.getHeightAt(-7.5, 5.5),
      5.5,
    );
    lanternWest.rotation.y = -0.5;
    this.app.addPlacedObject(lanternWest, {
      category: "traditional",
      id: "lantern",
      scale: 1.0,
      type: "decoration",
      subType: "lantern",
    });

    // Working Shishi-Odoshi & Tsukubai Basin on moss bank
    const shishi = decorationGenerator.createShishiOdoshi(1.15);
    const shishiX = -3.8,
      shishiZ = -0.8;
    shishi.position.set(
      shishiX,
      this.app.terrain.getHeightAt(shishiX, shishiZ),
      shishiZ,
    );
    shishi.rotation.y = 0.5;
    this.app.addPlacedObject(shishi, {
      category: "traditional",
      id: "shishi",
      scale: 1.15,
      type: "decoration",
      subType: "shishi",
    });

    const tsukubai = decorationGenerator.createTsukubai(1.1);
    const tbX = -6.2,
      tbZ = -2.5;
    tsukubai.position.set(tbX, this.app.terrain.getHeightAt(tbX, tbZ), tbZ);
    this.app.addPlacedObject(tsukubai, {
      category: "traditional",
      id: "tsukubai",
      scale: 1.1,
      type: "decoration",
      subType: "tsukubai",
    });

    // Vermilion Torii Gate reflected near western shore
    const torii = decorationGenerator.createToriiGate(1.05);
    const tX = -8.5,
      tZ = -6.5;
    torii.position.set(tX, this.app.terrain.getHeightAt(tX, tZ), tZ);
    torii.rotation.y = -0.4;
    this.app.addPlacedObject(torii, {
      category: "traditional",
      id: "torii",
      scale: 1.05,
      type: "decoration",
      subType: "torii",
    });

    // Bamboo Fence along west boundary
    const fenceW = decorationGenerator.createBambooFence(0.9, 6.0);
    fenceW.position.set(-11.0, 0, 1.0);
    fenceW.rotation.y = Math.PI / 2;
    this.app.addPlacedObject(fenceW, {
      category: "traditional",
      id: "bamboo-fence",
      scale: 0.9,
      type: "decoration",
      subType: "bamboo-fence",
    });

    this.app.weather.setPreset("sunset");
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. Procedural Zen Generator (Asymmetric Harmony / Wabi-Sabi)
  // Deeply varied procedural generation: compound multi-peak hill clusters,
  // winding interconnected waterways, authentic geological rock compositions,
  // multi-tiered canopy and understory vegetation, lanterns, and bridges.
  // ═════════════════════════════════════════════════════════════════════════
  generateProceduralSanctuary() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();

    // Randomize time of day
    const times = ["morning", "noon", "sunset", "night"];
    const chosenTime = times[Math.floor(Math.random() * times.length)];
    this.app.weather.setPreset(chosenTime);

    // ── 1. Interconnected Water Network ───────────────────────────────
    const numPonds = 3 + Math.floor(Math.random() * 3);
    const pondNodes = [];

    // Bias water toward one quadrant to create natural river valley flow
    const waterBias = (Math.random() - 0.5) * 8;
    for (let p = 0; p < numPonds; p++) {
      const px = waterBias + (Math.random() - 0.5) * 14;
      const pz = -10 + (p / numPonds) * 22 + (Math.random() - 0.5) * 3;
      const pr = 3.2 + Math.random() * 4.2;
      pondNodes.push({ x: px, z: pz, radius: pr });
    }

    // Carve each pond and grow lush mossy banks
    pondNodes.forEach((pond) => {
      const depth = 0.85 + Math.random() * 0.55;
      this.app.terrain.carveWaterPool(
        { x: pond.x, z: pond.z },
        pond.radius,
        depth,
      );

      // Koi fish
      const koiCount = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < koiCount; k++) {
        const kOff = (Math.random() - 0.5) * pond.radius * 0.35;
        const koi = decorationGenerator.createKoiFish(
          new THREE.Vector3(pond.x + kOff, -0.22, pond.z + kOff * 0.6),
          pond.radius * 0.5,
        );
        this.app.addPlacedObject(koi, {
          category: "traditional",
          id: "koi",
          scale: 0.85 + Math.random() * 0.25,
          type: "decoration",
          subType: "koi",
        });
      }

      // Mossy banks
      this.app.terrain.paintSurface(
        { x: pond.x, z: pond.z },
        pond.radius * 1.45,
        "moss",
        0.85,
      );
      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: pond.x, z: pond.z },
          pond.radius * 1.1,
          this.app.terrain,
          4 + Math.floor(Math.random() * 3),
        );
      }
    });

    // Carve winding channels between adjacent ponds
    for (let i = 0; i < pondNodes.length - 1; i++) {
      const from = pondNodes[i];
      const to = pondNodes[i + 1];
      const steps = 7 + Math.floor(Math.random() * 4);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const midOffX = (Math.random() - 0.5) * 3.5;
        const cx =
          from.x + (to.x - from.x) * t + midOffX * Math.sin(t * Math.PI);
        const cz = from.z + (to.z - from.z) * t;
        const channelR = 1.6 + Math.random() * 1.4;
        this.app.terrain.carveWaterPool(
          { x: cx, z: cz },
          channelR,
          0.6 + Math.random() * 0.35,
        );
        this.app.terrain.paintSurface(
          { x: cx, z: cz },
          channelR * 1.6,
          "moss",
          0.7,
        );
      }
    }

    // ── 2. Compound Multi-Peak Hills & Ridges ──────────────────────────
    // Create 4-6 primary mountain massifs, each accompanied by 1-2 secondary
    // shoulder mounds to create realistic, varied mountain profiles
    const numHills = 4 + Math.floor(Math.random() * 3);
    const hillPeaks = [];

    for (let h = 0; h < numHills; h++) {
      let hx,
        hz,
        tries = 0;
      do {
        hx = (Math.random() - 0.5) * 24;
        hz = (Math.random() - 0.5) * 24;
        tries++;
      } while (
        tries < 12 &&
        pondNodes.some(
          (pn) => Math.hypot(pn.x - hx, pn.z - hz) < pn.radius + 2.5,
        )
      );

      const hillRadius = 4.5 + Math.random() * 4.5;
      const hillHeight = 1.3 + Math.random() * 1.8;

      // Primary peak
      this.app.terrain.deformTerrain({ x: hx, z: hz }, hillRadius, hillHeight);
      this.app.terrain.paintSurface(
        { x: hx, z: hz },
        hillRadius * 0.95,
        "moss",
        0.95,
      );

      // Secondary organic shoulder mound (compound mountain profile)
      const shoulderAngle = Math.random() * Math.PI * 2;
      const shoulderDist = hillRadius * (0.45 + Math.random() * 0.35);
      const sx = hx + Math.cos(shoulderAngle) * shoulderDist;
      const sz = hz + Math.sin(shoulderAngle) * shoulderDist;
      const shoulderRadius = hillRadius * (0.6 + Math.random() * 0.25);
      const shoulderHeight = hillHeight * (0.55 + Math.random() * 0.25);

      this.app.terrain.deformTerrain(
        { x: sx, z: sz },
        shoulderRadius,
        shoulderHeight,
      );
      this.app.terrain.paintSurface(
        { x: sx, z: sz },
        shoulderRadius * 0.9,
        "moss",
        0.9,
      );

      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: hx, z: hz },
          hillRadius * 0.75,
          this.app.terrain,
          6 + Math.floor(Math.random() * 5),
        );
      }

      hillPeaks.push({ x: hx, z: hz, radius: hillRadius, height: hillHeight });

      // Peak feature: Canopy tree or Sacred Stone
      if (Math.random() > 0.2) {
        const floraTypes = ["pine", "maple", "sakura", "bamboo"];
        const fType = floraTypes[Math.floor(Math.random() * floraTypes.length)];
        const floraScale = 1.1 + Math.random() * 0.5;
        const flora = treeGenerator.createTree(fType, floraScale);
        flora.position.set(hx, this.app.terrain.getHeightAt(hx, hz), hz);
        flora.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(flora, {
          category: "flora",
          id: fType,
          scale: floraScale,
          type: "tree",
          subType: fType,
        });
      } else {
        const rockType = Math.random() > 0.4 ? "triad" : "standing";
        const rockScale = 1.1 + Math.random() * 0.5;
        const rock = rockGenerator.createRock(rockType, rockScale);
        rock.position.set(hx, this.app.terrain.getHeightAt(hx, hz), hz);
        rock.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(rock, {
          category: "rocks",
          id: rockType,
          scale: rockScale,
          type: "rock",
          subType: rockType,
        });
      }

      // Secondary understory shrub or companion stone on slope
      if (Math.random() > 0.3) {
        const sa = Math.random() * Math.PI * 2;
        const sfx = hx + Math.cos(sa) * hillRadius * 0.5;
        const sfz = hz + Math.sin(sa) * hillRadius * 0.5;
        const shrubType = Math.random() > 0.5 ? "azalea" : "azalea-white";
        const shrubScale = 0.95 + Math.random() * 0.35;
        const shrub = treeGenerator.createTree(shrubType, shrubScale);
        shrub.position.set(sfx, this.app.terrain.getHeightAt(sfx, sfz), sfz);
        shrub.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(shrub, {
          category: "flora",
          id: shrubType,
          scale: shrubScale,
          type: "shrub",
          subType: shrubType,
        });
      }
    }

    // ── 3. Structured Geological Rock Formations ───────────────────────
    // Spawn 2-4 cohesive stone groupings (Triad or Standing + Reclining + Flat)
    const numRockClusters = 2 + Math.floor(Math.random() * 3);
    for (let rc = 0; rc < numRockClusters; rc++) {
      const cx = (Math.random() - 0.5) * 20;
      const cz = (Math.random() - 0.5) * 20;
      const clusterR = 2.0 + Math.random() * 1.2;

      // Small moss cushion base
      this.app.terrain.deformTerrain({ x: cx, z: cz }, clusterR, 0.22);
      this.app.terrain.paintSurface({ x: cx, z: cz }, clusterR, "moss", 0.92);

      const isTriad = Math.random() > 0.5;
      if (isTriad) {
        const triadObj = rockGenerator.createRock(
          "triad",
          1.1 + Math.random() * 0.3,
        );
        const y = this.app.terrain.getHeightAt(cx, cz);
        triadObj.position.set(cx, y, cz);
        triadObj.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(triadObj, {
          category: "rocks",
          id: "triad",
          scale: 1.2,
          type: "rock",
          subType: "triad",
        });
      } else {
        // Paired standing and reclining stones
        const standing = rockGenerator.createRock(
          "standing",
          1.15 + Math.random() * 0.3,
        );
        standing.position.set(cx, this.app.terrain.getHeightAt(cx, cz), cz);
        standing.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(standing, {
          category: "rocks",
          id: "standing",
          scale: 1.2,
          type: "rock",
          subType: "standing",
        });

        const rx = cx + (Math.random() - 0.5) * 1.5;
        const rz = cz + (Math.random() - 0.5) * 1.5;
        const reclining = rockGenerator.createRock(
          "reclining",
          0.85 + Math.random() * 0.3,
        );
        reclining.position.set(rx, this.app.terrain.getHeightAt(rx, rz), rz);
        reclining.rotation.y = Math.random() * Math.PI * 2;
        this.app.addPlacedObject(reclining, {
          category: "rocks",
          id: "reclining",
          scale: 0.95,
          type: "rock",
          subType: "reclining",
        });
      }

      if (this.app.mossManager) {
        this.app.mossManager.growGroundMossBeds(
          { x: cx, z: cz },
          clusterR * 0.8,
          this.app.terrain,
          3,
        );
      }
    }

    // ── 4. Traditional Architecture & Paths ───────────────────────────
    // Bridge over one of the pond nodes
    if (pondNodes.length > 0) {
      const bridgePond =
        pondNodes[Math.floor(Math.random() * pondNodes.length)];
      const bridge = decorationGenerator.createWoodBridge(
        0.95 + Math.random() * 0.15,
      );
      bridge.position.set(bridgePond.x, 0.02, bridgePond.z);
      bridge.rotation.y = Math.random() * Math.PI;
      this.app.addPlacedObject(bridge, {
        category: "traditional",
        id: "bridge",
        scale: 0.95,
        type: "decoration",
        subType: "bridge",
      });
    }

    // Winding stepping stone path
    const numSteps = 5 + Math.floor(Math.random() * 4);
    const pathStartX = (Math.random() - 0.5) * 8;
    const pathStartZ = 11 + Math.random() * 3;
    for (let s = 0; s < numSteps; s++) {
      const sx = pathStartX + (Math.random() - 0.5) * 2.2;
      const sz = pathStartZ - s * (2.2 + Math.random() * 0.8);
      const step = decorationGenerator.createSteppingStone(
        0.9 + Math.random() * 0.15,
      );
      step.position.set(
        sx,
        Math.max(-0.1, this.app.terrain.getHeightAt(sx, sz)) + 0.04,
        sz,
      );
      this.app.addPlacedObject(step, {
        category: "traditional",
        id: "stepping",
        scale: 0.9,
        type: "decoration",
        subType: "stepping",
      });
    }

    // Stone lanterns
    const lantern1 = decorationGenerator.createLantern(
      1.0 + Math.random() * 0.15,
    );
    const lx = (Math.random() - 0.5) * 16;
    const lz = (Math.random() - 0.5) * 16;
    lantern1.position.set(lx, this.app.terrain.getHeightAt(lx, lz), lz);
    this.app.addPlacedObject(lantern1, {
      category: "traditional",
      id: "lantern",
      scale: 1.0,
      type: "decoration",
      subType: "lantern",
    });

    if (pondNodes.length > 0) {
      const lp = pondNodes[pondNodes.length - 1];
      const l2x = lp.x + lp.radius * 1.05;
      const l2z = lp.z + (Math.random() - 0.5) * 2.5;
      const lantern2 = decorationGenerator.createLantern(
        0.95 + Math.random() * 0.15,
      );
      lantern2.position.set(l2x, this.app.terrain.getHeightAt(l2x, l2z), l2z);
      lantern2.rotation.y = Math.random() * Math.PI;
      this.app.addPlacedObject(lantern2, {
        category: "traditional",
        id: "lantern",
        scale: 1.0,
        type: "decoration",
        subType: "lantern",
      });
    }

    // Shishi-odoshi near water bank
    if (pondNodes.length > 0) {
      const pf = pondNodes[0];
      const shishi = decorationGenerator.createShishiOdoshi(
        1.05 + Math.random() * 0.15,
      );
      const shX = pf.x + pf.radius * 0.85;
      const shZ = pf.z + (Math.random() - 0.5) * 2.0;
      shishi.position.set(shX, this.app.terrain.getHeightAt(shX, shZ), shZ);
      shishi.rotation.y = Math.random() * Math.PI * 2;
      this.app.addPlacedObject(shishi, {
        category: "traditional",
        id: "shishi",
        scale: 1.1,
        type: "decoration",
        subType: "shishi",
      });
    }

    // Tsukubai water basin
    if (pondNodes.length > 1 && Math.random() > 0.3) {
      const tp = pondNodes[1];
      const tbx = tp.x - tp.radius * 0.9;
      const tbz = tp.z + (Math.random() - 0.5) * 2;
      const tsukubai = decorationGenerator.createTsukubai(
        1.0 + Math.random() * 0.15,
      );
      tsukubai.position.set(tbx, this.app.terrain.getHeightAt(tbx, tbz), tbz);
      this.app.addPlacedObject(tsukubai, {
        category: "traditional",
        id: "tsukubai",
        scale: 1.0,
        type: "decoration",
        subType: "tsukubai",
      });
    }

    // Torii Gate
    if (Math.random() > 0.25) {
      const torii = decorationGenerator.createToriiGate(
        0.95 + Math.random() * 0.15,
      );
      const tx = (Math.random() - 0.5) * 16;
      const tz = 11 + Math.random() * 4;
      torii.position.set(tx, this.app.terrain.getHeightAt(tx, tz), tz);
      torii.rotation.y = Math.PI + (Math.random() - 0.5) * 0.4;
      this.app.addPlacedObject(torii, {
        category: "traditional",
        id: "torii",
        scale: 1.0,
        type: "decoration",
        subType: "torii",
      });
    }

    // Bamboo Fencing
    const numFences = 1 + (Math.random() > 0.5 ? 1 : 0);
    for (let f = 0; f < numFences; f++) {
      const fence = decorationGenerator.createBambooFence(
        0.85,
        5.0 + Math.random() * 3.0,
      );
      const fenceX = (f === 0 ? 1 : -1) * (11 + Math.random() * 2);
      fence.position.set(fenceX, 0, (Math.random() - 0.5) * 10);
      fence.rotation.y = Math.PI / 2;
      this.app.addPlacedObject(fence, {
        category: "traditional",
        id: "bamboo-fence",
        scale: 0.85,
        type: "decoration",
        subType: "bamboo-fence",
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. Blank Slate / Clean Sand Canvas
  // ═════════════════════════════════════════════════════════════════════════
  loadBlankCanvas() {
    this.app.clearPlacedObjects();
    this.app.terrain.resetToFlat();
    this.app.weather.setPreset("noon");
  }
}
