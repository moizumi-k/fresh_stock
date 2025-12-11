'use client';

import { useState } from 'react';
import { Search, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import { showToast } from '../../components/common/Toast';
import { useIngredients } from '../../hooks/useIngredients';
import { INGREDIENT_CATEGORIES } from '../../constants/api';
import styles from './ingredients.module.scss';
import {
  IngredientMaster,
  useIngredientMaster,
} from '../../lib/ingredientMasterContext';

export default function IngredientsPage() {
  const {
    userIngredients,
    isLoading,
    addIngredient,
    addCustomIngredient,
    toggleStock,
    removeIngredient,
  } = useIngredients();

  const { masterIngredients, isLoading: masterLoading } = useIngredientMaster();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('野菜');

  // カテゴリオプション作成
  const categoryOptions = INGREDIENT_CATEGORIES.map((category) => ({
    value: category,
    label: category === 'all' ? '全てのカテゴリ' : category,
  }));

  // 新しい食材を追加
  const handleAddIngredient = async (masterIngredient: IngredientMaster) => {
    const success = await addIngredient(masterIngredient);
    if (success) {
      setShowAddForm(false);
      setSearchTerm('');
    }
  };

  // カスタム食材を追加
  const handleAddCustomIngredient = async () => {
    if (!customName.trim()) {
      showToast.error('食材名を入力してください');
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

  // 在庫状態切り替え
  const handleToggleStock = async (
    ingredientId: string,
    currentStock: boolean,
    name: string
  ) => {
    await toggleStock(ingredientId, currentStock);
    const newStatus = currentStock ? 'なし' : 'あり';
    showToast.success(`${name}の在庫を「${newStatus}」にしました`);
  };

  // 食材削除
  const handleRemoveIngredient = async (ingredientId: string, name: string) => {
    if (confirm(`${name}を削除しますか？`)) {
      await removeIngredient(ingredientId);
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

  // フィルタリングされたマスター食材一覧
  const filteredMasterIngredients = masterIngredients.filter((ingredient) => {
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

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
          <div className={styles.addFormHeader}>
            <h3>食材を追加</h3>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setShowAddForm(false)}
            >
              戻る
            </Button>
          </div>

          <Input
            placeholder='食材名で検索...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={20} />}
          />

          <div className={styles.masterIngredientsList}>
            {filteredMasterIngredients.length === 0 ? (
              <div className={styles.noResults}>
                <p>該当する食材が見つかりません</p>
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
                <div className={styles.customAddButton}>
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
          <div className={styles.addFormHeader}>
            <h3>手動で食材を追加</h3>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => {
                setShowCustomForm(false);
                setCustomName('');
                setShowAddForm(true);
              }}
            >
              戻る
            </Button>
          </div>

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

          <div className={styles.formActions}>
            <Button variant='primary' onClick={handleAddCustomIngredient}>
              追加
            </Button>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className={styles.searchFilter}>
        <Input
          placeholder='食材名で検索...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} />}
        />
        <Select
          options={categoryOptions}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />
      </div>

      {/* 食材テーブル */}
      <div className={styles.tableContainer}>
        {filteredUserIngredients.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>食材がありません</h3>
            <p>
              {selectedCategory === 'all'
                ? 'まだ食材が登録されていません'
                : `${selectedCategory}カテゴリの食材がありません`}
            </p>
            <Button variant='primary' onClick={() => setShowAddForm(true)}>
              <Plus size={20} />
              食材を追加
            </Button>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>食材名</div>
              <div className={styles.headerCell}>カテゴリ</div>
              <div className={styles.headerCell}>在庫状況</div>
              <div className={styles.headerCell}>操作</div>
            </div>

            <div className={styles.tableBody}>
              {filteredUserIngredients.map((ingredient) => (
                <div key={ingredient.id} className={styles.tableRow}>
                  <div className={styles.cell}>
                    <span className={styles.ingredientName}>
                      {ingredient.name}
                    </span>
                    {ingredient.is_custom && (
                      <span className={styles.customBadge}>カスタム</span>
                    )}
                  </div>

                  <div className={styles.cell}>
                    <span className={styles.category}>
                      {ingredient.category}
                    </span>
                  </div>

                  <div className={styles.cell}>
                    <button
                      onClick={() =>
                        handleToggleStock(
                          ingredient.id,
                          ingredient.has_stock,
                          ingredient.name
                        )
                      }
                      className={`${styles.stockButton} ${
                        ingredient.has_stock
                          ? styles.inStock
                          : styles.outOfStock
                      }`}
                    >
                      {ingredient.has_stock ? (
                        <>
                          <CheckCircle size={16} />
                          <span>あり</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          <span>なし</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={styles.cell}>
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() =>
                        handleRemoveIngredient(ingredient.id, ingredient.name)
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
