import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/api';
import { showToast } from '../components/common/Toast';

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
  } | null;
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

  useEffect(() => {
    fetchUserIngredients();
  }, []);

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

      if (error) throw error;

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
      showToast.error('食材データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = async (masterIngredient: {
    id: string;
    name: string;
    category: string;
  }): Promise<boolean> => {
    try {
      const exists = await supabase
        .from(TABLES.INGREDIENTS)
        .select('id')
        .eq('master_ingredient_id', masterIngredient.id)
        .eq('family_group_id', (await getFamilyGroupId()) || '')
        .single();

      if (exists.data) {
        showToast.error('この食材は既に追加されています');
        return false;
      }

      const familyGroupId = await getFamilyGroupId();
      if (!familyGroupId) {
        showToast.error('家族グループ情報の取得に失敗しました');
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

      if (error) throw error;

      await fetchUserIngredients();
      showToast.success(`${masterIngredient.name}を追加しました`);
      return true;
    } catch (error) {
      showToast.error('食材の追加に失敗しました');
      return false;
    }
  };

  const addCustomIngredient = async (
    name: string,
    category: string
  ): Promise<boolean> => {
    try {
      if (!name || !category) {
        showToast.error('食材名とカテゴリを入力してください');
        return false;
      }

      if (name.length < 2) {
        showToast.error('食材名は2文字以上で入力してください');
        return false;
      }

      const familyGroupId = await getFamilyGroupId();
      if (!familyGroupId) {
        showToast.error('家族グループ情報の取得に失敗しました');
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

      if (error) throw error;

      await fetchUserIngredients();
      showToast.success(`${name}を追加しました`);
      return true;
    } catch (error) {
      showToast.error('食材の追加に失敗しました');
      return false;
    }
  };

  const toggleStock = async (ingredientId: string, currentStock: boolean) => {
    try {
      const { error } = await supabase
        .from(TABLES.INGREDIENTS)
        .update({
          has_stock: !currentStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ingredientId);

      if (error) throw error;
      await fetchUserIngredients();
    } catch (error) {
      showToast.error('在庫状態の更新に失敗しました');
    }
  };

  const removeIngredient = async (ingredientId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from(TABLES.INGREDIENTS)
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;

      await fetchUserIngredients();
      showToast.success('食材を削除しました');
      return true;
    } catch (error) {
      showToast.error('食材の削除に失敗しました');
      return false;
    }
  };

  const refreshIngredients = async () => {
    setIsLoading(true);
    await fetchUserIngredients();
    setIsLoading(false);
  };

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
        return null;
      }

      return profile.family_group_id;
    } catch (error) {
      return null;
    }
  };

  return {
    userIngredients,
    isLoading,
    addIngredient,
    addCustomIngredient,
    toggleStock,
    removeIngredient,
    refreshIngredients,
  };
}
