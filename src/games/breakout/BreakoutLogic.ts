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
export type ItemType = 'expand' | 'shrink' | 'slow' | 'fast' | 'multi' | 'laser' | 'catch' | 'life' | 'barrier' | 'penetrate';

const ITEM_TYPES: ItemType[] = ['expand', 'shrink', 'slow', 'fast', 'multi', 'laser', 'catch', 'life', 'barrier', 'penetrate'];
const ITEM_NAMES: Record<ItemType, string> = {
    expand: '拡大！',
    shrink: '縮小！',
    slow: 'スピードダウン',
    fast: 'スピードアップ',
    multi: 'マルチボール',
    laser: 'レーザー！',
    catch: 'キャッチ！',
    life: '残機アップ',
    barrier: 'バリア！',
    penetrate: '貫通弾！'
};

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

interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
    speed: number;
}

export interface Item {
    x: number;
    y: number;
    type: ItemType;
    active: boolean;
    name: string;
}

export class BreakoutLogic {
    public gameState: GameState = 'paused';
    public score: number = 0;
    public lives: number = 3;
    public level: number = 1;

    public paddle: { x: number; width: number; height: number };
    public balls: Ball[] = [];
    public blocks: Block[] = [];
    public items: Item[] = [];
    public lasers: { x: number; y: number }[] = [];

    // アイテム効果フラグ
    public barrierActive: boolean = false;
    public catchActive: boolean = false;
    public caughtBall: Ball | null = null;
    public penetrateActive: boolean = false;
    public laserActive: boolean = false;

    // 最後に取得したアイテム名（UI表示用）
    public lastItemName: string = '';
    public lastItemTime: number = 0;

    private sound: SoundGenerator;

    constructor(soundManager: SoundGenerator, initialLevel: number = 1) {
        this.sound = soundManager;
        this.level = initialLevel;

        this.paddle = {
            x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
        };

        this.balls = [{
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: 3,
            dy: -3,
            speed: 4 + (initialLevel * 0.2),
        }];

        this.initLevel(initialLevel);
    }

    private initLevel(level: number) {
        this.blocks = [];
        this.items = [];
        this.lasers = [];
        this.barrierActive = false;
        this.catchActive = false;
        this.caughtBall = null;
        this.penetrateActive = false;
        this.laserActive = false;

        const colors = ['#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF'];

        if (level === 10) {
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

        for (let r = 0; r < BLOCK_ROWS; r++) {
            for (let c = 0; c < BLOCK_COLS; c++) {
                const isHard = level >= 5 && Math.random() < 0.2;

                this.blocks.push({
                    x: c * BLOCK_WIDTH,
                    y: r * BLOCK_HEIGHT + 40,
                    width: BLOCK_WIDTH - 2,
                    height: BLOCK_HEIGHT - 2,
                    active: true,
                    color: isHard ? '#5F574F' : colors[r % colors.length],
                    type: isHard ? 'hard' : 'normal',
                    hp: isHard ? 2 : 1
                });
            }
        }
    }

    private spawnItem(x: number, y: number) {
        if (Math.random() > 0.2) return; // 20%の確率
        const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        this.items.push({
            x,
            y,
            type,
            active: true,
            name: ITEM_NAMES[type]
        });
    }

    private applyItem(item: Item) {
        this.lastItemName = item.name;
        this.lastItemTime = Date.now();
        this.sound.playPowerUp();

        switch (item.type) {
            case 'expand':
                this.paddle.width = Math.min(120, this.paddle.width + 20);
                break;
            case 'shrink':
                this.paddle.width = Math.max(30, this.paddle.width - 20);
                break;
            case 'slow':
                this.balls.forEach(b => { b.dx *= 0.7; b.dy *= 0.7; });
                break;
            case 'fast':
                this.balls.forEach(b => { b.dx *= 1.3; b.dy *= 1.3; });
                break;
            case 'multi':
                const newBalls: Ball[] = [];
                this.balls.forEach(b => {
                    newBalls.push({ ...b, dx: b.dx + 1 });
                    newBalls.push({ ...b, dx: b.dx - 1 });
                });
                this.balls.push(...newBalls);
                break;
            case 'laser':
                this.laserActive = true;
                break;
            case 'catch':
                this.catchActive = true;
                break;
            case 'life':
                this.lives++;
                break;
            case 'barrier':
                this.barrierActive = true;
                break;
            case 'penetrate':
                this.penetrateActive = true;
                break;
        }
    }

    public resetBall() {
        this.balls = [{
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: 3 * (Math.random() > 0.5 ? 1 : -1),
            dy: -3,
            speed: 4 + (this.level * 0.2),
        }];
        this.catchActive = false;
        this.caughtBall = null;
        this.penetrateActive = false;
        this.laserActive = false;
        this.gameState = 'paused';
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Update items
        for (const item of this.items) {
            if (!item.active) continue;
            item.y += 2; // 落下速度

            // パドルとの衝突
            if (
                item.y >= CANVAS_HEIGHT - 30 &&
                item.x >= this.paddle.x &&
                item.x <= this.paddle.x + this.paddle.width
            ) {
                item.active = false;
                this.applyItem(item);
            }

            // 画面外
            if (item.y > CANVAS_HEIGHT) {
                item.active = false;
            }
        }

        // Update lasers
        for (const laser of this.lasers) {
            laser.y -= 8;
            // ブロック衝突
            for (const block of this.blocks) {
                if (!block.active) continue;
                if (
                    laser.x >= block.x &&
                    laser.x <= block.x + block.width &&
                    laser.y <= block.y + block.height &&
                    laser.y >= block.y
                ) {
                    block.hp--;
                    if (block.hp <= 0) {
                        block.active = false;
                        this.score += 10;
                        this.spawnItem(block.x + block.width / 2, block.y);
                    }
                    laser.y = -100; // 消去
                    this.sound.playTone(880, 'square', 0.05);
                }
            }
        }
        this.lasers = this.lasers.filter(l => l.y > 0);

        // Update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // キャッチ中のボールはスキップ
            if (this.caughtBall === ball) continue;

            ball.x += ball.dx;
            ball.y += ball.dy;

            // 壁衝突
            if (ball.x - BALL_RADIUS < 0) {
                ball.x = BALL_RADIUS;
                ball.dx = -ball.dx;
                this.sound.playTone(440, 'triangle', 0.05);
            } else if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
                ball.x = CANVAS_WIDTH - BALL_RADIUS;
                ball.dx = -ball.dx;
                this.sound.playTone(440, 'triangle', 0.05);
            }

            if (ball.y - BALL_RADIUS < 0) {
                ball.y = BALL_RADIUS;
                ball.dy = -ball.dy;
                this.sound.playTone(440, 'triangle', 0.05);
            } else if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
                // バリア判定
                if (this.barrierActive) {
                    ball.dy = -Math.abs(ball.dy);
                    this.barrierActive = false;
                    this.sound.playTone(220, 'square', 0.1);
                } else {
                    // ボール消失
                    this.balls.splice(i, 1);
                    if (this.balls.length === 0) {
                        this.lives--;
                        this.sound.playTone(110, 'sawtooth', 0.3);
                        if (this.lives <= 0) {
                            this.gameState = 'gameover';
                        } else {
                            this.resetBall();
                        }
                    }
                    continue;
                }
            }

