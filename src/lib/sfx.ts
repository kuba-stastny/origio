// Malý singleton pro WebAudio klik sfx
type PlayOpts = { volume?: number };

class Sfx {
  public ctx: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private lastPlay = 0;
  private minGapMs = 80; // globální throttle

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = localStorage.getItem("sfx:muted") === "1";
      const unlock = () => void this.unlock();
      ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
        window.addEventListener(ev, unlock, { passive: true })
      );
    }
  }

  async unlock() {
    if (this.unlocked && this.ctx?.state === "running") return true;
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      if (!this.ctx) this.ctx = new Ctx();
      await this.ctx.resume?.();
      this.unlocked = this.ctx.state === "running";
    } catch {
      this.unlocked = false;
    }
    return this.unlocked;
  }

  isUnlocked() {
    return !!this.unlocked && !!this.ctx && this.ctx.state === "running";
  }

  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem("sfx:muted", m ? "1" : "0"); } catch {}
  }
  isMuted() { return this.muted; }

  /** Nízký „tlumený klik“ – krátký thump + noise přes low-pass */
  playClick(opts: PlayOpts = {}) {
    this.#throttleGuard(); if (!this.#ready()) return;
    const ctx = this.ctx!;
    const vol = Math.min(Math.max(opts.volume ?? 0.28, 0), 1);

    const master = ctx.createGain(); master.gain.value = vol; master.connect(ctx.destination);

    // nízký tón
    const osc = ctx.createOscillator(); osc.type = "sine";
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.setValueAtTime(700, ctx.currentTime);
    lpf.Q.value = 0.3;

    osc.connect(env); env.connect(lpf); lpf.connect(master);

    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

    // krátký noise „finger tap“
    const n = this.#noise(800);
    const nLPF = ctx.createBiquadFilter(); nLPF.type = "lowpass"; nLPF.frequency.value = 900;
    const nGain = ctx.createGain(); nGain.gain.setValueAtTime(0.0, ctx.currentTime);
    nGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.004);
    nGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    n.connect(nLPF); nLPF.connect(nGain); nGain.connect(master);

    osc.start(); n.start();
    const stopAt = ctx.currentTime + 0.09;
    osc.stop(stopAt); n.stop(stopAt);

    setTimeout(() => {
      try {
        osc.disconnect(); env.disconnect(); lpf.disconnect();
        n.disconnect(); nGain.disconnect(); nLPF.disconnect(); master.disconnect();
      } catch {}
    }, 160);
  }

  // --- helpers ---
  #noise(len: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource(); src.buffer = buf; return src;
  }
  #ready() { return !this.muted && this.isUnlocked() && !!this.ctx; }
  #throttleGuard() {
    const now = performance.now();
    if (now - this.lastPlay < this.minGapMs) throw new Error("throttled");
    this.lastPlay = now;
  }
}

export const sfx = new Sfx();
