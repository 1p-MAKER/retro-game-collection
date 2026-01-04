import { SoundGenerator } from '../../audio/SoundGenerator';

const GRAVITY = 0.15;
const THRUST = -0.3;
const SCROLL_SPEED = 2; // Pixels per frame
const OBSTACLE_GAP = 120;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_INTERVAL = 200; // Pixels distance between obstacles

export class SkyNavigatorLogic {
    public y: number = 240;
    public velocity: number = 0;
    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'paused' = 'paused';

    // Arrays of {x, topHeight, bottomHeight}
    // topHeight is height of top obstacle, bottomHeight is y start of bottom obstacle
    public obstacles: { x: number, topH: number, bottomY: number, passed: boolean }[] = [];

    private sound: SoundGenerator;
    private distanceTraveled: number = 0;
    private level: number = 1;

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.y = 240;
        this.velocity = 0;
        this.score = 0;
        this.distanceTraveled = 0;
        this.obstacles = [];
        this.gameState = 'paused';
        this.spawnObstacle(400); // Initial obstacle ahead
    }

    spawnObstacle(xOffset: number) {
        // Gap gets smaller as level increases (min 80)
        const gap = Math.max(80, OBSTACLE_GAP - (this.level * 2));
        const minH = 50;
        const availableHeight = 480 - gap - (minH * 2);
        const topH = minH + Math.random() * availableHeight;

        this.obstacles.push({
            x: xOffset,
            topH: topH,
            bottomY: topH + gap,
            passed: false
        });
    }

    public thrust() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;

        this.velocity = Math.min(this.velocity + THRUST, -4); // Cap upward speed
        this.sound.playTone(100 + Math.random() * 50, 'sawtooth', 0.05); // Engine noise
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Physics
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Floor/Ceiling collision
        if (this.y < 0 || this.y > 480) {
            this.die();
            return;
        }

        // Scroll & Obstacles
        this.distanceTraveled += SCROLL_SPEED;

        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.x -= SCROLL_SPEED;

            // Collision check
            // Plane is approx circles at (50, y) radius 10
            const px = 50;
            const pr = 10;

            // AABB check
            if (
                px + pr > ob.x && px - pr < ob.x + OBSTACLE_WIDTH &&
                (this.y - pr < ob.topH || this.y + pr > ob.bottomY)
            ) {
                this.die();
            }

            // Score check
            if (!ob.passed && ob.x + OBSTACLE_WIDTH < px) {
                this.score++;
                ob.passed = true;
                this.sound.playTone(880, 'square', 0.1);
            }

            // Cleanup
            if (ob.x < -OBSTACLE_WIDTH) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn new
        const lastOb = this.obstacles[this.obstacles.length - 1];
        if (lastOb && (320 - lastOb.x) > OBSTACLE_INTERVAL) { // basic spawning logic
            this.spawnObstacle(320 + 50);
        } else if (this.obstacles.length === 0) {
            this.spawnObstacle(320 + 50);
        }
    }

    die() {
        this.sound.playTone(55, 'sawtooth', 0.5);
        this.gameState = 'gameover';
    }
}
