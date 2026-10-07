/**
 * Procedural Tactical Sound Synthesizer & Loudspeaker Announcer
 * Built with Web Audio API for zero-latency, realistic dystopian soundscapes
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.45;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.45;
    }
  }

  // --- Tactical Gunfire ---
  public playGunfire(weaponType: string = 'assault') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Noise burst for mechanical combustion
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = weaponType === 'shotgun' ? 700 : weaponType === 'marksman' ? 2200 : 1400;
    filter.Q.value = 2.0;

    const noiseGain = this.ctx.createGain();
    const duration = weaponType === 'shotgun' ? 0.2 : weaponType === 'marksman' ? 0.35 : 0.12;
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);

    // Punchy low-end sub body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(weaponType === 'marksman' ? 190 : 130, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + duration * 0.8);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.8);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration * 0.8);
  }

  // --- ODM Wire Grapple Hook Fire & Zip ---
  public playOdmLaunch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playOdmZip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // High-speed air whoosh
    const bufferSize = this.ctx.sampleRate * 0.4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  // --- Titan Goliath Roar & Stomp ---
  public playTitanStomp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Massive seismic impact sub-bass
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.7);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);

    // Mechanical servo crunch
    const servoOsc = this.ctx.createOscillator();
    const servoGain = this.ctx.createGain();
    servoOsc.type = 'sawtooth';
    servoOsc.frequency.setValueAtTime(120, t);
    servoOsc.frequency.linearRampToValueAtTime(60, t + 0.25);
    servoGain.gain.setValueAtTime(0.3, t);
    servoGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    servoOsc.connect(servoGain);
    servoGain.connect(this.masterGain);
    servoOsc.start(t);
    servoOsc.stop(t + 0.25);
  }

  // --- Energy Core Containment Alarm Siren ---
  public startEmergencySiren() {
    if (this.isSirenActive || this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isSirenActive = true;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sawtooth';
    const t = this.ctx.currentTime;

    // Sweeping dystopian warning tone (440Hz -> 880Hz -> 440Hz)
    this.sirenGain.gain.setValueAtTime(0.18, t);
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'triangle';
    lfo.frequency.value = 0.8; // 0.8 Hz sweep
    lfoGain.gain.value = 250;

    lfo.connect(this.sirenOsc.frequency);
    this.sirenOsc.frequency.setValueAtTime(550, t);

    lfo.start(t);
    this.sirenOsc.start(t);
  }

  public stopEmergencySiren() {
    if (!this.isSirenActive) return;
    try {
      this.sirenOsc?.stop();
      this.sirenOsc?.disconnect();
      this.sirenGain?.disconnect();
    } catch {
      // ignore
    }
    this.sirenOsc = null;
    this.sirenGain = null;
    this.isSirenActive = false;
  }

  // --- Neural Recall Link Restored ---
  public playRecallSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  // --- Loudspeaker Voice Broadcast (Text-to-Speech / Military Radio) ---
  public announceLoudspeaker(phrase: string) {
    if (this.isMuted) return;
    // Play quick radio squelch tone first
    this.playRadioChirp();

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.05;
        utterance.pitch = 0.85; // Serious, deep militarized pitch
        utterance.volume = 0.9;
        
        // Select an English voice if available
        const voices = window.speechSynthesis.getVoices();
        const militaryVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Male')));
        if (militaryVoice) {
          utterance.voice = militaryVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // speech synthesis optional fallback
      }
    }
  }

  public playRadioChirp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.setValueAtTime(2200, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- Shield Break / Hit Marker ---
  public playHitmarker(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = isHeadshot ? 2800 : 1760;

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const soundEngine = new SoundEngine();
