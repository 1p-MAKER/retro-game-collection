import { SoundGenerator } from '../../audio/SoundGenerator';


export interface Item {
    x: number;
    y: number;
    vy: number;
    type: 'apple' | 'gem' | 'bomb';
    active: boolean;
}

export class CatchDropLogic {
    public x: number = 160;
    public items: Item[] = [];
    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'paused' = 'paused';

    private sound: SoundGenerator;
    private level: number = 1;
    private spawnTimer: number = 0;

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.gameState = 'playing'; // Auto start
        this.items = [];
        this.x = 160;
    }

    public setX(x: number) {
        if (this.gameState === 'paused') this.gameState = 'playing';
        this.x = Math.max(30, Math.min(290, x));
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Spawn
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnItem();
            this.spawnTimer = Math.max(400, 1500 - this.level * 100);
        }

        // Move Items
        this.items.forEach(item => {
            if (!item.active) return;
            item.y += item.vy;
            // item.vy += GRAVITY; // Optional acceleration

            // Catch check
            const bucketY = 400;
            if (item.y > bucketY - 20 && item.y < bucketY + 20) {
                if (Math.abs(item.x - this.x) < 40) {
                    this.catchItem(item);
                }
            }

            // Miss check
            if (item.y > 500) {
                item.active = false;
                if (item.type !== 'bomb') {
                    // Missed good item? Maybe lose point or life? Not critical for simple ver
                }
            }
        });

        this.items = this.items.filter(i => i.active);
    }

    private spawnItem() {
        const typeRand = Math.random();
        let type: 'apple' | 'gem' | 'bomb' = 'apple';
        if (typeRand > 0.9) type = 'gem';
        else if (typeRand > 0.7) type = 'bomb';

        this.items.push({
            x: 20 + Math.random() * 280,
            y: -20,
            vy: 2 + Math.random() * 2 + (this.level * 0.2),
            type,
            active: true
        });
    }

    private catchItem(item: Item) {
        item.active = false;
        if (item.type === 'bomb') {
            this.sound.playNoise(0.5);
            this.gameState = 'gameover';
        } else {
            const points = item.type === 'gem' ? 50 : 10;
            this.score += points;
            this.sound.playTone(item.type === 'gem' ? 1200 : 880, 'square', 0.1);

            // Level up based on score
            if (this.score > this.level * 200) {
                this.level++;
                this.sound.playDecide();
            }
        }
    }
}
