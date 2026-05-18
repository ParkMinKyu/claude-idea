#!/usr/bin/env node
import { parseLocalRepo } from '../lib/parse-local';
import { byContributor, hotspots, busFactor, heatmap } from '../lib/stats';
import { renderHtmlReport } from '../lib/render-html';

const HELP = `git-stats — 로컬 git 저장소 기여 통계 분석기

사용법:
  git-stats analyze <repo-path> [options]
  git-stats --help

옵션:
  --since=YYYY-MM-DD    이 날짜 이후 커밋만
  --until=YYYY-MM-DD    이 날짜 이전 커밋만
  --branch=<name>       특정 브랜치 (기본: 현재 체크아웃된 브랜치)
  --top=<n>             핫스팟 상위 N개 (기본: 20)
  --pretty              JSON을 사람이 읽기 좋게 출력
  --html                JSON 대신 시각화된 HTML 리포트 생성 (브라우저로 열기)
  --out=<file>          파일로 저장 (예: report.html, stats.json)

예시:
  git-stats analyze .
  git-stats analyze ../my-bitbucket-repo --since=2025-01-01 --pretty
  git-stats analyze /path/to/repo --html --out=report.html   # 더블클릭으로 열기
  git-stats analyze /path/to/repo > stats.json               # 대시보드 import
`;

interface Args {
  cmd: string;
  repo?: string;
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      flags[k] = v ?? true;
    } else {
      positional.push(a);
    }
  }
  return { cmd: positional[0] ?? '', repo: positional[1], flags };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.help || args.cmd === '--help' || !args.cmd) {
    console.log(HELP);
    process.exit(args.cmd ? 0 : 1);
  }
  if (args.cmd !== 'analyze') {
    console.error(`알 수 없는 명령: ${args.cmd}\n`);
    console.log(HELP);
    process.exit(1);
  }

  const repo = args.repo ?? '.';
  const commits = await parseLocalRepo(repo, {
    since: typeof args.flags.since === 'string' ? args.flags.since : undefined,
    until: typeof args.flags.until === 'string' ? args.flags.until : undefined,
    branch: typeof args.flags.branch === 'string' ? args.flags.branch : undefined,
  });

  const topN = typeof args.flags.top === 'string' ? parseInt(args.flags.top, 10) : 20;
  const outPath = typeof args.flags.out === 'string' ? args.flags.out : undefined;

  let output: string;
  if (args.flags.html) {
    output = renderHtmlReport(repo, commits, topN);
  } else {
    const result = {
      repo,
      generatedAt: new Date().toISOString(),
      totalCommits: commits.length,
      contributors: byContributor(commits),
      hotspots: hotspots(commits, topN),
      busFactor: busFactor(commits),
      heatmap: heatmap(commits),
    };
    const indent = args.flags.pretty ? 2 : 0;
    output = JSON.stringify(result, null, indent);
  }

  if (outPath) {
    const fs = await import('node:fs');
    fs.writeFileSync(outPath, output);
    console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋 분석)`);
    if (args.flags.html) {
      console.error(`  → 더블클릭으로 브라우저에서 열어보세요.`);
    }
  } else {
    process.stdout.write(output + '\n');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
