'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Search, Plus, Trash2 } from 'lucide-react';
import styles from './ingredients.module.scss';

interface IngredientMaster {
  id: string;
  name: string;
  category: string;
}

interface UserIngredient {
  id: string;
  name: string;
  category: string;
  has_stock: boolean;
  added_date: string;
}

export default function IngredientsPage() {
  const { user } = useAuth();
  const [userIngredients, setUserIngredients] = useState<UserIngredient[]>([]);
  const [masterIngredients, setMasterIngredients] = useState<
    IngredientMaster[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // カテゴリ一覧を取得
  const categories = [
    'all',
    '野菜',
    '肉類',
    '魚介類',
    '乳製品・卵',
    '調味料',
    '穀物・麺類',
    'その他',
  ];

  useEffect(() => {
    if (user) {
      fetchUserIngredients();
      fetchMasterIngredients();
    }
  }, [user]);

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

  // 食材の在庫状態を切り替え
  const toggleIngredientStock = async (
    ingredientId: string,
    currentStock: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({
          has_stock: !currentStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ingredientId);

      if (error) throw error;
      fetchUserIngredients();
    } catch (error) {
      console.error('Failed to toggle ingredient stock:', error);
    }
  };

  // 新しい食材を追加
  const addIngredientFromMaster = async (
    masterIngredient: IngredientMaster
  ) => {
    try {
      // 既に追加済みかチェック
      const exists = userIngredients.some(
        (ingredient) => ingredient.name === masterIngredient.name
      );

      if (exists) {
        alert('この食材は既に追加されています');
        return;
      }

      const { error } = await supabase.from('ingredients').insert({
        name: masterIngredient.name,
        category: masterIngredient.category,
        has_stock: true, // デフォルトで「ある」状態
      });

      if (error) throw error;
      fetchUserIngredients();
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add ingredient:', error);
    }
  };

  // 食材を削除
  const removeIngredient = async (ingredientId: string) => {
    if (confirm('この食材を削除しますか？')) {
      try {
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', ingredientId);

        if (error) throw error;
        fetchUserIngredients();
      } catch (error) {
        console.error('Failed to remove ingredient:', error);
      }
    }
  };

  // フィルタリングされた食材一覧
  const filteredUserIngredients = userIngredients.filter((ingredient) => {
    const matchesCategory =
      selectedCategory === 'all' || ingredient.category === selectedCategory;
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // フィルタリングされたマスター食材一覧（追加フォーム用）
  const filteredMasterIngredients = masterIngredients.filter((ingredient) => {
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const notAdded = !userIngredients.some(
      (userIng) => userIng.name === ingredient.name
    );
    return matchesSearch && notAdded;
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>🥬</div>
        <p>食材データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🥬 食材管理</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          <Plus size={20} />
          食材追加
        </button>
      </header>

      {/* 食材追加フォーム */}
      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.searchBox}>
            <Search size={20} />
            <input
              type='text'
              placeholder='食材名で検索...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.masterIngredientsList}>
            {filteredMasterIngredients.slice(0, 10).map((ingredient) => (
              <button
                key={ingredient.id}
                onClick={() => addIngredientFromMaster(ingredient)}
                className={styles.masterIngredientItem}
              >
                <span className={styles.category}>{ingredient.category}</span>
                <span className={styles.name}>{ingredient.name}</span>
                <Plus size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className={styles.filters}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categorySelect}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? '全てのカテゴリ' : category}
            </option>
          ))}
        </select>
      </div>

      {/* 食材一覧 */}
      <div className={styles.ingredientsList}>
        {filteredUserIngredients.length === 0 ? (
          <div className={styles.emptyState}>
            <p>まだ食材が登録されていません</p>
            <p>「食材追加」ボタンから食材を追加してみましょう</p>
          </div>
        ) : (
          <div className={styles.ingredientsGrid}>
            {filteredUserIngredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className={`${styles.ingredientCard} ${
                  ingredient.has_stock ? styles.inStock : styles.outOfStock
                }`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.category}>{ingredient.category}</span>
                  <button
                    onClick={() => removeIngredient(ingredient.id)}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.name}>{ingredient.name}</h3>
                  <button
                    onClick={() =>
                      toggleIngredientStock(ingredient.id, ingredient.has_stock)
                    }
                    className={styles.stockToggle}
                  >
                    {ingredient.has_stock ? '✅ あり' : '❌ なし'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
