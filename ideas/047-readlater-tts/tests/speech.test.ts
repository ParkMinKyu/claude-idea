import { describe, it, expect, vi } from "vitest";
import { splitIntoSentences, speak } from "../src/lib/speech";

describe("splitIntoSentences", () => {
  it("splits English sentences", () => {
    expect(splitIntoSentences("Hello world. How are you? Fine!")).toEqual([
      "Hello world.",
      "How are you?",
      "Fine!",
    ]);
  });
  it("splits Korean/Japanese", () => {
    expect(splitIntoSentences("안녕하세요。 반갑습니다!")).toEqual([
      "안녕하세요。",
      "반갑습니다!",
    ]);
  });
  it("filters empty", () => {
    expect(splitIntoSentences("   ")).toEqual([]);
  });
});

describe("speak", () => {
  it("queues utterances via synthesis", () => {
    const speakFn = vi.fn();
    const synth = {
      speak: (u: { onend?: () => void }) => {
        speakFn(u);
      },
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
    } as unknown as SpeechSynthesis;
    // Provide global utterance ctor
    (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
      text: string;
      rate = 1;
      pitch = 1;
      lang = "";
      voice: unknown = null;
      onend: (() => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    };
    const ctl = speak("One. Two.", { rate: 1.5 }, synth);
    expect(speakFn).toHaveBeenCalledTimes(1);
    ctl.stop();
    expect((synth.cancel as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });
});
