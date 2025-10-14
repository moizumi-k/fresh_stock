'use client';

import { useAuth } from '../../lib/AuthContext';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Loading from '../common/Loading';
import ProtectedRoute from './ProtectedRoute';
import styles from './appLayout.module.scss';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // 認証不要なページ（ログイン・サインアップ）
  const publicPages = ['/auth/login', '/auth/signup'];
  const isPublicPage = publicPages.some((page) => pathname?.startsWith(page));

  if (loading) {
    return <Loading text='読み込み中...' fullScreen />;
  }

  // 認証ページの場合はヘッダーなしで表示
  if (isPublicPage) {
    return <>{children}</>;
  }

  // 認証が必要なページは ProtectedRoute でラップ
  return (
    <ProtectedRoute>
      <div className={styles.appLayout}>
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
