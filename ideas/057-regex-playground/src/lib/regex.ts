export interface Match {
  index: number;
  length: number;
  value: string;
  groups: string[];
}

export interface TestResult {
  valid: boolean;
  matches: Match[];
  error?: string;
}

export function testPattern(pattern: string, flags: string, input: string): TestResult {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
  } catch (e) {
    return { valid: false, matches: [], error: (e as Error).message };
  }
  const matches: Match[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(input)) !== null && guard < 10_000) {
    matches.push({
      index: m.index,
      length: m[0].length,
      value: m[0],
      groups: m.slice(1).map((g) => g ?? ''),
    });
    if (m[0].length === 0) re.lastIndex += 1; // zero-width safety
    guard += 1;
  }
  return { valid: true, matches };
}

/** Naive translator: convert JS-flavor patterns to a Python-compatible string. */
export function toPython(pattern: string, flags: string): string {
  const pyFlags: string[] = [];
  if (flags.includes('i')) pyFlags.push('re.IGNORECASE');
  if (flags.includes('m')) pyFlags.push('re.MULTILINE');
  if (flags.includes('s')) pyFlags.push('re.DOTALL');
  const flagArg = pyFlags.length ? `, ${pyFlags.join(' | ')}` : '';
  const escaped = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `import re\npattern = re.compile(r"${pattern.replace(/"/g, '\\"')}"${flagArg})\n# escaped: "${escaped}"`;
}
