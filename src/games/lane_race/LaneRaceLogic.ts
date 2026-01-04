import { SoundGenerator } from '../../audio/SoundGenerator';


export class LaneRaceLogic {
    public lane: number = 1; // 0, 1, 2
    public score: number = 0;
    public speed: number = 5;
    public gameState: 'playing' | 'gameover' | 'paused' = 'paused';

    // Y position of obstacles in each lane. -1 means no obstacle.
    // Simplifying: Array of { lane: number, y: number, type: 'rock'|'oil' }
    public obstacles: { lane: number, y: number, type: 'rock' | 'oil', passed: boolean }[] = [];

    private sound: SoundGenerator;
    
    private level: number = 1;

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.lane = 1;
        this.score = 0;
        this.speed = 5 + (this.level * 0.5);
        this.obstacles = [];
        this.gameState = 'paused';
        this.spawnObstacle(-400);
    }

    spawnObstacle(yOffset: number = -100) {
        const lane = Math.floor(Math.random() * 3);
        const type = (this.level >= 5 && Math.random() < 0.3) ? 'oil' : 'rock';

        this.obstacles.push({
            lane,
            y: yOffset,
            type,
            passed: false
        });
    }

    public moveLeft() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;

        if (this.lane > 0) {
            this.lane--;
            this.sound.playTone(440, 'triangle', 0.05);
        }
    }

    public moveRight() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;

        if (this.lane < 2) {
            this.lane++;
            this.sound.playTone(440, 'triangle', 0.05);
        }
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Move obstacles down
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.y += this.speed;

            // Collision
            // Car Y is roughly 380-440
            if (
                ob.lane === this.lane &&
                ob.y + 40 > 380 && // Obstacle bottom > Car top
                ob.y < 440 // Obstacle top < Car bottom
            ) {
                if (ob.type === 'rock') {
                    this.die();
                } else {
                    // Oil - maybe just slip (uncontrollable) or speed loss?
                    // For simplicity, treat as crash for now or maybe spin
                    this.sound.playNoise(0.2);
                    this.die(); // Strict rule for now
                }
            }

            // Score
            if (!ob.passed && ob.y > 440) {
                this.score++;
                ob.passed = true;
                this.sound.playTone(880, 'square', 0.05);
            }

            // Cleanup
            if (ob.y > 600) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn logic
        const lastOb = this.obstacles[this.obstacles.length - 1];
        // Gap decreases with speed
        
        if (!lastOb || lastOb.y > 50) { // Keep some distance
            if (Math.random() < 0.02) { // Random spawn chance
                this.spawnObstacle(-50);
            }
        }
    }

    die() {
        this.sound.playTone(55, 'sawtooth', 0.5);
        this.gameState = 'gameover';
    }
}
