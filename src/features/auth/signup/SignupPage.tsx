'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import styles from './signup.module.scss';

// フォームバリデーションスキーマ
const signupSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
    confirmPassword: z.string(),
    memberCount: z
      .number()
      .min(1, '家族人数は1人以上で入力してください')
      .max(5, '家族人数は5人以下で入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      memberCount: 2, // デフォルト値
    },
  });

  const generateGroupCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError('');

    try {
      // 1. ユーザー登録
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. DB関数を呼び出してプロファイルと家族グループを一括作成
        const { data: result, error: functionError } = await supabase.rpc(
          'create_user_with_family_group',
          {
            user_id: authData.user.id,
            user_email: data.email,
            member_count: data.memberCount,
          }
        );

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error('アカウント設定に失敗しました');
        }

        if (!result.success) {
          throw new Error(result.error || 'アカウント設定に失敗しました');
        }

        console.log('Account created successfully:', result);
        setSuccess(true);

        // 3秒後にログイン画面へリダイレクト
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err instanceof Error ? err.message : 'アカウント作成に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.header}>
            <h1 className={styles.logo}>🎉 登録完了！</h1>
            <p className={styles.subtitle}>
              アカウントが正常に作成されました。
              <br />
              ログイン画面に移動します...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.signupCard}>
        {/* ロゴ・アプリ名 */}
        <div className={styles.header}>
          <h1 className={styles.logo}>🥬 FreshStock</h1>
          <p className={styles.subtitle}>新規アカウント作成</p>
        </div>

        {/* サインアップフォーム */}
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
              placeholder='6文字以上で入力'
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.fieldError}>
                {errors.password.message}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='confirmPassword' className={styles.label}>
              パスワード（確認）
            </label>
            <input
              id='confirmPassword'
              type='password'
              className={styles.input}
              placeholder='パスワードを再入力'
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span className={styles.fieldError}>
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='memberCount' className={styles.label}>
              家族人数
            </label>
            <select
              id='memberCount'
              className={styles.select}
              {...register('memberCount', { valueAsNumber: true })}
            >
              <option value={1}>1人</option>
              <option value={2}>2人</option>
              <option value={3}>3人</option>
              <option value={4}>4人</option>
              <option value={5}>5人</option>
            </select>
            {errors.memberCount && (
              <span className={styles.fieldError}>
                {errors.memberCount.message}
              </span>
            )}
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'アカウント作成中...' : 'アカウントを作成'}
          </button>
        </form>

        {/* ログインへのリンク */}
        <div className={styles.footer}>
          <p>
            すでにアカウントをお持ちの方は{' '}
            <Link href='/auth/login' className={styles.link}>
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
