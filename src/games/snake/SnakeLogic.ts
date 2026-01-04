import { SoundGenerator } from '../../audio/SoundGenerator';

const COLS = 16;
const ROWS = 24;
// Canvas virtual size: 320x480

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameState = 'playing' | 'gameover' | 'cleared' | 'paused';

interface Point {
    x: number;
    y: number;
}

export class SnakeLogic {
    public gameState: GameState = 'paused';
    public score: number = 0;
    public snake: Point[] = [];
    public food: Point = { x: 0, y: 0 };
    public direction: Direction = 'RIGHT';
    public nextDirection: Direction = 'RIGHT';
    public level: number = 1;
    public speed: number = 150; // ms per tick

    private lastTick: number = 0;
    private sound: SoundGenerator;
    private walls: Point[] = [];

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    public reset() {
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.gameState = 'paused';

        // Difficulty settings
        this.speed = Math.max(50, 200 - (this.level * 10));
        // Stage 8+: Turbo speed
        if (this.level >= 8) this.speed -= 30;

        this.setupWalls();
        this.spawnFood();
    }

    private setupWalls() {
        this.walls = [];
        if (this.level >= 4) {
            // Add random walls
            const wallCount = (this.level - 3) * 3;
            for (let i = 0; i < wallCount; i++) {
                this.walls.push({
                    x: Math.floor(Math.random() * COLS),
                    y: Math.floor(Math.random() * ROWS)
                });
            }
        }
    }

    private spawnFood() {
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS)
            };
            // Check collision with snake
            const onSnake = this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
            // Check collision with walls
            const onWall = this.walls.some(w => w.x === this.food.x && w.y === this.food.y);

            if (!onSnake && !onWall) valid = true;
        }
    }

    public setDirection(dir: Direction) {
        // Prevent 180 degree turns
        if (this.direction === 'UP' && dir === 'DOWN') return;
        if (this.direction === 'DOWN' && dir === 'UP') return;
        if (this.direction === 'LEFT' && dir === 'RIGHT') return;
        if (this.direction === 'RIGHT' && dir === 'LEFT') return;

        this.nextDirection = dir;
        if (this.gameState === 'paused') this.gameState = 'playing';
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return; // Lint fix
        if (this.gameState !== 'playing') return;

        const now = Date.now();
        if (now - this.lastTick < this.speed) return;
        this.lastTick = now;

        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'UP': head.y--; break;
            case 'DOWN': head.y++; break;
            case 'LEFT': head.x--; break;
            case 'RIGHT': head.x++; break;
        }

        // Wall Collision (Screen Edges)
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            this.die();
            return;
        }

        // Self Collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.die();
            return;
        }

        // Obstacle Collision
        if (this.walls.some(w => w.x === head.x && w.y === head.y)) {
            this.die();
            return;
        }

        this.snake.unshift(head);

        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.sound.playTone(1200, 'square', 0.1);
            this.spawnFood();
            // Clear condition: score based on level? For now just endless score or fixed target
            if (this.score >= 100 * this.level) { // Example clear
                this.gameState = 'cleared';
                this.sound.playDecide();
            }
        } else {
            this.snake.pop();
        }
    }

    private die() {
        this.sound.playTone(100, 'sawtooth', 0.5);
        this.gameState = 'gameover';
    }
}
