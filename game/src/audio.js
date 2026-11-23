// Duel Kartu Pasar — synthesized sound. Every sound is built from plain
// oscillators and noise, so the game ships no audio files at all.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, seconds, type = 'sine', volume = 0.1, slideTo = null, delay = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const at = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, at + seconds);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + seconds);
  }

  function noise(seconds, volume = 0.08, lowpass = 2000) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(700, 0.06, 'triangle', 0.07);
    },
    play() {
      noise(0.14, 0.07, 3200);
      tone(520, 0.1, 'triangle', 0.07, 780);
    },
    hit() {
      tone(180, 0.22, 'sawtooth', 0.11, 70);
      noise(0.18, 0.09, 700);
    },
    heal() {
      tone(523, 0.12, 'sine', 0.09);
      tone(659, 0.12, 'sine', 0.09, null, 0.09);
      tone(784, 0.16, 'sine', 0.09, null, 0.18);
    },
    draw() {
      tone(880, 0.07, 'triangle', 0.07);
      tone(1170, 0.09, 'triangle', 0.06, null, 0.06);
    },
    coin() {
      tone(1180, 0.07, 'triangle', 0.08);
      tone(1560, 0.1, 'triangle', 0.07, null, 0.06);
    },
    combo() {
      [880, 1108, 1318].forEach((f, i) => tone(f, 0.1, 'triangle', 0.08, null, i * 0.06));
    },
    denied() {
      tone(160, 0.12, 'square', 0.06, 110);
    },
    turn() {
      tone(440, 0.09, 'sine', 0.07);
      tone(554, 0.11, 'sine', 0.07, null, 0.08);
    },
    win() {
      [523, 659, 784, 1047, 1318].forEach((f, i) => tone(f, 0.24, 'triangle', 0.1, null, i * 0.12));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'triangle', 0.09, null, i * 0.15));
    },
  };
}
