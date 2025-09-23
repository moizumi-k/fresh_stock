'use client';

import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './home.module.scss';

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>🥬</div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null; // リダイレクト中
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>🥬 FreshStock</h1>
        <button onClick={signOut} className={styles.logoutButton}>
          ログアウト
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.welcome}>
          <h2>こんにちは！</h2>
          <p>ようこそ、{user.email}さん</p>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>🥕 食材管理</h3>
            <p>冷蔵庫の食材をかんたん管理</p>
            <a href='/ingredients' className={styles.featureButton}>
              食材管理へ
            </a>
          </div>

          <div className={styles.featureCard}>
            <h3>🤖 AIレシピ提案</h3>
            <p>手持ちの食材でレシピを提案</p>
            <button className={styles.comingSoon}>準備中</button>
          </div>

          <div className={styles.featureCard}>
            <h3>👨‍👩‍👧‍👦 家族設定</h3>
            <p>家族人数や設定を管理</p>
            <button className={styles.comingSoon}>準備中</button>
          </div>
        </div>
      </main>
    </div>
  );
}
