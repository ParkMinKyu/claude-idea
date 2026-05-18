export interface SpeechOptions {
  rate?: number; // 0.5..3
  pitch?: number;
  voice?: string;
  lang?: string;
}

export interface SpeechController {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function speak(
  text: string,
  opts: SpeechOptions = {},
  synthesis: SpeechSynthesis = window.speechSynthesis
): SpeechController {
  const sentences = splitIntoSentences(text);
  let idx = 0;
  let stopped = false;

  const playNext = () => {
    if (stopped || idx >= sentences.length) return;
    const u = new SpeechSynthesisUtterance(sentences[idx++]);
    u.rate = Math.min(3, Math.max(0.5, opts.rate ?? 1));
    u.pitch = opts.pitch ?? 1;
    if (opts.lang) u.lang = opts.lang;
    if (opts.voice) {
      const v = synthesis.getVoices().find((vv) => vv.name === opts.voice);
      if (v) u.voice = v;
    }
    u.onend = playNext;
    synthesis.speak(u);
  };
  playNext();

  return {
    pause: () => synthesis.pause(),
    resume: () => synthesis.resume(),
    stop: () => {
      stopped = true;
      synthesis.cancel();
    },
  };
}
