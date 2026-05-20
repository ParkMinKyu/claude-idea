// Dockerfile parser: instructions, line numbers, line continuations.
// Pure functions, zero runtime dependencies.

export interface Instruction {
  instruction: string; // uppercased, e.g. FROM, RUN
  args: string;
  line: number; // 1-based line where the instruction begins
  raw: string;
}

const INSTRUCTION_RE = /^\s*([A-Za-z]+)\s+(.*)$/;

export function parseDockerfile(text: string): Instruction[] {
  const lines = text.split('\n');
  const instructions: Instruction[] = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    const lineNo = i + 1;
    const trimmed = line.trim();

    // skip blank lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      i += 1;
      continue;
    }

    // handle line continuations (\)
    let raw = line;
    let combined = line;
    while (combined.trimEnd().endsWith('\\') && i + 1 < lines.length) {
      combined = combined.trimEnd().slice(0, -1) + ' ' + lines[i + 1];
      raw += '\n' + lines[i + 1];
      i += 1;
    }

    const m = INSTRUCTION_RE.exec(combined.trim());
    if (m) {
      instructions.push({
        instruction: m[1].toUpperCase(),
        args: m[2].trim(),
        line: lineNo,
        raw,
      });
    }
    i += 1;
  }
  return instructions;
}
