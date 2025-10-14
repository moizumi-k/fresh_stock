import { useState } from 'react';
import { generateRecipes, Recipe } from '../lib/gemini';

interface UseRecipesReturn {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  generateRecipesFromIngredients: (
    ingredients: string[],
    memberCount?: number
  ) => Promise<void>;
  clearRecipes: () => void;
}

export function useRecipes(): UseRecipesReturn {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecipesFromIngredients = async (
    ingredients: string[],
    memberCount: number = 2
  ) => {
    if (ingredients.length === 0) {
      setError('食材を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generatedRecipes = await generateRecipes(ingredients, memberCount);
      setRecipes(generatedRecipes);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'レシピの生成に失敗しました';
      setError(errorMessage);
      console.error('Recipe generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRecipes = () => {
    setRecipes([]);
    setError(null);
  };

  return {
    recipes,
    isLoading,
    error,
    generateRecipesFromIngredients,
    clearRecipes,
  };
}
