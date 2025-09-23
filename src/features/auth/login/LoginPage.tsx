'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import styles from './login.module.scss';

// フォームバリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // AuthContextが自動でリダイレクトするので、手動リダイレクト削除
      console.log('Login successful:', authData.user?.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        {/* ロゴ・アプリ名 */}
        <div className={styles.header}>
          <h1 className={styles.logo}>🥬 FreshStock</h1>
          <p className={styles.subtitle}>家族の食材管理アプリ</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor='email' className={styles.label}>
              メールアドレス
            </label>
            <input
              id='email'
              type='email'
              className={styles.input}
              placeholder='example@email.com'
              {...register('email')}
            />
            {errors.email && (
              <span className={styles.fieldError}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='password' className={styles.label}>
              パスワード
            </label>
            <input
              id='password'
              type='password'
              className={styles.input}
              placeholder='パスワードを入力'
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.fieldError}>
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* サインアップへのリンク */}
        <div className={styles.footer}>
          <p>
            アカウントをお持ちでない方は{' '}
            <Link href='/auth/signup' className={styles.link}>
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
