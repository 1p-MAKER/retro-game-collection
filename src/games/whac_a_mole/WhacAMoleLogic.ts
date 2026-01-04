import { SoundGenerator } from '../../audio/SoundGenerator';

export interface Mole {
    id: number;
    state: 'hidden' | 'rising' | 'up' | 'hit' | 'miss';
    timer: number;
    type: 'mole' | 'bomb'; // Bomb is "fake" / penalty
}

export class WhacAMoleLogic {
    public moles: Mole[] = [];
    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'cleared' | 'paused' = 'paused';
    public timeLeft: number = 30;

    private sound: SoundGenerator;
    private level: number = 1;
    private timerInterval: any = null;
    private spawnTimer: number = 0;

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.timeLeft = 30;
        this.gameState = 'playing';
        this.moles = Array(9).fill(null).map((_, i) => ({
            id: i,
            state: 'hidden',
            timer: 0,
            type: 'mole'
        }));

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Spawn logic
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnMole();
            this.spawnTimer = Math.max(200, 1000 - this.level * 50);
        }

        // Mole updates
        this.moles.forEach(m => {
            if (m.state === 'up') {
                m.timer -= deltaTime;
                if (m.timer <= 0) {
                    m.state = 'hidden'; // Missed opportunity
                }
            } else if (m.state === 'hit' || m.state === 'miss') {
                m.timer -= deltaTime;
                if (m.timer <= 0) m.state = 'hidden';
            }
        });
    }

    private spawnMole() {
        const available = this.moles.filter(m => m.state === 'hidden');
        if (available.length === 0) return;

        const mole = available[Math.floor(Math.random() * available.length)];
        mole.state = 'up';
        mole.timer = Math.max(500, 2000 - this.level * 100);
        // Bomb chance
        if (Math.random() < 0.2 + this.level * 0.05) {
            mole.type = 'bomb';
        } else {
            mole.type = 'mole';
        }
    }

    public hit(index: number) {
        if (this.gameState !== 'playing') return;
        const m = this.moles[index];

        if (m.state === 'up') {
            if (m.type === 'mole') {
                m.state = 'hit';
                m.timer = 500;
                this.score += 10;
                this.sound.playTone(880, 'square', 0.1);
            } else {
                m.state = 'miss'; // Hit a bomb
                m.timer = 500;
                this.score -= 20;
                this.sound.playNoise(0.5);
            }
        }
    }

    private endGame() {
        this.gameState = 'gameover'; // Or cleared if score target met
        if (this.score >= 100 * this.level) {
            this.gameState = 'cleared';
            this.sound.playDecide();
        } else {
            this.sound.playTone(55, 'sawtooth', 0.5);
        }
        clearInterval(this.timerInterval);
    }

    cleanup() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
}
