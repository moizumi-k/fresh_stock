import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/api';

export interface IngredientMaster {
  id: string;
  name: string;
  category: string;
}

export interface UserIngredient {
  id: string;
  name: string;
  category: string;
  has_stock: boolean;
  added_date: string;
}

interface UseIngredientsReturn {
  userIngredients: UserIngredient[];
  masterIngredients: IngredientMaster[];
  isLoading: boolean;
  addIngredient: (masterIngredient: IngredientMaster) => Promise<boolean>;
  toggleStock: (ingredientId: string, currentStock: boolean) => Promise<void>;
  removeIngredient: (ingredientId: string) => Promise<boolean>;
  refreshIngredients: () => Promise<void>;
}

export function useIngredients(): UseIngredientsReturn {
  const [userIngredients, setUserIngredients] = useState<UserIngredient[]>([]);
  const [masterIngredients, setMasterIngredients] = useState<
    IngredientMaster[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // データの初回取得
  useEffect(() => {
    fetchUserIngredients();
    fetchMasterIngredients();
  }, []);

  // ユーザーの食材データ取得
  const fetchUserIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.INGREDIENTS)
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Ingredients fetch error:', error);
        throw error;
      }
      setUserIngredients(data || []);
    } catch (error) {
      console.error('Failed to fetch user ingredients:', error);
    }
  };

  // マスター食材データ取得
  const fetchMasterIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.INGREDIENT_MASTER)
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Master ingredients fetch error:', error);
        throw error;
      }
      console.log(data);

      setMasterIngredients(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch master ingredients:', error);
      setIsLoading(false);
    }
  };

  // 食材追加
  const addIngredient = async (
    masterIngredient: IngredientMaster
  ): Promise<boolean> => {
    try {
      // 重複チェック
      const exists = userIngredients.some(
        (ingredient) => ingredient.name === masterIngredient.name
      );

      if (exists) {
        alert('この食材は既に追加されています');
        return false;
      }

      // 現在のユーザー情報を取得してfamily_group_idを取得
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .select('family_group_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError || !profile?.family_group_id) {
        console.error('Profile error:', profileError);
        alert('ユーザー情報の取得に失敗しました');
        return false;
      }

      const { error } = await supabase.from(TABLES.INGREDIENTS).insert({
        family_group_id: profile.family_group_id,
        name: masterIngredient.name,
        category: masterIngredient.category,
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
    await Promise.all([fetchUserIngredients(), fetchMasterIngredients()]);
    setIsLoading(false);
  };

  return {
    userIngredients,
    masterIngredients,
    isLoading,
    addIngredient,
    toggleStock,
    removeIngredient,
    refreshIngredients,
  };
}
