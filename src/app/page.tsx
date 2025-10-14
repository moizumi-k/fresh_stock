'use client';

import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '../components/common/Button';
import styles from './home.module.scss';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.welcome}>
          <h1>こんにちは！</h1>
          <p>ようこそ、{user?.email?.split('@')[0]}さん</p>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h2>🥕 食材管理</h2>
            <p>冷蔵庫の食材をかんたん管理</p>
            <Button
              variant='primary'
              onClick={() => router.push('/ingredients')}
            >
              食材管理へ
            </Button>
          </div>

          <div className={styles.featureCard}>
            <h2>🤖 AIレシピ提案</h2>
            <p>手持ちの食材でレシピを提案</p>
            <Button variant='primary' onClick={() => router.push('/recipes')}>
              レシピ提案へ
            </Button>
          </div>

          <div className={styles.featureCard}>
            <h2>👨‍👩‍👧‍👦 家族設定</h2>
            <p>家族人数や設定を管理</p>
            <Button variant='primary' onClick={() => router.push('/settings')}>
              設定へ
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
