import { describe, it, expect, vi } from "vitest";
import {
  chat,
  estimateLevel,
  TutorResponseSchema,
} from "../src/tutor";

describe("estimateLevel", () => {
  it("returns A1 for very short input", () => {
    expect(estimateLevel(["hi"])).toBe("A1");
  });

  it("returns higher level for varied vocabulary", () => {
    const longVaried = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const level = estimateLevel([longVaried]);
    expect(["B2", "C1"]).toContain(level);
  });
});

describe("TutorResponseSchema", () => {
  it("accepts well-formed response", () => {
    const ok = TutorResponseSchema.parse({
      reply: "That's interesting!",
      corrections: [
        { original: "I goed", corrected: "I went", explanation: "go의 과거형" },
      ],
      new_vocabulary: [
        { word: "interesting", meaning: "흥미로운", example: "It is interesting." },
      ],
    });
    expect(ok.corrections).toHaveLength(1);
  });

  it("rejects missing reply", () => {
    expect(() =>
      TutorResponseSchema.parse({
        corrections: [],
        new_vocabulary: [],
      })
    ).toThrow();
  });
});

describe("chat", () => {
  it("includes history and calls Claude", async () => {
    const fake = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                reply: "Nice to meet you!",
                corrections: [],
                new_vocabulary: [
                  { word: "meet", meaning: "만나다", example: "Let's meet." },
                ],
              }),
            },
          ],
        }),
      },
    } as any;
    const result = await chat(
      [{ role: "assistant", content: "Hello!" }],
      "Hi I am Jisoo",
      "English",
      "A2",
      fake
    );
    expect(result.reply).toContain("meet");
    const call = fake.messages.create.mock.calls[0][0];
    expect(call.messages.length).toBe(2); // history + new user
    expect(call.system).toContain("English");
  });
});