            // パドル衝突
            if (
                ball.y + BALL_RADIUS >= CANVAS_HEIGHT - 30 &&
                ball.y - BALL_RADIUS <= CANVAS_HEIGHT - 30 + PADDLE_HEIGHT &&
                ball.x >= this.paddle.x &&
                ball.x <= this.paddle.x + this.paddle.width
            ) {
                if (this.catchActive && !this.caughtBall) {
                    this.caughtBall = ball;
                    ball.dy = 0;
                    ball.dx = 0;
                } else {
                    ball.dy = -Math.abs(ball.dy);
                    const hitPoint = ball.x - (this.paddle.x + this.paddle.width / 2);
                    ball.dx = hitPoint * 0.15;
                }
                this.sound.playTone(660, 'square', 0.05);
            }

            // ブロック衝突
            for (const block of this.blocks) {
                if (!block.active) continue;

                if (
                    ball.x + BALL_RADIUS > block.x &&
                    ball.x - BALL_RADIUS < block.x + block.width &&
                    ball.y + BALL_RADIUS > block.y &&
                    ball.y - BALL_RADIUS < block.y + block.height
                ) {
                    if (!this.penetrateActive) {
                        ball.dy = -ball.dy;
                    }

                    block.hp--;
                    if (block.hp <= 0) {
                        block.active = false;
                        this.score += (block.type === 'boss' ? 1000 : block.type === 'hard' ? 50 : 10);
                        this.sound.playTone(880 + (Math.random() * 200), 'square', 0.1);
                        this.spawnItem(block.x + block.width / 2, block.y);
                    } else {
                        this.sound.playTone(220, 'square', 0.05);
                    }
                    if (!this.penetrateActive) break;
                }
            }
        }

        // クリア判定
        const activeBlockCount = this.blocks.filter(b => b.active).length;
        if (activeBlockCount === 0) {
            this.gameState = 'cleared';
            this.sound.playClear();
        }
    }

    public setPaddleX(x: number) {
        if (this.gameState === 'paused' || this.gameState === 'playing') {
            this.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - this.paddle.width, x - this.paddle.width / 2));
            if (this.gameState === 'paused' && this.balls.length > 0) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
            }
            if (this.caughtBall) {
                this.caughtBall.x = this.paddle.x + this.paddle.width / 2;
                this.caughtBall.y = CANVAS_HEIGHT - 35;
            }
        }
    }

    public launch() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.sound.playStart();
        }
        if (this.caughtBall) {
            this.caughtBall.dy = -3;
            this.caughtBall.dx = 2 * (Math.random() > 0.5 ? 1 : -1);
            this.caughtBall = null;
            this.catchActive = false;
        }
    }

    public fireLaser() {
        if (this.laserActive && this.gameState === 'playing') {
            this.lasers.push({ x: this.paddle.x + 5, y: CANVAS_HEIGHT - 35 });
            this.lasers.push({ x: this.paddle.x + this.paddle.width - 5, y: CANVAS_HEIGHT - 35 });
            this.sound.playTone(1200, 'sawtooth', 0.05);
        }
    }
}
