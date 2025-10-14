'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Search, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import { useIngredients } from '../../hooks/useIngredients';
import { INGREDIENT_CATEGORIES } from '../../constants/api';
import styles from './ingredients.module.scss';

export default function IngredientsPage() {
  const {
    userIngredients,
    masterIngredients,
    isLoading,
    addIngredient,
    toggleStock,
    removeIngredient,
  } = useIngredients();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // カテゴリオプション作成
  const categoryOptions = INGREDIENT_CATEGORIES.map((category) => ({
    value: category,
    label: category === 'all' ? '全てのカテゴリ' : category,
  }));

  // 新しい食材を追加
  const handleAddIngredient = async (masterIngredient: {
    id: string;
    name: string;
    category: string;
  }) => {
    const success = await addIngredient(masterIngredient);
    if (success) {
      setShowAddForm(false);
      setSearchTerm('');
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
    return <Loading text='食材データを読み込み中...' />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🥬 食材管理</h1>
        <Button variant='primary' onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} />
          食材追加
        </Button>
      </header>

      {/* 食材追加フォーム */}
      {showAddForm && (
        <div className={styles.addForm}>
          <Input
            placeholder='食材名で検索...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={20} />}
          />

          <div className={styles.masterIngredientsList}>
            {filteredMasterIngredients.slice(0, 10).map((ingredient) => (
              <button
                key={ingredient.id}
                onClick={() => handleAddIngredient(ingredient)}
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
        <Select
          options={categoryOptions}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />
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
                  <Button
                    variant={ingredient.has_stock ? 'primary' : 'secondary'}
                    onClick={() =>
                      toggleStock(ingredient.id, ingredient.has_stock)
                    }
                    size='sm'
                  >
                    {ingredient.has_stock ? '✅ あり' : '❌ なし'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
