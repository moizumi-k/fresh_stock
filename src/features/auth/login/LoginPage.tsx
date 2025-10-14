'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAuthForm } from '../../../hooks/useAuthForm';
import styles from './login.module.scss';

// フォームバリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { isLoading, error, login } = useAuthForm();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
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

          <Input
            label='メールアドレス'
            type='email'
            placeholder='example@email.com'
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label='パスワード'
            type='password'
            placeholder='パスワードを入力'
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type='submit'
            variant='primary'
            size='lg'
            isLoading={isLoading}
          >
            ログイン
          </Button>
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
