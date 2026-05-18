import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const PreferenceSchema = z.object({
  diet: z.enum(["none", "vegetarian", "vegan", "low_carb", "high_protein"]).default("none"),
  allergies: z.array(z.string()).default([]),
  max_prep_minutes: z.number().int().positive().default(30),
  allow_extra_ingredients: z.boolean().default(false),
});
export type Preference = z.infer<typeof PreferenceSchema>;

export const RecipeSchema = z.object({
  title: z.string(),
  ingredients_used: z.array(z.string()),
  ingredients_extra: z.array(z.string()),
  steps: z.array(z.string()),
  prep_minutes: z.number().int().positive(),
  calories_per_serving: z.number().int().nonnegative(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const MealPlanResultSchema = z.object({
  detected_ingredients: z.array(z.string()),
  recipes: z.array(RecipeSchema),
});
export type MealPlanResult = z.infer<typeof MealPlanResultSchema>;

const SYSTEM = `당신은 한국 가정식과 글로벌 요리에 능숙한 셰프입니다.
입력: 냉장고 사진 + 사용자 선호.
출력: 인식된 재료 + 만들 수 있는 레시피 3~5개.

규칙:
- 알레르기/식단 제한 엄수
- max_prep_minutes 초과 금지
- allow_extra_ingredients=false면 ingredients_extra는 빈 배열
- 한국어 레시피 제목/조리법
- 칼로리는 1인분 기준 합리적 추정

응답 JSON:
{
  "detected_ingredients": ["계란", "양파", ...],
  "recipes": [
    {
      "title": "...",
      "ingredients_used": ["..."],
      "ingredients_extra": ["..."],
      "steps": ["1. ...", "2. ..."],
      "prep_minutes": 15,
      "calories_per_serving": 450,
      "difficulty": "easy"
    }
  ]
}

JSON 외 출력 금지.`;

export async function planMeals(
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp",
  preference: Preference,
  client?: Anthropic
): Promise<MealPlanResult> {
  const pref = PreferenceSchema.parse(preference);
  const anthropic =
    client ??
    new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "placeholder-key" });

  const userMsg = `사용자 선호: ${JSON.stringify(pref)}`;

  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 3072,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMediaType,
              data: imageBase64,
            },
          },
          { type: "text", text: userMsg },
        ],
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text response");
  return MealPlanResultSchema.parse(JSON.parse(block.text));
}

export function buildShoppingList(plan: MealPlanResult): string[] {
  const set = new Set<string>();
  for (const r of plan.recipes) for (const x of r.ingredients_extra) set.add(x);
  return Array.from(set).sort();
}
