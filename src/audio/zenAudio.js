// Procedural Zen Sound Engine using the Web Audio API
// Generates singing bowls, sand raking texture, flowing water, bamboo shishi-odoshi taps, and ambient wind

class ZenAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.isRaking = false;
    this.rakeGain = null;
    this.rakeFilter = null;
    this.rakeSource = null;
    this.ambientWindGain = null;
    this.waterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.setupRakeSynth();
    this.setupAmbientWind();
    this.setupWaterSynth();

    this.initialized = true;
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Sand Rake Sound: Filtered tactile granular noise
  setupRakeSynth() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    // Pinkish granular noise for crunchy sand texture
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.15;
    }

    this.rakeSource = this.ctx.createBufferSource();
    this.rakeSource.buffer = noiseBuffer;
    this.rakeSource.loop = true;

    this.rakeFilter = this.ctx.createBiquadFilter();
    this.rakeFilter.type = 'bandpass';
    this.rakeFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.rakeFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.rakeGain = this.ctx.createGain();
    this.rakeGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rakeSource.connect(this.rakeFilter);
    this.rakeFilter.connect(this.rakeGain);
    this.rakeGain.connect(this.masterGain);
    this.rakeSource.start(0);
  }

  setRakeIntensity(speed) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const targetGain = Math.min(0.28, Math.max(0, speed * 0.15));
    const targetFreq = 1100 + Math.min(1800, speed * 120);

    const now = this.ctx.currentTime;
    this.rakeGain.gain.setTargetAtTime(targetGain, now, 0.04);
    this.rakeFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
  }

  stopRaking() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    this.rakeGain.gain.setTargetAtTime(0, now, 0.08);
  }

  // 2. Japanese Singing Bowl / Rin Gong (Inharmonic soothing resonance)
  playSingingBowl(fundamental = 216) {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Harmonic & inharmonic modes of bronze singing bowl
    const partials = [
      { ratio: 1.0, gain: 0.35, decay: 6.0 },
      { ratio: 2.76, gain: 0.18, decay: 4.5 },
      { ratio: 5.4, gain: 0.09, decay: 3.2 },
      { ratio: 8.9, gain: 0.03, decay: 1.8 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);

      // Slight vibrato / shimmer
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(2.8 + Math.random() * 0.6, now);
      lfoGain.gain.setValueAtTime(1.2, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + p.decay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.gain, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });
  }

  // 3. Bamboo Shishi-Odoshi "Tok" Clack (Hollow wooden resonance)
  playBambooClack() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // Followed by slight water splash ripple
    setTimeout(() => {
      this.playWaterSplash(0.5);
    }, 40);
  }

  // 4. Water Splash / Koi movement
  playWaterSplash(volume = 0.3) {
    if (this.isMuted || !this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 600 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

    gain.gain.setValueAtTime(0.12 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 5. Ambient Wind & Garden Breeze
  setupAmbientWind() {
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.ambientWindGain = this.ctx.createGain();
    this.ambientWindGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    // Gentle LFO modulating wind filter frequency
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start(0);

    windSource.connect(windFilter);
    windFilter.connect(this.ambientWindGain);
    this.ambientWindGain.connect(this.masterGain);
    windSource.start(0);
  }

  // 6. Ambient Water Brook
  setupWaterSynth() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const waterSource = this.ctx.createBufferSource();
    waterSource.buffer = noiseBuffer;
    waterSource.loop = true;

    const waterFilter = this.ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
    waterFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    waterSource.connect(waterFilter);
    waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);
    waterSource.start(0);
  }

  // 7. Stone Placement Thud
  playPlacementThud() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 8. Soft Organic Foliage / Moss Sprouting Rustle
  playMossRustle() {
    if (this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

export const zenAudio = new ZenAudioEngine();
