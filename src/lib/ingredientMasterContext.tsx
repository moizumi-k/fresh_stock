'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { TABLES } from '../constants/api';

export interface IngredientMaster {
  id: string;
  name: string;
  category: string;
}

interface IngredientMasterContextType {
  masterIngredients: IngredientMaster[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const IngredientMasterContext = createContext<
  IngredientMasterContextType | undefined
>(undefined);

export const IngredientMasterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [masterIngredients, setMasterIngredients] = useState<
    IngredientMaster[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMasterIngredients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 マスター食材を取得中...');

      const { data, error: fetchError } = await supabase
        .from(TABLES.INGREDIENT_MASTER)
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      console.log(`✅ マスター食材 ${data?.length}件を取得`);
      setMasterIngredients(data || []);
    } catch (err) {
      console.error('❌ マスター食材の取得に失敗:', err);
      setError(
        err instanceof Error ? err.message : 'マスター食材の取得に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchMasterIngredients();
  }, []);

  const refetch = async () => {
    await fetchMasterIngredients();
  };

  return (
    <IngredientMasterContext.Provider
      value={{
        masterIngredients,
        isLoading,
        error,
        refetch,
      }}
    >
      {children}
    </IngredientMasterContext.Provider>
  );
};

// カスタムフック
export const useIngredientMaster = () => {
  const context = useContext(IngredientMasterContext);
  if (context === undefined) {
    throw new Error(
      'useIngredientMaster must be used within IngredientMasterProvider'
    );
  }
  return context;
};
