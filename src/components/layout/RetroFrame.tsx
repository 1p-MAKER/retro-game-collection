import React from 'react';
import styles from './RetroFrame.module.css';

interface RetroFrameProps {
    children: React.ReactNode;
}

export const RetroFrame: React.FC<RetroFrameProps> = ({ children }) => {
    return (
        <div className={styles.container}>
            <div className={styles.bezel}>
                <div className={styles.screen}>
                    {children}
                </div>
                <div className={styles.logo}>RETRO-11</div>
            </div>
        </div>
    );
};
