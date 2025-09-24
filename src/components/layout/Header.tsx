'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Button from '../common/Button';
import { Home, Package, ChefHat, Settings, LogOut } from 'lucide-react';
import styles from './header.module.scss';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // ナビゲーションアイテム
  const navItems = [
    {
      path: '/',
      label: 'ホーム',
      icon: <Home size={20} />,
    },
    {
      path: '/ingredients',
      label: '食材管理',
      icon: <Package size={20} />,
    },
    {
      path: '/recipes',
      label: 'レシピ',
      icon: <ChefHat size={20} />,
      disabled: true, // 準備中
    },
    {
      path: '/settings',
      label: '設定',
      icon: <Settings size={20} />,
      disabled: true, // 準備中
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* ロゴ */}
        <div className={styles.logo} onClick={() => handleNavigation('/')}>
          🥬 FreshStock
        </div>

        {/* ナビゲーション */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => !item.disabled && handleNavigation(item.path)}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ''
              } ${item.disabled ? styles.disabled : ''}`}
              disabled={item.disabled}
            >
              {item.icon}
              <span className={styles.navLabel}>{item.label}</span>
              {item.disabled && (
                <span className={styles.comingSoon}>準備中</span>
              )}
            </button>
          ))}
        </nav>

        {/* ユーザー情報とログアウト */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>
              {user?.email?.split('@')[0] || 'ユーザー'}
            </span>
          </div>

          <Button variant='secondary' size='sm' onClick={handleSignOut}>
            <LogOut size={16} />
            <span className={styles.logoutText}>ログアウト</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
