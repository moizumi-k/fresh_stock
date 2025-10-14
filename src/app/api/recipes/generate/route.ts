import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// 環境変数の確認
const apiKey = process.env.GEMINI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY が設定されていません！');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI
  ? genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 50,
        maxOutputTokens: 3072,
      },
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 API Route呼び出し開始');

    // 認証チェック（シンプルな方法）
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      console.log('❌ Authorization ヘッダーなし');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ 認証エラー:', authError?.message);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    console.log('✅ 認証成功:', user.email);

    // APIキーチェック
    if (!apiKey || !model) {
      console.error('❌ Gemini API未設定');
      return NextResponse.json(
        { error: 'Gemini APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // リクエストボディを取得
    const body = await request.json();
    console.log('📦 受信したデータ:', body);

    const { ingredients, memberCount, recipeIndex, totalRecipes } = body;

    // バリデーション
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: '食材を指定してください' },
        { status: 400 }
      );
    }

    // プロンプト作成
    const prompt = createRecipePrompt(
      ingredients,
      memberCount || 2,
      recipeIndex,
      totalRecipes
    );

    console.log('🤖 Gemini API呼び出し中...');

    // Gemini APIを呼び出し
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('📝 生成されたテキスト長:', text.length);

    // レスポンスをパース
    const recipes = parseRecipeResponse(text);

    if (!recipes || recipes.length === 0) {
      throw new Error('レシピが生成されませんでした');
    }

    console.log('✅ レシピ生成完了:', recipes[0].name);

    return NextResponse.json({ recipe: recipes[0] });
  } catch (error) {
    console.error('❌ API Route エラー:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'レシピの生成に失敗しました',
      },
      { status: 500 }
    );
  }
}

// プロンプト作成関数
function createRecipePrompt(
  ingredients: string[],
  memberCount: number,
  recipeIndex: number,
  totalRecipes: number
): string {
  const ingredientList = ingredients.join('、');
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

// レスポンスパース関数
function parseRecipeResponse(text: string): any[] {
  try {
    let jsonText = text;

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
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
    console.error('❌ Response parse error:', error);
    console.error('受信したテキスト:', text.substring(0, 500));
    throw new Error('レシピの解析に失敗しました');
  }
}
