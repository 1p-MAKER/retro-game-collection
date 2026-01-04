import { SoundGenerator } from '../../audio/SoundGenerator';

const SHIP_Y = 420;
const SHIP_WIDTH = 30;
const BULLET_SPEED = 8;
const CHARGE_TIME = 1000; // ms

interface Entity {
    x: number;
    y: number;
    w: number;
    h: number;
    active: boolean;
    hp: number;
    type: 'normal' | 'boss' | 'bullet' | 'enemy_bullet';
}

export class SpaceDefenderLogic {
    public x: number = 160;
    public bullets: Entity[] = []; // Player bullets
    public enemies: Entity[] = [];
    public enemyBullets: Entity[] = [];

    public score: number = 0;
    public gameState: 'playing' | 'gameover' | 'cleared' | 'paused' = 'paused';

    public chargeStart: number = 0;
    public isCharging: boolean = false;

    private sound: SoundGenerator;
    public level: number = 1;
    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.x = 160;
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.score = 0;
        this.gameState = 'paused';
        this.spawnWave();
    }

    spawnWave() {
        // Simple grid of enemies
        const rows = 3 + Math.floor(this.level / 2);
        const cols = 6;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.enemies.push({
                    x: 40 + c * 40,
                    y: 40 + r * 30,
                    w: 24,
                    h: 24,
                    active: true,
                    hp: 1,
                    type: 'normal'
                });
            }
        }
    }

    public setX(x: number) {
        if (this.gameState === 'paused') this.gameState = 'playing';
        // x is center
        this.x = Math.max(15, Math.min(305, x));
    }

    public startCharge() {
        if (this.gameState !== 'playing') return;
        this.isCharging = true;
        this.chargeStart = Date.now();
    }

    public releaseCharge() {
        if (this.gameState !== 'playing' || !this.isCharging) return;

        const chargeDuration = Date.now() - this.chargeStart;
        const isCharged = chargeDuration > CHARGE_TIME;

        // Fire bullet
        this.bullets.push({
            x: this.x,
            y: SHIP_Y - 10,
            w: isCharged ? 16 : 4,
            h: isCharged ? 30 : 10,
            active: true,
            hp: 1,
            type: 'bullet'
        });

        this.sound.playTone(isCharged ? 440 : 880, 'square', 0.1);
        this.isCharging = false;
    }

    public update(deltaTime: number) {
        if (deltaTime < 0) return;
        if (this.gameState !== 'playing') return;

        // Move bullets
        this.bullets.forEach(b => b.y -= BULLET_SPEED);
        this.bullets = this.bullets.filter(b => b.y > -50 && b.active);

        // Move enemies (Invader style - simplistic sine wave or just strafe for now)
        const time = Date.now() / 1000;
        const offset = Math.sin(time) * 2;

        let aliveEnemies = 0;
        this.enemies.forEach(e => {
            if (!e.active) return;
            aliveEnemies++;
            e.x += offset;
            // e.y += 0.05; // Slowly descend

            // Random Shoot
            if (Math.random() < 0.001 * this.level) {
                this.enemyBullets.push({
                    x: e.x,
                    y: e.y + 15,
                    w: 4,
                    h: 8,
                    active: true,
                    hp: 1,
                    type: 'enemy_bullet'
                });
            }
        });

        // Move Enemy Bullets
        this.enemyBullets.forEach(b => b.y += 3);
        this.enemyBullets = this.enemyBullets.filter(b => b.y < 500 && b.active);

        // Collisions
        // Bullet vs Enemy
        this.bullets.forEach(b => {
            if (!b.active) return;
            this.enemies.forEach(e => {
                if (!e.active || !b.active) return;
                // AABB
                if (
                    b.x - b.w / 2 < e.x + e.w / 2 &&
                    b.x + b.w / 2 > e.x - e.w / 2 &&
                    b.y - b.h / 2 < e.y + e.h / 2 &&
                    b.y + b.h / 2 > e.y - e.h / 2
                ) {
                    e.hp--;
                    if (e.hp <= 0) {
                        e.active = false;
                        this.score += 100;
                        this.sound.playNoise(0.1);
                    }
                    b.active = false; // Destroy bullet usually
                    if (b.w > 10) b.active = true; // Penetrate if charged? (Optional)
                }
            });
        });

        // Enemy/Bullet vs Player
        const shipHitBox = { x: this.x, y: SHIP_Y, w: SHIP_WIDTH, h: 20 };
        // Check enemy bullets
        this.enemyBullets.forEach(b => {
            if (
                b.x < shipHitBox.x + shipHitBox.w / 2 &&
                b.x > shipHitBox.x - shipHitBox.w / 2 &&
                b.y < shipHitBox.y + shipHitBox.h / 2 &&
                b.y > shipHitBox.y - shipHitBox.h / 2
            ) {
                this.die();
            }
        });

        // Cleared?
        if (aliveEnemies === 0) {
            this.gameState = 'cleared';
            this.sound.playDecide();
        }
    }

    die() {
        this.sound.playNoise(0.5);
        this.gameState = 'gameover';
    }
}
