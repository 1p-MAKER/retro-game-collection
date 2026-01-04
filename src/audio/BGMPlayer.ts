export class BGMPlayer {
    private audio: HTMLAudioElement | null = null;
    private isPlaying: boolean = false;

    constructor() { }

    public play(src: string) {
        if (this.audio && this.audio.src.includes(src) && this.isPlaying) {
            return; // Already playing same track
        }

        this.stop();

        this.audio = new Audio(src);
        this.audio.loop = true;
        this.audio.volume = 0.4;

        this.audio.play().then(() => {
            this.isPlaying = true;
        }).catch(e => {
            console.warn("BGM autoplay blocked:", e);
        });
    }

    public stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
            this.audio = null;
        }
    }

    public pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    public resume() {
        if (this.audio && !this.isPlaying) {
            this.audio.play().catch(e => console.warn("BGM resume blocked", e));
            this.isPlaying = true;
        }
    }
}

export const bgmManager = new BGMPlayer();
