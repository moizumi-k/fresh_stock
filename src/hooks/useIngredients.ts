import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
        .from('ingredients')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setUserIngredients(data || []);
    } catch (error) {
      console.error('Failed to fetch user ingredients:', error);
    }
  };

  // マスター食材データ取得
  const fetchMasterIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_master')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
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

      const { error } = await supabase.from('ingredients').insert({
        name: masterIngredient.name,
        category: masterIngredient.category,
        has_stock: true,
      });

      if (error) throw error;

      await fetchUserIngredients();
      return true;
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      return false;
    }
  };

  // 在庫状態切り替え
  const toggleStock = async (ingredientId: string, currentStock: boolean) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({
          has_stock: !currentStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ingredientId);

      if (error) throw error;
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
        .from('ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;

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
