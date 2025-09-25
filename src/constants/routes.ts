/**
 * アプリケーション内で使用するルート定義
 */

export const ROUTES = {
  // メインページ
  HOME: '/',
  INGREDIENTS: '/ingredients',
  RECIPES: '/recipes',
  SETTINGS: '/settings',

  // 認証
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
} as const;

// ナビゲーション用（ヘッダーで使用）
export const NAVIGATION_ROUTES = [
  { path: ROUTES.HOME, label: 'ホーム', icon: 'Home', disabled: false },
  {
    path: ROUTES.INGREDIENTS,
    label: '食材管理',
    icon: 'Package',
    disabled: false,
  },
  { path: ROUTES.RECIPES, label: 'レシピ', icon: 'ChefHat', disabled: true },
  { path: ROUTES.SETTINGS, label: '設定', icon: 'Settings', disabled: true },
] as const;
