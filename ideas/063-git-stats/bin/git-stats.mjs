#!/usr/bin/env node
// git-stats CLI — 로컬 git 저장소 기여 통계 분석기.
// 의존성 0. 시스템 `git` CLI만 필요.
// 설치: `npm install -g .` (이 폴더에서) → 어디서든 `git-stats` 실행.
//
// 분석/렌더 로직은 lib/core.mjs · lib/render.mjs 에 공유. 서버는 bin/serve.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadCommits, buildResult, byContributor } from '../lib/core.mjs';
import { renderHtml } from '../lib/render.mjs';
import { startServer } from './serve.mjs';

const HELP = `git-stats — 로컬 git 저장소 기여 통계 분석기

사용법:
  git-stats                      현재 폴더 분석 → HTML 생성 → 브라우저 열기
  git-stats [repo-path]          다른 폴더 분석
  git-stats serve                로컬 분석 서버 실행 (브라우저에서 폴더 고르고 분석)

옵션:
  --since=YYYY-MM-DD    이 날짜 이후 커밋만
  --until=YYYY-MM-DD    이 날짜 이전 커밋만
  --branch=<name>       특정 브랜치 (기본: 현재 체크아웃된 HEAD)
  --all                 모든 브랜치 + 태그 합산 분석
  --include-merges      머지 커밋 포함 (기본: 제외)
  --top=<n>             핫스팟 상위 N개 (기본: 20)
  --json                HTML 대신 JSON 출력 (stdout)
  --pretty              JSON 들여쓰기 (--json과 함께)
  --out=<file>          출력 파일명 (기본: git-stats-report.html)
  --no-open             생성 후 브라우저 자동 열기 비활성화

serve 전용 옵션:
  --port=<n>            서버 포트 (기본: 7373)
  --host=<addr>         바인드 주소 (기본: 127.0.0.1)

예시:
  git-stats                                # 현재 폴더, HTML, 자동 열기
  git-stats ~/myrepo --since=2025-01-01
  git-stats . --json > stats.json          # JSON 파일로 저장
  git-stats serve                          # 서버 + 폴더 선택 UI
`;

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      flags[k] = v ?? true;
    } else positional.push(a);
  }
  // `git-stats analyze <path>` 하위 호환.
  let cmd = '';
  let repo;
  if (positional[0] === 'serve') {
    cmd = 'serve';
  } else if (positional[0] === 'analyze') {
    repo = positional[1];
  } else {
    repo = positional[0];
  }
  return { cmd, repo, flags };
}

function openInBrowser(file) {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', file] : [file];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function strFlag(v) {
  return typeof v === 'string' ? v : undefined;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.help) {
    console.log(HELP);
    process.exit(0);
  }

  // ── serve: 로컬 분석 서버 ──
  if (args.cmd === 'serve') {
    startServer({
      port: args.flags.port ? parseInt(args.flags.port, 10) : undefined,
      host: strFlag(args.flags.host),
      open: !args.flags['no-open'],
    });
    return; // 서버는 계속 떠 있음
  }

  // ── 단발 분석 (CLI) ──
  const repo = path.resolve(args.repo ?? '.');
  if (!fs.existsSync(path.join(repo, '.git'))) {
    console.error(`Error: '${repo}' 에 .git 폴더가 없습니다.`);
    console.error(`사용: git-stats [저장소-경로]   (인수 없으면 현재 폴더 분석)`);
    console.error(`      git-stats serve            (브라우저에서 폴더 선택)`);
    process.exit(1);
  }

  const commits = loadCommits(repo, {
    since: strFlag(args.flags.since),
    until: strFlag(args.flags.until),
    branch: strFlag(args.flags.branch),
    all: !!args.flags.all,
    includeMerges: !!args.flags['include-merges'],
  });

  if (commits.length === 0) {
    console.error('분석할 커밋이 없습니다.');
    process.exit(1);
  }

  const topN = typeof args.flags.top === 'string' ? parseInt(args.flags.top, 10) : 20;

  if (args.flags.json) {
    const output = JSON.stringify(buildResult(repo, commits, topN), null, args.flags.pretty ? 2 : 0);
    const outPath = strFlag(args.flags.out);
    if (outPath) {
      fs.writeFileSync(outPath, output);
      console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋)`);
    } else {
      process.stdout.write(output + '\n');
    }
    return;
  }

  // 기본: HTML 리포트 저장 + 브라우저 열기
  const outPath = path.resolve(strFlag(args.flags.out) ?? 'git-stats-report.html');
  fs.writeFileSync(outPath, renderHtml(repo, commits, topN));
  console.error(`✓ ${outPath} 생성됨 (${commits.length}개 커밋 · ${byContributor(commits).length}명 기여자)`);

  if (!args.flags['no-open']) {
    console.error(openInBrowser(outPath) ? '  → 브라우저에서 열고 있습니다…' : '  → 더블클릭으로 브라우저에서 열어보세요.');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
