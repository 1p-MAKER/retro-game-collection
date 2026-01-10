export class SoundGenerator {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        // AudioContext is initialized on first user interaction to comply with browser policies
    }

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3; // Default volume
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playTone(frequency: number, type: OscillatorType, duration: number) {
        this.init();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.connect(this.masterGain);
        osc.connect(gain);

        // Envelope
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public playNoise(duration: number) {
        this.init();
        if (!this.ctx || !this.masterGain) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.connect(this.masterGain);
        noise.connect(gain);

        // Envelope for percussive effect
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.start();
    }

    // Preset Sounds
    public playSelect() {
        this.playTone(880, 'square', 0.1);
    }

    public playDecide() {
        this.playTone(1760, 'square', 0.1);
    }

    public playCancel() {
        this.playTone(220, 'triangle', 0.2);
    }

    public playHit() {
        this.playNoise(0.1);
    }

    public playTick() {
        this.playTone(440, 'sine', 0.05);
    }

    public playStart() {
        // ファンファーレ風のアルペジオ
        this.playTone(523, 'square', 0.1); // C5
        setTimeout(() => this.playTone(659, 'square', 0.1), 100); // E5
        setTimeout(() => this.playTone(784, 'square', 0.15), 200); // G5
        setTimeout(() => this.playTone(1047, 'square', 0.2), 300); // C6
    }

    public playClear() {
        // 勝利音
        this.playTone(784, 'square', 0.1);
        setTimeout(() => this.playTone(988, 'square', 0.1), 100);
        setTimeout(() => this.playTone(1175, 'square', 0.15), 200);
        setTimeout(() => this.playTone(1568, 'square', 0.25), 300);
    }

    public playPowerUp() {
        // 上昇音
        this.playTone(440, 'sawtooth', 0.08);
        setTimeout(() => this.playTone(554, 'sawtooth', 0.08), 50);
        setTimeout(() => this.playTone(659, 'sawtooth', 0.08), 100);
        setTimeout(() => this.playTone(880, 'sawtooth', 0.12), 150);
    }

    public playGunshot() {
        // 射撃音（ノイズ + 低音）
        this.playNoise(0.15);
        this.playTone(80, 'sawtooth', 0.1);
    }
}

export const soundManager = new SoundGenerator();
