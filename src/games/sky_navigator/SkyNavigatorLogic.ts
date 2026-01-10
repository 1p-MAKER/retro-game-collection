import { SoundGenerator } from '../../audio/SoundGenerator';

const GRAVITY = 0.1;
const THRUST = -2.5;
const SCROLL_SPEED = 2;
const TERRAIN_STEP = 10; // Width of each terrain slice
const MIN_GAP = 140;

export class SkyNavigatorLogic {
    public y: number = 240;
    public velocity: number = 0;
    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'paused' = 'paused';

    // Terrain slices: { x, topH, bottomY }
    // continuous cave ceiling (topH) and floor (bottomY)
    public terrain: { x: number, topH: number, bottomY: number, passed: boolean }[] = [];

    private sound: SoundGenerator;
    private distanceTraveled: number = 0;
    constructor(sound: SoundGenerator) {
        this.sound = sound;
        this.reset();
    }

    // Noise generation state
    private ceilingY: number = 50;
    private floorY: number = 430;
    private targetCeiling: number = 50;
    private targetFloor: number = 430;

    reset() {
        this.y = 240;
        this.velocity = 0;
        this.score = 0;
        this.distanceTraveled = 0;
        this.terrain = [];
        this.gameState = 'paused';

        // Initial flat tunnel
        this.ceilingY = 50;
        this.floorY = 430;
        for (let x = 0; x < 400; x += TERRAIN_STEP) {
            this.terrain.push({
                x,
                topH: 50,
                bottomY: 430,
                passed: false
            });
        }
    }

    generateTerrainSlice(xOffset: number) {
        // Slowly drift ceiling and floor
        if (Math.abs(this.targetCeiling - this.ceilingY) < 5) {
            this.targetCeiling = 20 + Math.random() * 150;
        }
        if (Math.abs(this.targetFloor - this.floorY) < 5) {
            this.targetFloor = 300 + Math.random() * 160;
        }

        // Smooth approach
        this.ceilingY += (this.targetCeiling - this.ceilingY) * 0.05;
        this.floorY += (this.targetFloor - this.floorY) * 0.05;

        // Ensure gap
        if (this.floorY - this.ceilingY < MIN_GAP) {
            this.floorY = this.ceilingY + MIN_GAP;
        }

        this.terrain.push({
            x: xOffset,
            topH: this.ceilingY,
            bottomY: this.floorY,
            passed: false
        });
    }

    public thrust() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;

        this.velocity = THRUST;
        this.sound.playTone(150, 'sawtooth', 0.05);
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Physics
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Scroll
        this.distanceTraveled += SCROLL_SPEED;

        // Move terrain
        for (let i = this.terrain.length - 1; i >= 0; i--) {
            const t = this.terrain[i];
            t.x -= SCROLL_SPEED;

            // Collision check (Player is approx 20x10)
            const px = 50;
            const py = this.y;

            // Check only near slices
            if (t.x >= px - 10 && t.x <= px + 10) {
                if (py - 5 < t.topH || py + 5 > t.bottomY) {
                    this.die();
                }
            }

            // Score check
            if (!t.passed && t.x < px) {
                // Score accumulates faster with terrain, so maybe every 100px?
                // Let's just track distance score for now
                t.passed = true;
                if (this.distanceTraveled % 100 < SCROLL_SPEED) {
                    this.score++;
                }
            }

            // Cleanup
            if (t.x < -TERRAIN_STEP) {
                this.terrain.splice(i, 1);
            }
        }

        // Spawn new
        const lastT = this.terrain[this.terrain.length - 1];
        if (lastT && (lastT.x < 320 + TERRAIN_STEP)) {
            this.generateTerrainSlice(lastT.x + TERRAIN_STEP);
        }
    }

    die() {
        this.sound.playTone(55, 'sawtooth', 0.5);
        this.gameState = 'gameover';
    }
}
