import { SoundGenerator } from '../../audio/SoundGenerator';

export interface Card {
    id: number;
    value: number; // 0-7 (8 pairs max for 4x4)
    flipped: boolean;
    matched: boolean;
}

export class MemoryMatchLogic {
    public cards: Card[] = [];
    public score: number = 0;
    public level: number = 1;
    public gameState: 'playing' | 'gameover' | 'cleared' | 'paused' = 'paused';
    public timeLeft: number = 60; // Seconds

    private sound: SoundGenerator;
    private flippedCards: number[] = []; // Indices
    private lockBoard: boolean = false;
    private timerInterval: any = null;

    constructor(sound: SoundGenerator, level: number = 1) {
        this.sound = sound;
        this.level = level;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.timeLeft = Math.max(30, 65 - this.level * 5);
        this.gameState = 'playing'; // Auto start? or paused
        this.flippedCards = [];
        this.lockBoard = false;

        this.setupBoard();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.die();
                }
            }
        }, 1000);
    }

    private setupBoard() {
        // Level 1-3: 4x3 (12 cards, 6 pairs)
        // Level 4+: 4x4 (16 cards, 8 pairs)
        const pairCount = this.level >= 4 ? 8 : 6;

        let values: number[] = [];
        for (let i = 0; i < pairCount; i++) {
            values.push(i);
            values.push(i);
        }
        // Shuffle
        values.sort(() => Math.random() - 0.5);

        this.cards = values.map((v, i) => ({
            id: i,
            value: v,
            flipped: false,
            matched: false
        }));
    }

    public flipCard(index: number) {
        if (this.gameState !== 'playing') return;
        if (this.lockBoard) return;
        if (this.cards[index].flipped || this.cards[index].matched) return;

        this.sound.playTone(880, 'triangle', 0.05);

        // Flip
        this.cards[index].flipped = true;
        this.flippedCards.push(index);

        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }

    private checkForMatch() {
        this.lockBoard = true;
        const [first, second] = this.flippedCards;

        if (this.cards[first].value === this.cards[second].value) {
            // Match
            this.cards[first].matched = true;
            this.cards[second].matched = true;
            this.score += 100 + this.timeLeft; // Bonus
            this.flippedCards = [];
            this.lockBoard = false;
            this.sound.playTone(1200, 'square', 0.1);

            // Check clear
            if (this.cards.every(c => c.matched)) {
                this.gameState = 'cleared';
                this.sound.playDecide();
                if (this.timerInterval) clearInterval(this.timerInterval);
            }
        } else {
            // No Match
            this.sound.playTone(200, 'sawtooth', 0.1);
            setTimeout(() => {
                this.cards[first].flipped = false;
                this.cards[second].flipped = false;
                this.flippedCards = [];
                this.lockBoard = false;
            }, 1000);
        }
    }

    public update(_dt: number) {
        // Timer handled by setInterval, logic mostly event based
    }

    die() {
        this.sound.playTone(55, 'sawtooth', 0.5);
        this.gameState = 'gameover';
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    cleanup() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
}
