import { execa } from "execa";

export interface Commit {
  hash: string;
  subject: string;
  author: string;
}

export async function getCommitsBetween(
  fromRef: string,
  toRef: string,
  cwd: string = process.cwd()
): Promise<Commit[]> {
  const { stdout } = await execa(
    "git",
    ["log", `${fromRef}..${toRef}`, "--pretty=format:%H%x09%an%x09%s"],
    { cwd }
  );
  if (!stdout.trim()) return [];
  return stdout.split("\n").map((line) => {
    const [hash, author, subject] = line.split("\t");
    return { hash, author, subject };
  });
}

// 노이즈 커밋 필터
const NOISE_PATTERNS = [
  /^chore(\(.*\))?:/i,
  /^docs(\(.*\))?:/i,
  /^style(\(.*\))?:/i,
  /^test(\(.*\))?:/i,
  /^refactor(\(.*\))?:/i,
  /^Merge (pull request|branch)/,
  /^bump version/i,
];

export function filterNoise(commits: Commit[]): Commit[] {
  return commits.filter((c) => !NOISE_PATTERNS.some((p) => p.test(c.subject)));
}
