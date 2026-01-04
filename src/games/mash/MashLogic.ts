import { SoundGenerator } from '../../audio/SoundGenerator';

export class MashLogic {
    public count: number = 0;
    public timeLeft: number = 10.0;
    public gameState: 'ready' | 'playing' | 'gameover' | 'paused' = 'ready';

    private sound: SoundGenerator;

    constructor(sound: SoundGenerator) {
        this.sound = sound;
        this.reset();
    }

    reset() {
        this.count = 0;
        this.timeLeft = 10.0;
        this.gameState = 'ready';
    }

    public start() {
        if (this.gameState === 'ready') {
            this.gameState = 'playing';
            this.sound.playTone(880, 'square', 0.1);
        }
    }

    public masher() {
        if (this.gameState !== 'playing') return;
        this.count++;
        // Pitch goes up with count
        this.sound.playTone(440 + (this.count % 20) * 20, 'square', 0.05);
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        this.timeLeft -= deltaTime / 1000;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.finish();
        }
    }

    finish() {
        this.gameState = 'gameover';
        this.sound.playDecide();
    }
}
