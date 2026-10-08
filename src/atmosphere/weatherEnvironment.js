import * as THREE from 'three';

// Atmospheric Lighting, Sky, Seasons, and Zen Particle Effects
export class WeatherEnvironment {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.currentPreset = 'noon';
    this.timeOfDayPresets = {
      morning: {
        skyTop: 0x8ba6bc,
        skyBottom: 0xf5cfb5,
        ambientColor: 0xbaa496,
        ambientIntensity: 0.65,
        sunColor: 0xffdfaa,
        sunIntensity: 1.4,
        sunPos: new THREE.Vector3(18, 12, 16),
        fogColor: 0xd4c7be,
        fogDensity: 0.012
      },
      noon: {
        skyTop: 0x5a8fb8,
        skyBottom: 0xddeef8,
        ambientColor: 0x9fb5c6,
        ambientIntensity: 0.75,
        sunColor: 0xfffaf0,
        sunIntensity: 2.2,
        sunPos: new THREE.Vector3(12, 28, 14),
        fogColor: 0xcde0ee,
        fogDensity: 0.006
      },
      sunset: {
        skyTop: 0x2e355c,
        skyBottom: 0xde6f47,
        ambientColor: 0x7a5254,
        ambientIntensity: 0.6,
        sunColor: 0xff7b39,
        sunIntensity: 1.8,
        sunPos: new THREE.Vector3(25, 6, 8),
        fogColor: 0xa86154,
        fogDensity: 0.014
      },
      night: {
        skyTop: 0x070b16,
        skyBottom: 0x141f38,
        ambientColor: 0x22304d,
        ambientIntensity: 0.45,
        sunColor: 0x8bb1e8,
        sunIntensity: 0.8,
        sunPos: new THREE.Vector3(-14, 20, -12),
        fogColor: 0x0f182a,
        fogDensity: 0.012
      }
    };

    this.initLighting();
    this.initSkyDome();
    this.initParticles();
    this.initFireflies();
    this.setPreset('noon');
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;

    const d = 24;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;

    this.scene.add(this.sunLight);

    // Subtle hemisphere light for natural ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
    this.scene.add(this.hemiLight);

