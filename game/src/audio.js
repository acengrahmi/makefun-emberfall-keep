// WebAudio synthesis: sound effects and a generative ember-song.
// Everything is oscillators and noise — no audio files, no network.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.step = 0;
    this.nextNoteAt = 0;
    this.melody = [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0, -2];
    this.droneOsc = null;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startDrone();
      return true;
    } catch (e) { return false; }
  }

  startDrone() {
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.value = 0.05; g.connect(this.master);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 110;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 164.81;
    const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 55;
    const g3 = ctx.createGain(); g3.gain.value = 0.4;
    o1.connect(g); o2.connect(g); o3.connect(g3); g3.connect(g);
    o1.start(); o2.start(); o3.start();
    this.droneOsc = o1;
  }

  tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.15, freq = 1200, when = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  shoot() { this.tone(720 + Math.random() * 120, 0.09, 'square', 0.05, 0, 320); }
  frost() { this.tone(1180, 0.18, 'sine', 0.07, 0, 1900); }
  boom() { this.noise(0.28, 0.22, 700); this.tone(120, 0.25, 'sine', 0.18, 0, 45); }
  zap() { this.tone(1500, 0.1, 'sawtooth', 0.06, 0, 220); this.tone(2100, 0.07, 'square', 0.04, 0.03, 300); }
  thorn() { this.noise(0.08, 0.07, 2600); }
  coin() { this.tone(988, 0.07, 'sine', 0.09); this.tone(1319, 0.12, 'sine', 0.09, 0.06); }
  build() { this.tone(392, 0.1, 'triangle', 0.14); this.tone(523, 0.14, 'triangle', 0.14, 0.09); }
  upgrade() { this.tone(523, 0.09, 'triangle', 0.13); this.tone(659, 0.09, 'triangle', 0.13, 0.08); this.tone(784, 0.16, 'triangle', 0.13, 0.16); }
  leak() { this.tone(220, 0.3, 'sawtooth', 0.12, 0, 90); this.noise(0.2, 0.1, 500); }
  bossRoar() { this.tone(90, 0.7, 'sawtooth', 0.2, 0, 45); this.noise(0.6, 0.14, 300); }
  waveClear() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, i * 0.09)); }
  victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, i * 0.13)); }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.13, i * 0.16)); }
  click() { this.tone(660, 0.05, 'sine', 0.08); }

  // Generative ember-song: a slow pentatonic pluck over the drone.
  musicTick(now) {
    if (!this.ctx || !this.musicOn) return;
    if (now < this.nextNoteAt) return;
    this.nextNoteAt = now + 0.42 + Math.random() * 0.25;
    const base = 220;
    const deg = this.melody[this.step % this.melody.length];
    this.step++;
    const semis = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const s = semis[((deg % 11) + 11) % 11];
    const freq = base * Math.pow(2, s / 12);
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'triangle';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.075, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + 1.2);
    if (Math.random() < 0.3) {
      const o2 = this.ctx.createOscillator(); o2.type = 'sine';
      o2.frequency.value = freq * 2;
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(0.03, t0 + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
      o2.connect(g2); g2.connect(this.master);
      o2.start(t0); o2.stop(t0 + 0.9);
    }
  }
}
