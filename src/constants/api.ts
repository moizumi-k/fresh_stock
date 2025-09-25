/**
 * Supabase関連の定数定義
 */

// テーブル名
export const TABLES = {
  PROFILES: 'profiles',
  FAMILY_GROUPS: 'family_groups',
  INGREDIENTS: 'ingredients',
  INGREDIENT_MASTER: 'ingredient_master',
} as const;

// RPC関数名
export const FUNCTIONS = {
  CREATE_USER_WITH_FAMILY_GROUP: 'create_user_with_family_group',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  AUTHENTICATION_FAILED: '認証に失敗しました',
  EMAIL_NOT_CONFIRMED: 'メールアドレスが確認されていません',
  INGREDIENT_ALREADY_EXISTS: 'この食材は既に追加されています',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;

// 食材カテゴリー
export const INGREDIENT_CATEGORIES = [
  'all',
  '野菜',
  '肉類',
  '魚介類',
  '乳製品・卵',
  '調味料',
  '穀物・麺類',
  'その他',
] as const;
