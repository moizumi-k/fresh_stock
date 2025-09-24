import React from 'react';
import styles from './button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const buttonClass = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${isLoading ? styles.loading : ''}
    ${className}
  `.trim();

  return (
    <button className={buttonClass} disabled={disabled || isLoading} {...props}>
      {isLoading ? <span className={styles.spinner}>🔄</span> : children}
    </button>
  );
}
