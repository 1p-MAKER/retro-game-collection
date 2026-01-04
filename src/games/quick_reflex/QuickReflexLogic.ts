import { SoundGenerator } from '../../audio/SoundGenerator';

export class QuickReflexLogic {
    public state: 'wait' | 'ready' | 'go' | 'result' | 'falsestart' = 'wait';
    public reactionTime: number = 0;

    private sound: SoundGenerator;
    private timer: number = 0;
    private startTime: number = 0;

    constructor(sound: SoundGenerator) {
        this.sound = sound;
        this.reset();
    }

    reset() {
        this.state = 'wait';
        this.reactionTime = 0;
        // Random wait 2-5 sec
        this.timer = 2000 + Math.random() * 3000;
        this.startTime = 0;
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;

        if (this.state === 'wait') {
            this.timer -= deltaTime;
            if (this.timer <= 0) {
                this.state = 'go';
                this.startTime = Date.now();
                this.sound.playTone(1200, 'square', 0.1);
            }
        }
    }

    public tap() {
        if (this.state === 'wait') {
            this.state = 'falsestart';
            this.sound.playNoise(0.5);
        } else if (this.state === 'go') {
            this.reactionTime = Date.now() - this.startTime;
            this.state = 'result';
            this.sound.playDecide();
        }
    }
}
