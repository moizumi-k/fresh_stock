'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import { useIngredients } from '../../hooks/useIngredients';
import { supabase } from '../../lib/supabase';
import { TABLES, INGREDIENT_CATEGORIES } from '../../constants/api';
import styles from './ingredients.module.scss';

// マスター食材の型
interface MasterIngredient {
  id: string;
  name: string;
  category: string;
}

export default function IngredientsPage() {
  const {
    userIngredients,
    isLoading,
    addIngredient,
    addCustomIngredient, // 手入力用
    toggleStock,
    removeIngredient,
  } = useIngredients();

  // マスター食材データ（TODO: 後でuseContextに移行）
  const [masterIngredients, setMasterIngredients] = useState<
    MasterIngredient[]
  >([]);
  const [masterLoading, setMasterLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false); // カスタム追加用
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('野菜');

  // マスター食材を取得（一時的、後でContextに移行）
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.INGREDIENT_MASTER)
          .select('*')
          .order('category')
          .order('name');

        if (error) throw error;
        setMasterIngredients(data || []);
      } catch (error) {
        console.error('Failed to fetch master ingredients:', error);
      } finally {
        setMasterLoading(false);
      }
    };

    fetchMaster();
  }, []);

  // カテゴリオプション作成
  const categoryOptions = INGREDIENT_CATEGORIES.map((category) => ({
    value: category,
    label: category === 'all' ? '全てのカテゴリ' : category,
  }));

  // 新しい食材を追加
  const handleAddIngredient = async (masterIngredient: MasterIngredient) => {
    const success = await addIngredient(masterIngredient);
    if (success) {
      setShowAddForm(false);
      setSearchTerm('');
    }
  };

  // カスタム食材を追加（手入力）
  const handleAddCustomIngredient = async () => {
    if (!customName.trim()) {
      alert('食材名を入力してください');
      return;
    }

    const success = await addCustomIngredient(
      customName.trim(),
      customCategory
    );
    if (success) {
      setShowCustomForm(false);
      setCustomName('');
      setCustomCategory('野菜');
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

    // 既に追加済みの食材は除外
    const notAdded = !userIngredients.some(
      (userIng) => !userIng.is_custom && userIng.name === ingredient.name
    );

    return matchesSearch && notAdded;
  });

  if (isLoading || masterLoading) {
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
            {filteredMasterIngredients.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  該当する食材が見つかりません
                </p>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    setShowCustomForm(true);
                    setShowAddForm(false);
                    setCustomName(searchTerm);
                  }}
                >
                  「{searchTerm}」を手動で追加
                </Button>
              </div>
            ) : (
              <>
                {filteredMasterIngredients.slice(0, 20).map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => handleAddIngredient(ingredient)}
                    className={styles.masterIngredientItem}
                  >
                    <span className={styles.category}>
                      {ingredient.category}
                    </span>
                    <span className={styles.name}>{ingredient.name}</span>
                    <Plus size={16} />
                  </button>
                ))}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    paddingTop: '0.5rem',
                  }}
                >
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => {
                      setShowCustomForm(true);
                      setShowAddForm(false);
                    }}
                  >
                    見つからない？手動で追加
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* カスタム食材追加フォーム */}
      {showCustomForm && (
        <div className={styles.addForm}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
            手動で食材を追加
          </h3>

          <Input
            label='食材名'
            placeholder='例: 自家製味噌'
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />

          <Select
            label='カテゴリ'
            options={INGREDIENT_CATEGORIES.filter((c) => c !== 'all').map(
              (cat) => ({ value: cat, label: cat })
            )}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Button
              variant='primary'
              onClick={handleAddCustomIngredient}
              style={{ flex: 1 }}
            >
              追加
            </Button>
            <Button
              variant='secondary'
              onClick={() => {
                setShowCustomForm(false);
                setCustomName('');
                setShowAddForm(true);
              }}
              style={{ flex: 1 }}
            >
              戻る
            </Button>
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
                  <span className={styles.category}>
                    {ingredient.category}
                    {ingredient.is_custom && ' (カスタム)'}
                  </span>
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
