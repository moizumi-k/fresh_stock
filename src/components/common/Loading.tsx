import React from 'react';
import styles from './loading.module.scss';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({
  size = 'md',
  text = '読み込み中...',
  fullScreen = false,
}: LoadingProps) {
  const containerClass = fullScreen
    ? `${styles.container} ${styles.fullScreen}`
    : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${styles[size]}`}>🥬</div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
