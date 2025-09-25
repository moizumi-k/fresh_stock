'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Package, ChefHat, Settings } from 'lucide-react';
import { ROUTES, NAVIGATION_ROUTES } from '../../constants/routes';
import styles from './header.module.scss';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* ロゴ */}
        <div
          className={styles.logo}
          onClick={() => handleNavigation(ROUTES.HOME)}
        >
          🥬 FreshStock
        </div>

        {/* ナビゲーション */}
        <nav className={styles.nav}>
          {NAVIGATION_ROUTES.map((item) => {
            // アイコンコンポーネントの動的生成
            const IconComponent =
              {
                Home,
                Package,
                ChefHat,
                Settings,
              }[item.icon] || Home;

            return (
              <button
                key={item.path}
                onClick={() => !item.disabled && handleNavigation(item.path)}
                className={`${styles.navItem} ${
                  pathname === item.path ? styles.active : ''
                } ${item.disabled ? styles.disabled : ''}`}
                disabled={item.disabled}
              >
                <IconComponent size={20} />
                <span className={styles.navLabel}>{item.label}</span>
                {item.disabled && (
                  <span className={styles.comingSoon}>準備中</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
