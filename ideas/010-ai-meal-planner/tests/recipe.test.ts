import { describe, it, expect, vi } from "vitest";
import {
  planMeals,
  buildShoppingList,
  PreferenceSchema,
  MealPlanResultSchema,
} from "../src/recipe";

describe("PreferenceSchema", () => {
  it("applies sensible defaults", () => {
    const p = PreferenceSchema.parse({});
    expect(p.diet).toBe("none");
    expect(p.max_prep_minutes).toBe(30);
    expect(p.allow_extra_ingredients).toBe(false);
  });

  it("rejects negative prep time", () => {
    expect(() =>
      PreferenceSchema.parse({ max_prep_minutes: -10 })
    ).toThrow();
  });
});

describe("buildShoppingList", () => {
  it("deduplicates ingredients across recipes", () => {
    const list = buildShoppingList({
      detected_ingredients: ["계란"],
      recipes: [
        {
          title: "r1",
          ingredients_used: ["계란"],
          ingredients_extra: ["우유", "버터"],
          steps: [],
          prep_minutes: 10,
          calories_per_serving: 100,
          difficulty: "easy",
        },
        {
          title: "r2",
          ingredients_used: ["계란"],
          ingredients_extra: ["우유", "치즈"],
          steps: [],
          prep_minutes: 10,
          calories_per_serving: 100,
          difficulty: "easy",
        },
      ],
    });
    expect(list).toEqual(["버터", "우유", "치즈"]);
  });
});

describe("planMeals", () => {
  it("sends image to Claude vision and parses result", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                detected_ingredients: ["계란", "양파", "김치"],
                recipes: [
                  {
                    title: "김치 오믈렛",
                    ingredients_used: ["계란", "양파", "김치"],
                    ingredients_extra: [],
                    steps: ["1. 계란을 푼다", "2. 김치와 양파를 볶는다"],
                    prep_minutes: 10,
                    calories_per_serving: 350,
                    difficulty: "easy",
                  },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await planMeals("ZmFrZQ==", "image/jpeg", {} as any, fake);
    expect(result.detected_ingredients).toContain("김치");
    expect(result.recipes[0].title).toBe("김치 오믈렛");

    const call = fake.messages.create.mock.calls[0][0];
    expect(call.messages[0].content[0].type).toBe("image");
  });
});

describe("MealPlanResultSchema", () => {
  it("rejects bad difficulty", () => {
    expect(() =>
      MealPlanResultSchema.parse({
        detected_ingredients: [],
        recipes: [
          {
            title: "x",
            ingredients_used: [],
            ingredients_extra: [],
            steps: [],
            prep_minutes: 5,
            calories_per_serving: 100,
            difficulty: "extreme",
          },
        ],
      })
    ).toThrow();
  });
});
