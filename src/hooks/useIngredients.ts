import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/api';

// 表示用の型
export interface UserIngredient {
  id: string;
  name: string;
  category: string;
  has_stock: boolean;
  is_custom: boolean;
  added_date: string;
}

// DBから取得した生データの型
interface IngredientDbRow {
  id: string;
  family_group_id: string;
  master_ingredient_id: string | null;
  custom_name: string | null;
  custom_category: string | null;
  has_stock: boolean;
  is_custom: boolean;
  created_at: string;
  ingredient_master: {
    id: string;
    name: string;
    category: string;
  } | null; // 配列ではなく単一オブジェクト or null
}

interface UseIngredientsReturn {
  userIngredients: UserIngredient[];
  isLoading: boolean;
  addIngredient: (masterIngredient: {
    id: string;
    name: string;
    category: string;
  }) => Promise<boolean>;
  addCustomIngredient: (name: string, category: string) => Promise<boolean>;
  toggleStock: (ingredientId: string, currentStock: boolean) => Promise<void>;
  removeIngredient: (ingredientId: string) => Promise<boolean>;
  refreshIngredients: () => Promise<void>;
}

export function useIngredients(): UseIngredientsReturn {
  const [userIngredients, setUserIngredients] = useState<UserIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初回データ取得
  useEffect(() => {
    fetchUserIngredients();
  }, []);

  // ユーザーの食材データ取得（新構造対応）
  const fetchUserIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.INGREDIENTS)
        .select(
          `
          id,
          family_group_id,
          master_ingredient_id,
          custom_name,
          custom_category,
          has_stock,
          is_custom,
          created_at,
          ingredient_master (
            id,
            name,
            category
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ingredients fetch error:', error);
        throw error;
      }

      // データを整形（マスター or カスタムで表示名を切り替え）
      const formattedData: UserIngredient[] = (
        data as unknown as IngredientDbRow[]
      ).map((item) => ({
        id: item.id,
        name: item.is_custom
          ? item.custom_name!
          : item.ingredient_master?.name || '',
        category: item.is_custom
          ? item.custom_category!
          : item.ingredient_master?.category || '',
        has_stock: item.has_stock,
        is_custom: item.is_custom,
        added_date: item.created_at,
      }));

      setUserIngredients(formattedData);
    } catch (error) {
      console.error('Failed to fetch user ingredients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // マスターから食材追加
  const addIngredient = async (masterIngredient: {
    id: string;
    name: string;
    category: string;
  }): Promise<boolean> => {
    try {
      // 重複チェック（master_ingredient_idベース）
      const exists = await supabase
        .from(TABLES.INGREDIENTS)
        .select('id')
        .eq('master_ingredient_id', masterIngredient.id)
        .eq('family_group_id', (await getFamilyGroupId()) || '')
        .single();

      if (exists.data) {
        alert('この食材は既に追加されています');
        return false;
      }

      const familyGroupId = await getFamilyGroupId();
      if (!familyGroupId) {
        alert('家族グループ情報の取得に失敗しました');
        return false;
      }

      const { error } = await supabase.from(TABLES.INGREDIENTS).insert({
        family_group_id: familyGroupId,
        master_ingredient_id: masterIngredient.id,
        custom_name: null,
        custom_category: null,
        is_custom: false,
        has_stock: true,
      });

      if (error) {
        console.error('Ingredient add error:', error);
        throw error;
      }

      await fetchUserIngredients();
      return true;
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      alert('食材の追加に失敗しました: ' + (error as Error).message);
      return false;
    }
  };

  // カスタム食材追加（手入力）
  const addCustomIngredient = async (
    name: string,
    category: string
  ): Promise<boolean> => {
    try {
      // バリデーション
      if (!name || !category) {
        alert('食材名とカテゴリを入力してください');
        return false;
      }

      if (name.length < 2) {
        alert('食材名は2文字以上で入力してください');
        return false;
      }

      const familyGroupId = await getFamilyGroupId();
      if (!familyGroupId) {
        alert('家族グループ情報の取得に失敗しました');
        return false;
      }

      const { error } = await supabase.from(TABLES.INGREDIENTS).insert({
        family_group_id: familyGroupId,
        master_ingredient_id: null,
        custom_name: name,
        custom_category: category,
        is_custom: true,
        has_stock: true,
      });

      if (error) {
        console.error('Custom ingredient add error:', error);
        throw error;
      }

      await fetchUserIngredients();
      return true;
    } catch (error) {
      console.error('Failed to add custom ingredient:', error);
      alert('食材の追加に失敗しました: ' + (error as Error).message);
      return false;
    }
  };

  // 在庫状態切り替え
  const toggleStock = async (ingredientId: string, currentStock: boolean) => {
    try {
      const { error } = await supabase
        .from(TABLES.INGREDIENTS)
        .update({
          has_stock: !currentStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ingredientId);

      if (error) {
        console.error('Stock toggle error:', error);
        throw error;
      }
      await fetchUserIngredients();
    } catch (error) {
      console.error('Failed to toggle ingredient stock:', error);
    }
  };

  // 食材削除
  const removeIngredient = async (ingredientId: string): Promise<boolean> => {
    if (!confirm('この食材を削除しますか？')) {
      return false;
    }

    try {
      const { error } = await supabase
        .from(TABLES.INGREDIENTS)
        .delete()
        .eq('id', ingredientId);

      if (error) {
        console.error('Ingredient remove error:', error);
        throw error;
      }

      await fetchUserIngredients();
      return true;
    } catch (error) {
      console.error('Failed to remove ingredient:', error);
      return false;
    }
  };

  // データの再読み込み
  const refreshIngredients = async () => {
    setIsLoading(true);
    await fetchUserIngredients();
    setIsLoading(false);
  };

  // ヘルパー関数: family_group_idを取得
  const getFamilyGroupId = async (): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data: profile, error } = await supabase
        .from(TABLES.PROFILES)
        .select('family_group_id')
        .eq('id', user.id)
        .single();

      if (error || !profile?.family_group_id) {
        console.error('Profile error:', error);
        return null;
      }

      return profile.family_group_id;
    } catch (error) {
      console.error('Failed to get family group id:', error);
      return null;
    }
  };

  return {
    userIngredients,
    isLoading,
    addIngredient,
    addCustomIngredient, // 新規追加
    toggleStock,
    removeIngredient,
    refreshIngredients,
  };
}
