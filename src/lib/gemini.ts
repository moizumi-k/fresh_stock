import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing env.NEXT_PUBLIC_GEMINI_API_KEY');
}

// Gemini AIクライアントの初期化
const genAI = new GoogleGenerativeAI(apiKey);

// モデルの設定
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 50,
    maxOutputTokens: 3072,
  },
});

/**
 * 1つのレシピを生成（内部関数）
 */
async function generateSingleRecipe(
  ingredients: string[],
  memberCount: number,
  recipeIndex: number,
  totalRecipes: number
): Promise<Recipe> {
  const prompt = createRecipePrompt(
    ingredients,
    memberCount,
    recipeIndex,
    totalRecipes
  );
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // パースして最初のレシピを返す
  const recipes = parseRecipeResponse(text);
  return recipes[0];
}

/**
 * 食材リストから複数レシピを並列生成（メイン関数）
 */
export async function generateRecipes(
  ingredients: string[],
  memberCount: number = 2,
  count: number = 3
): Promise<Recipe[]> {
  try {
    console.log(`🚀 ${count}個のレシピを並列生成開始...`);

    // 3回同時にAPIを叩く（それぞれに異なるバリエーションを指定）
    const promises = Array.from({ length: count }, (_, index) => {
      console.log(`📡 レシピ${index + 1}を生成中...`);
      return generateSingleRecipe(ingredients, memberCount, index + 1, count);
    });

    // 全てのレシピが生成されるまで待つ
    const results = await Promise.all(promises);

    console.log(`✅ ${results.length}個のレシピ生成完了！`);
    return results.filter(Boolean); // nullやundefinedを除外
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('レシピの生成に失敗しました');
  }
}

/**
 * プロンプト作成
 */
function createRecipePrompt(
  ingredients: string[],
  memberCount: number,
  recipeIndex: number,
  totalRecipes: number
): string {
  const ingredientList = ingredients.join('、');

  // レシピのジャンルを指定（重複を避ける）
  const genres = ['和食のレシピ', '洋食のレシピ', '中華料理のレシピ'];

  const genreHint = genres[recipeIndex - 1] || 'ユニークなレシピ';

  return `
あなたは料理の専門家です。以下の食材を使って、${memberCount}人分の${genreHint}を提案してください。

**利用可能な食材:**
${ingredientList}

**重要な条件:**
- これは${totalRecipes}個のレシピ提案のうちの${recipeIndex}番目です
- ${genreHint}に特化した料理を1つ提案してください
- 他のジャンルとは明確に異なる料理にしてください
- 調理時間は30分以内
- できるだけ多くの食材を使用するが、合わなそうな食材は使用しない
- 実在する一般的な料理名を使用してください
- 基本的な調味料（塩、醤油、砂糖、油など）は家にあるものとして考えてOK
- 手順は3〜5ステップで簡潔に

**出力形式（必ず以下のJSON形式で出力してください）:**
\`\`\`json
{
  "recipes": [
    {
      "name": "料理名",
      "description": "料理の簡単な説明（1文）",
      "cookingTime": "調理時間（例: 20分）",
      "difficulty": "簡単",
      "ingredients": ["使用する食材1", "使用する食材2", "調味料など"],
      "steps": [
        "手順1",
        "手順2",
        "手順3"
      ]
    }
  ]
}
\`\`\`

必ずJSON形式で出力してください。余計な説明は不要です。
`.trim();
}

/**
 * レスポンスパース
 */
function parseRecipeResponse(text: string): Recipe[] {
  try {
    let jsonText = text;

    // ```json ... ``` の形式
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // ``` ... ``` の形式（jsonなし）
      const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
      }
    }

    const parsed = JSON.parse(jsonText.trim());

    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error('レシピデータが正しい形式ではありません');
    }

    return parsed.recipes;
  } catch (error) {
    console.error('Response parse error:', error);
    console.log('Raw response:', text);
    throw new Error('レシピの解析に失敗しました。もう一度試してください。');
  }
}

// 型定義
export interface Recipe {
  name: string;
  description: string;
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
  ingredients: string[];
  steps: string[];
}