    // Subtle atmospheric fog
    this.scene.fog = new THREE.FogExp2(0xcde0ee, 0.006);
  }

  initSkyDome() {
    const skyGeo = new THREE.SphereGeometry(150, 24, 16);
    skyGeo.scale(-1, 1, 1);

    // Procedural gradient vertex shader for smooth tranquil sky
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x5a8fb8) },
      bottomColor: { value: new THREE.Color(0xddeef8) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  // Drifting Snowflakes / Soft Winter Snow (Yukimi)
  initParticles() {
    this.isSnowEnabled = true;
    this.petalCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.petalCount * 3);
    const rotations = new Float32Array(this.petalCount * 3);
    const velocities = [];

    const gardenSpread = 32;

    for (let i = 0; i < this.petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * gardenSpread;
      positions[i * 3 + 1] = 0.5 + Math.random() * 11;
      positions[i * 3 + 2] = (Math.random() - 0.5) * gardenSpread;

      rotations[i * 3] = Math.random() * Math.PI;
      rotations[i * 3 + 1] = Math.random() * Math.PI;
      rotations[i * 3 + 2] = Math.random() * Math.PI;

      velocities.push({
        x: 0.35 + Math.random() * 0.45,
        y: -0.45 - Math.random() * 0.4,
        z: 0.2 + Math.random() * 0.35,
        rotSpeed: (Math.random() - 0.5) * 1.5
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.petalVelocities = velocities;

    // Crisp soft white crystalline snowflake texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.4, 'rgba(240, 248, 255, 0.85)');
    grad.addColorStop(0.8, 'rgba(230, 240, 255, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.arc(32, 32, 28, 0, Math.PI * 2);
    pCtx.fill();

    const petalTex = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.PointsMaterial({
      size: 0.48,
      map: petalTex,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.petalParticles = new THREE.Points(geo, pMat);
    this.scene.add(this.petalParticles);
  }

  setSnowEnabled(enabled) {
    this.isSnowEnabled = enabled;
    if (this.petalParticles) {
      this.petalParticles.visible = enabled;
    }
    return this.isSnowEnabled;
  }

  toggleSnow() {
    return this.setSnowEnabled(!this.isSnowEnabled);
  }

  // Floating Fireflies (Hotaru) at Dusk and Night
  initFireflies() {
    this.fireflyCount = 45;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.fireflyCount * 3);

    for (let i = 0; i < this.fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Glow dot texture
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 64;
    fCanvas.height = 64;
    const fCtx = fCanvas.getContext('2d');
    const grad = fCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(230, 255, 120, 1.0)');
    grad.addColorStop(0.3, 'rgba(180, 240, 70, 0.7)');
    grad.addColorStop(1, 'rgba(180, 240, 70, 0)');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 64, 64);

    const fireflyTex = new THREE.CanvasTexture(fCanvas);
    this.fireflyMat = new THREE.PointsMaterial({
      size: 0.65,
      map: fireflyTex,
      transparent: true,
      opacity: 0.0, // hidden during day
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflies = new THREE.Points(geo, this.fireflyMat);
    this.scene.add(this.fireflies);
  }

  setPreset(name) {
    const config = this.timeOfDayPresets[name] || this.timeOfDayPresets.noon;
    this.currentPreset = name;

    this.skyUniforms.topColor.value.setHex(config.skyTop);
    this.skyUniforms.bottomColor.value.setHex(config.skyBottom);

    this.ambientLight.color.setHex(config.ambientColor);
    this.ambientLight.intensity = config.ambientIntensity;

    this.sunLight.color.setHex(config.sunColor);
    this.sunLight.intensity = config.sunIntensity;
    this.sunLight.position.copy(config.sunPos);

    this.scene.fog.color.setHex(config.fogColor);
    this.scene.fog.density = config.fogDensity;

    // Fireflies visible during sunset and night
    if (name === 'night' || name === 'sunset') {
      this.fireflyMat.opacity = name === 'night' ? 0.95 : 0.65;
    } else {
      this.fireflyMat.opacity = 0.0;
    }
  }

  update(time, dt) {
    // 1. Animate Drifting Snowflakes
    if (this.isSnowEnabled && this.petalParticles) {
      const pPos = this.petalParticles.geometry.attributes.position;
      const count = this.petalCount;

      for (let i = 0; i < count; i++) {
        let x = pPos.getX(i);
        let y = pPos.getY(i);
        let z = pPos.getZ(i);

        const vel = this.petalVelocities[i];
        // Gentle wind wave
        x += (vel.x + Math.sin(time + y) * 0.4) * dt;
        y += vel.y * dt;
        z += (vel.z + Math.cos(time + x) * 0.3) * dt;

        // Wrap around garden
        if (y < 0.1 || x > 18 || z > 18) {
          x = -16 + (Math.random() - 0.5) * 8;
          y = 5.0 + Math.random() * 6.0;
          z = -16 + Math.random() * 32;
        }

        pPos.setXYZ(i, x, y, z);
      }
      pPos.needsUpdate = true;
    }

    // 2. Animate Drifting Fireflies (wandering sinusoidal flight)
    if (this.fireflyMat.opacity > 0.05) {
      const fPos = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < this.fireflyCount; i++) {
        let x = fPos.getX(i);
        let y = fPos.getY(i);
        let z = fPos.getZ(i);

        x += Math.sin(time * 0.8 + i * 2.1) * 0.015;
        y += Math.cos(time * 1.2 + i * 1.7) * 0.008;
        z += Math.sin(time * 0.9 + i * 3.3) * 0.015;

        fPos.setXYZ(i, x, y, z);
      }
      fPos.needsUpdate = true;

      // Pulse glow
      this.fireflyMat.size = 0.65 + Math.sin(time * 3.5) * 0.15;
    }
  }
}
