import React from 'react';
import { soundManager } from '../../audio/SoundGenerator';
import styles from './RetroButton.module.css';
import classNames from 'classnames';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    pixelBorder?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    onClick,
    ...props
}) => {

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        soundManager.playDecide();
        if (onClick) onClick(e);
    };

    return (
        <button
            className={classNames(styles.btn, styles[variant], styles[size], className)}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
};
