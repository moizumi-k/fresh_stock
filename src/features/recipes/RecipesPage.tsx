'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { ChefHat, Clock, TrendingUp } from 'lucide-react';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import styles from './recipes.module.scss';

export default function RecipesPage() {
  const { user } = useAuth();
  const { userIngredients, isLoading: loadingIngredients } = useIngredients();
  const { recipes, isLoading, error, generateRecipesFromIngredients } =
    useRecipes();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // 在庫ありの食材のみフィルター
  const availableIngredients = userIngredients.filter((ing) => ing.has_stock);

  // 自動選択：在庫ありの食材を全て選択
  useEffect(() => {
    if (availableIngredients.length > 0) {
      setSelectedIngredients(availableIngredients.map((ing) => ing.name));
    }
  }, [userIngredients]);

  const handleGenerateRecipes = async () => {
    await generateRecipesFromIngredients(selectedIngredients);
  };

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  if (loadingIngredients) {
    return <Loading text='食材データを読み込み中...' />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🤖 AIレシピ提案</h1>
        <p className={styles.subtitle}>
          手持ちの食材からAIがレシピを提案します
        </p>
      </header>

      {/* 食材選択エリア */}
      <section className={styles.ingredientsSection}>
        <h2>使用する食材を選択</h2>

        {availableIngredients.length === 0 ? (
          <div className={styles.emptyState}>
            <p>在庫がある食材がありません</p>
            <p>食材管理画面で食材を追加してください</p>
          </div>
        ) : (
          <>
            <div className={styles.ingredientsList}>
              {availableIngredients.map((ingredient) => (
                <button
                  key={ingredient.id}
                  onClick={() => toggleIngredient(ingredient.name)}
                  className={`${styles.ingredientChip} ${
                    selectedIngredients.includes(ingredient.name)
                      ? styles.selected
                      : ''
                  }`}
                >
                  {ingredient.name}
                  {selectedIngredients.includes(ingredient.name) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.actions}>
              <Button
                variant='primary'
                size='lg'
                onClick={handleGenerateRecipes}
                isLoading={isLoading}
                disabled={selectedIngredients.length === 0}
              >
                <ChefHat size={20} />
                レシピを提案してもらう
              </Button>
            </div>
          </>
        )}
      </section>

      {/* エラー表示 */}
      {error && <div className={styles.error}>{error}</div>}

      {/* レシピ一覧 */}
      {recipes.length > 0 && (
        <section className={styles.recipesSection}>
          <h2>提案されたレシピ</h2>

          <div className={styles.recipesGrid}>
            {recipes.map((recipe, index) => (
              <div key={index} className={styles.recipeCard}>
                <div className={styles.recipeHeader}>
                  <h3>{recipe.name}</h3>
                  <div className={styles.recipeMeta}>
                    <span className={styles.metaItem}>
                      <Clock size={16} />
                      {recipe.cookingTime}
                    </span>
                    <span className={`${styles.metaItem} ${styles.difficulty}`}>
                      <TrendingUp size={16} />
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>

                <p className={styles.description}>{recipe.description}</p>

                <div className={styles.recipeIngredients}>
                  <h4>材料</h4>
                  <ul>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.recipeSteps}>
                  <h4>作り方</h4>
                  <ol>
                    {recipe.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
