/**
 * sound.js
 * Subtle Web Audio API micro-sound generator for tactile calculator feedback.
 */

export class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('quantum_calc_sound') === 'true';
    this.audioCtx = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('quantum_calc_sound', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.playTone(800, 0.04, 'sine', 0.1);
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', volume = 0.05) {
    if (!this.enabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay or web audio policy restrictions
    }
  }

  playClick() {
    // Soft high-frequency subtle pop
    this.playTone(600, 0.02, 'sine', 0.03);
  }

  playOperator() {
    // Slightly higher subtle pop
    this.playTone(750, 0.03, 'sine', 0.04);
  }

  playFunction() {
    // Subtle dual-tone or chime
    this.playTone(900, 0.035, 'triangle', 0.04);
  }

  playEquals() {
    // Pleasant success chime
    if (!this.enabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.04, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playClear() {
    // Downward gentle pop
    this.playTone(350, 0.05, 'triangle', 0.04);
  }

  playError() {
    // Low alert double tone
    this.playTone(220, 0.08, 'sawtooth', 0.03);
  }
}
