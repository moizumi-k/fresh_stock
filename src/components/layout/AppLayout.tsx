'use client';

import { useAuth } from '../../lib/AuthContext';
import Header from './Header';
import Loading from '../common/Loading';
import styles from './appLayout.module.scss';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text='読み込み中...' fullScreen />;
  }

  // 認証が必要なページの場合はヘッダーを表示
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className={styles.appLayout}>
      <Header />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
