import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
    width: number;
    height: number;
    onUpdate: (deltaTime: number) => void;
    onDraw: (ctx: CanvasRenderingContext2D) => void;
    className?: string;
    paused?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
    width,
    height,
    onUpdate,
    onDraw,
    className,
    paused = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);

    const animate = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;

            // Cap deltaTime to avoid huge jumps if tab is inactive
            const cappedDelta = Math.min(deltaTime, 50);

            if (!paused) {
                onUpdate(cappedDelta);
            }

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, width, height);
                    onDraw(ctx);
                }
            }
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [paused, onUpdate, onDraw]); // Dependencies might need tuning if logic changes often

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'var(--color-black)'
            }}
        />
    );
};
