// クライアント側：API経由でレシピを生成

import { supabase } from './supabase';

export interface Recipe {
  name: string;
  description: string;
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
  ingredients: string[];
  steps: string[];
}

/**
 * 1つのレシピを生成
 */
async function generateSingleRecipe(
  ingredients: string[],
  memberCount: number,
  recipeIndex: number,
  totalRecipes: number
): Promise<Recipe> {
  console.log(`📤 API リクエスト送信: レシピ${recipeIndex}`);

  // 認証トークンを取得
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('ログインが必要です');
  }

  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`, // トークンを追加
    },
    body: JSON.stringify({
      ingredients,
      memberCount,
      recipeIndex,
      totalRecipes,
    }),
  });

  console.log(`📥 レスポンス受信: status ${response.status}`);

  // レスポンステキストを取得（デバッグ用）
  const responseText = await response.text();

  if (!response.ok) {
    console.error('❌ API エラー:', responseText);
    throw new Error(responseText || 'レシピの生成に失敗しました');
  }

  try {
    const data = JSON.parse(responseText);
    return data.recipe;
  } catch (error) {
    console.error('❌ JSON パースエラー:', error);
    console.error('受信したテキスト:', responseText);
    throw new Error('レシピの解析に失敗しました');
  }
}

/**
 * 複数レシピを並列生成
 */
export async function generateRecipes(
  ingredients: string[],
  memberCount: number = 2,
  count: number = 3
): Promise<Recipe[]> {
  try {
    console.log(`🚀 ${count}個のレシピを並列生成開始...`);

    const promises = Array.from({ length: count }, (_, index) => {
      console.log(`📡 レシピ${index + 1}を生成中...`);
      return generateSingleRecipe(ingredients, memberCount, index + 1, count);
    });

    const results = await Promise.all(promises);

    console.log(`✅ ${results.length}個のレシピ生成完了！`);
    return results.filter(Boolean);
  } catch (error) {
    console.error('Recipe generation error:', error);
    throw new Error('レシピの生成に失敗しました');
  }
}
