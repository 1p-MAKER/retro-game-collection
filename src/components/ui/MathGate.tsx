import React, { useState, useEffect } from 'react';
import { RetroButton } from '../ui/RetroButton';
import styles from './MathGate.module.css';

interface MathGateProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const MathGate: React.FC<MathGateProps> = ({ onSuccess, onCancel }) => {
    const [question, setQuestion] = useState<{ a: number, b: number }>({ a: 0, b: 0 });
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        // Generate a simple multiplication question (e.g., 3 x 7)
        // Avoid 1s and 0s to make it slightly challenging for very small kids
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        setQuestion({ a, b });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseInt(answer) === question.a * question.b) {
            onSuccess();
        } else {
            setError(true);
            setAnswer('');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3>FOR PARENTS</h3>
                <p>Please solve to continue:</p>
                <div className={styles.question}>
                    {question.a} × {question.b} = ?
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="tel"
                        value={answer}
                        onChange={(e) => {
                            setError(false);
                            setAnswer(e.target.value);
                        }}
                        className={styles.input}
                        autoFocus
                        maxLength={3}
                    />
                    <div className={styles.actions}>
                        <RetroButton type="submit" size="sm">OK</RetroButton>
                        <RetroButton type="button" variant="secondary" size="sm" onClick={onCancel}>
                            CANCEL
                        </RetroButton>
                    </div>
                </form>
                {error && <p className={styles.error}>Incorrect!</p>}
            </div>
        </div>
    );
};
