import { SoundGenerator } from '../../audio/SoundGenerator';

// Constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 4;
const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;
const BLOCK_WIDTH = CANVAS_WIDTH / BLOCK_COLS;
const BLOCK_HEIGHT = 15;

export type GameState = 'playing' | 'gameover' | 'cleared' | 'paused';


interface Block {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    color: string;
    type: 'normal' | 'hard' | 'boss';
    hp: number;
}

export class BreakoutLogic {
    public gameState: GameState = 'paused'; // Start paused/ready
    public score: number = 0;
    public lives: number = 3;
    public level: number = 1;

    public paddle: { x: number; width: number; height: number };
    public ball: { x: number; y: number; dx: number; dy: number; speed: number };
    public blocks: Block[] = [];

    private sound: SoundGenerator;

    constructor(soundManager: SoundGenerator, initialLevel: number = 1) {
        this.sound = soundManager;
        this.level = initialLevel;

        this.paddle = {
            x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
        };

        this.ball = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: 3, // Initial direction
            dy: -3,
            speed: 4 + (initialLevel * 0.2), // Speed increases slightly per level
        };

        this.initLevel(initialLevel);
    }

    private initLevel(level: number) {
        this.blocks = [];
        const colors = ['#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF'];

        // Boss Level Logic (Level 10)
        if (level === 10) {
            // Simple Boss Block
            this.blocks.push({
                x: CANVAS_WIDTH / 2 - 40,
                y: 50,
                width: 80,
                height: 40,
                active: true,
                color: '#FF77A8',
                type: 'boss',
                hp: 20
            });
            return;
        }

        // Normal Levels
        for (let r = 0; r < BLOCK_ROWS; r++) {
            for (let c = 0; c < BLOCK_COLS; c++) {
                // Level 5+ has scaling difficulty (hard blocks)
                const isHard = level >= 5 && Math.random() < 0.2;

                this.blocks.push({
                    x: c * BLOCK_WIDTH,
                    y: r * BLOCK_HEIGHT + 40, // Offset from top
                    width: BLOCK_WIDTH - 2, // Gap
                    height: BLOCK_HEIGHT - 2,
                    active: true,
                    color: isHard ? '#5F574F' : colors[r % colors.length],
                    type: isHard ? 'hard' : 'normal',
                    hp: isHard ? 2 : 1
                });
            }
        }
    }

    public resetBall() {
        this.ball.x = CANVAS_WIDTH / 2;
        this.ball.y = CANVAS_HEIGHT - 50;
        this.ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -3;
        this.gameState = 'paused';
    }

    public update(deltaTime: number) {
        // Use deltaTime to suppress lint error, even if not physically needed for fixed step yet
        if (deltaTime < 0) return;

        if (this.gameState !== 'playing') return;

        // Move Paddle (Input handling is external, usually just setting paddle.x)

        // Move Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall Collisions
        if (this.ball.x - BALL_RADIUS < 0) {
            this.ball.x = BALL_RADIUS;
            this.ball.dx = -this.ball.dx;
            this.sound.playTone(440, 'triangle', 0.05);
        } else if (this.ball.x + BALL_RADIUS > CANVAS_WIDTH) {
            this.ball.x = CANVAS_WIDTH - BALL_RADIUS;
            this.ball.dx = -this.ball.dx;
            this.sound.playTone(440, 'triangle', 0.05);
        }

        if (this.ball.y - BALL_RADIUS < 0) {
            this.ball.y = BALL_RADIUS;
            this.ball.dy = -this.ball.dy;
            this.sound.playTone(440, 'triangle', 0.05);
        } else if (this.ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
            // Miss logic
            this.lives--;
            this.sound.playTone(110, 'sawtooth', 0.3); // Miss sound
            if (this.lives <= 0) {
                this.gameState = 'gameover';
            } else {
                this.resetBall();
            }
        }

        // Paddle Collision
        if (
            this.ball.y + BALL_RADIUS >= CANVAS_HEIGHT - 30 && // Approximate Y
            this.ball.y - BALL_RADIUS <= CANVAS_HEIGHT - 30 + PADDLE_HEIGHT &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + PADDLE_WIDTH
        ) {
            this.ball.dy = -Math.abs(this.ball.dy); // Bounce up

            // Add some angle depending on where it hit the paddle
            const hitPoint = this.ball.x - (this.paddle.x + PADDLE_WIDTH / 2);
            this.ball.dx = hitPoint * 0.15;

            this.sound.playTone(660, 'square', 0.05);
        }

        // Block Collision
        let activeBlockCount = 0;
        for (const block of this.blocks) {
            if (!block.active) continue;
            activeBlockCount++;

            if (
                this.ball.x + BALL_RADIUS > block.x &&
                this.ball.x - BALL_RADIUS < block.x + block.width &&
                this.ball.y + BALL_RADIUS > block.y &&
                this.ball.y - BALL_RADIUS < block.y + block.height
            ) {
                // Simple bounce (flip Y) - sophisticated physics would check overlap amount
                this.ball.dy = -this.ball.dy;

                block.hp--;
                if (block.hp <= 0) {
                    block.active = false;
                    this.score += (block.type === 'boss' ? 1000 : block.type === 'hard' ? 50 : 10);
                    this.sound.playTone(880 + (Math.random() * 200), 'square', 0.1); // Break sound
                } else {
                    this.sound.playTone(220, 'square', 0.05); // Hit hard block sound
                }
                break; // Handle one block collision per frame prevents glitching
            }
        }

        // Level Clear
        if (activeBlockCount === 0) {
            this.gameState = 'cleared';
            this.sound.playDecide(); // Use decide sound for clear temporarily
        }
    }

    public setPaddleX(x: number) {
        if (this.gameState === 'paused' || this.gameState === 'playing') {
            this.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
            // If ball is stuck to paddle (start of round)
            if (this.gameState === 'paused') {
                this.ball.x = this.paddle.x + PADDLE_WIDTH / 2;
            }
        }
    }

    public launch() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
}
