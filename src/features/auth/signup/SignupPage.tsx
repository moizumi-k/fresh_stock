'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAuthForm } from '../../../hooks/useAuthForm';
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
  const { isLoading, error, success, signup } = useAuthForm();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      memberCount: 2,
    },
  });

  const onSubmit = async (data: SignupForm) => {
    await signup(data.email, data.password, data.memberCount);

    if (success) {
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
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
            placeholder='6文字以上で入力'
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label='パスワード（確認）'
            type='password'
            placeholder='パスワードを再入力'
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

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

          <Button
            type='submit'
            variant='primary'
            size='lg'
            isLoading={isLoading}
          >
            アカウントを作成
          </Button>
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
