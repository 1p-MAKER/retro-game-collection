import { SoundGenerator } from '../../audio/SoundGenerator';

const GRAVITY = 0.2;
const JUMP_FORCE = -6;
const MOVE_SPEED = 3;

interface Platform {
    x: number;
    y: number;
    w: number;
    active: boolean;
}

export class EndlessJumperLogic {
    public x: number = 160;
    public y: number = 400;
    public vy: number = 0;
    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'paused' = 'paused';

    public platforms: Platform[] = [];
    public cameraY: number = 0;

    private sound: SoundGenerator;

    constructor(sound: SoundGenerator) {
        this.sound = sound;
        this.reset();
    }

    reset() {
        this.x = 160;
        this.y = 400;
        this.vy = 0;
        this.score = 0;
        this.cameraY = 0;
        this.gameState = 'paused';

        // Initial Platforms
        this.platforms = [];
        for (let i = 0; i < 10; i++) {
            this.platforms.push({ x: Math.random() * 260, y: 450 - i * 60, w: 60, active: true });
        }
        // Base platform
        this.platforms[0] = { x: 0, y: 460, w: 320, active: true };
    }

    public moveLeft() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;
        this.x -= MOVE_SPEED;
        if (this.x < 0) this.x = 320; // Wrap
    }

    public moveRight() {
        if (this.gameState === 'paused') this.gameState = 'playing';
        if (this.gameState !== 'playing') return;
        this.x += MOVE_SPEED;
        if (this.x > 320) this.x = 0; // Wrap
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Physics
        this.vy += GRAVITY;
        this.y += this.vy;

        // Platform collision (only when falling)
        if (this.vy > 0) {
            for (const p of this.platforms) {
                if (
                    this.y + 10 > p.y && // Feet below top
                    this.y - 10 < p.y + 10 && // Feet above bottom
                    this.x > p.x &&
                    this.x < p.x + p.w
                ) {
                    this.vy = JUMP_FORCE;
                    this.sound.playTone(330, 'triangle', 0.1);
                    break;
                }
            }
        }

        // Camera Scroll
        const screenMid = 240;
        if (this.y < this.cameraY + screenMid) {
            this.cameraY = this.y - screenMid;
        }

        // Death
        if (this.y > this.cameraY + 500) {
            this.die();
        }

        // Score (based on height)
        const heightScore = Math.floor(-this.y / 10);
        if (heightScore > this.score) {
            this.score = heightScore;
        }

        // Spawn new platforms
        const highestPlat = this.platforms[this.platforms.length - 1];
        if (highestPlat.y > this.cameraY - 50) { // If top platform is visible
            // Add new one above
            this.platforms.push({
                x: Math.random() * 260,
                y: highestPlat.y - (40 + Math.random() * 40),
                w: 60,
                active: true
            });
        }

        // Cleanup old
        this.platforms = this.platforms.filter(p => p.y < this.cameraY + 600);
    }

    die() {
        this.sound.playTone(55, 'sawtooth', 0.5);
        this.gameState = 'gameover';
    }
}
