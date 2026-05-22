// git-stats 코어 집계 로직 테스트. 의존성 0 — `node --test tests/`로 실행.
// IO 함수(loadCommits/listBranches/listTrackedFiles)는 git/FS가 필요해 제외하고,
// 순수 함수만 고정 fixture로 결정적 검증한다.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGitLog, byContributor, hotspots, busFactor, heatmap,
  activityByMonth, contributorSpans, fileOwnership, staleFiles,
  coupling, couplingForFile, fileTree,
  sizeDistribution, messageConvention, languageDistribution, kstParts,
} from '../lib/core.mjs';

// ── fixtures ──
// 시간: KST(UTC+9) 변환 검증용으로 UTC 시각을 의도적으로 선택.
const commits = [
  { hash: 'a1', author: 'Alice', email: 'a@x', date: '2026-05-01T10:00:00Z', subject: 'feat: init', filesChanged: ['src/app.ts', 'src/util.ts'], additions: 30, deletions: 2 },
  { hash: 'b2', author: 'alice2', email: 'A@X', date: '2026-05-02T11:00:00Z', subject: 'fix: bug', filesChanged: ['src/app.ts'], additions: 4, deletions: 1 },
  { hash: 'c3', author: 'Bob', email: 'b@y', date: '2026-04-18T18:00:00Z', subject: 'docs: readme', filesChanged: ['README.md', 'src/util.ts'], additions: 8, deletions: 0 },
  { hash: 'd4', author: 'Bob', email: 'b@y', date: '2026-04-20T02:00:00Z', subject: 'chore stuff', filesChanged: ['src/app.ts', 'src/util.ts', 'README.md'], additions: 1, deletions: 1 },
];

// ── parseGitLog ──
test('parseGitLog: COMMIT 구분 · numstat 합산 · 바이너리 · 탭 경로 · 빈 입력', () => {
  const raw = [
    'COMMIT\x1fabc\x1fAlice\x1fa@x\x1f2026-05-01T10:00:00+00:00\x1ffeat: x',
    '10\t1\tsrc/a.ts',
    '5\t0\tsrc/b.ts',
    '-\t-\timg/logo.png',           // 바이너리 → 0 라인, 파일은 카운트
    '',
    'COMMIT\x1fdef\x1fBob\x1fb@y\x1f2026-05-02T00:00:00+00:00\x1ffix',
    '1\t0\tweird\twith\ttab.ts',     // 경로에 탭 포함
  ].join('\n');
  const cs = parseGitLog(raw);
  assert.equal(cs.length, 2);
  assert.equal(cs[0].hash, 'abc');
  assert.equal(cs[0].subject, 'feat: x');
  assert.deepEqual(cs[0].filesChanged, ['src/a.ts', 'src/b.ts', 'img/logo.png']);
  assert.equal(cs[0].additions, 15);
  assert.equal(cs[0].deletions, 1);
  assert.deepEqual(cs[1].filesChanged, ['weird\twith\ttab.ts']);
  assert.deepEqual(parseGitLog(''), []);
});

// ── kstParts ──
test('kstParts: UTC→KST(+9) 요일/시간', () => {
  // 2026-05-01T10:00:00Z = KST 금 19시 (UTC 금=5)
  assert.deepEqual(kstParts('2026-05-01T10:00:00Z'), { day: 5, hour: 19 });
  // 2026-04-20T02:00:00Z = KST 월 11시
  assert.deepEqual(kstParts('2026-04-20T02:00:00Z'), { day: 1, hour: 11 });
});

// ── byContributor ──
test('byContributor: 이메일 대소문자 병합 · 집계 · first/last · topFile · heatmap', () => {
  const cs = byContributor(commits);
  assert.equal(cs.length, 2); // a@x(=A@X 병합) + b@y
  const alice = cs.find((c) => c.email.toLowerCase() === 'a@x');
  assert.equal(alice.commits, 2);
  assert.equal(alice.additions, 34);
  assert.equal(alice.deletions, 3);
  assert.equal(alice.firstCommit, '2026-05-01T10:00:00Z');
  assert.equal(alice.lastCommit, '2026-05-02T11:00:00Z');
  assert.equal(alice.topFile, 'src/app.ts'); // 2회로 최다
  assert.equal(alice.topFileCount, 2);
  assert.equal(alice.heatmap.length, 7);
  assert.equal(alice.heatmap[0].length, 24);
  assert.equal(alice.heatmap[5][19], 1); // a1: KST 금 19시
});

test('byContributor: 커밋 수 내림차순 정렬', () => {
  const cs = byContributor(commits);
  for (let i = 1; i < cs.length; i++) assert.ok(cs[i - 1].commits >= cs[i].commits);
});

// ── hotspots ──
test('hotspots: 변경 빈도 내림차순 · top 제한', () => {
  const h = hotspots(commits, 2);
  assert.equal(h.length, 2);
  assert.equal(h[0].file, 'src/app.ts'); // 3회
  assert.equal(h[0].touches, 3);
});

// ── busFactor ──
test('busFactor: 이메일 기준 · 빈 입력 0', () => {
  assert.equal(busFactor([]), 0);
  assert.ok(busFactor(commits) >= 1);
  // 한 사람만 → 1
  const solo = [{ author: 'A', email: 'a@x', date: '2026-01-01T00:00:00Z', filesChanged: ['x'] }];
  assert.equal(busFactor(solo), 1);
});

// ── heatmap ──
test('heatmap: 7×24 그리드 · KST 반영', () => {
  const g = heatmap(commits);
  assert.equal(g.length, 7);
  assert.equal(g[0].length, 24);
  assert.equal(g[5][19], 1); // a1
});

// ── activityByMonth ──
test('activityByMonth: 월별 집계 · 오름차순', () => {
  const m = activityByMonth(commits);
  assert.deepEqual(m.map((x) => x.month), ['2026-04', '2026-05']);
  assert.equal(m[0].commits, 2); // 4월: c3, d4
  assert.equal(m[1].commits, 2); // 5월: a1, b2
});

// ── contributorSpans ──
test('contributorSpans: first~last · 첫 커밋 순', () => {
  const s = contributorSpans(commits);
  assert.equal(s.length, 2);
  // Bob의 첫 커밋(4-18)이 Alice(5-1)보다 빠름
  assert.equal(s[0].email, 'b@y');
  assert.equal(s[0].first, '2026-04-18T18:00:00Z');
  assert.equal(s[0].last, '2026-04-20T02:00:00Z');
});

// ── fileOwnership ──
test('fileOwnership: 단독 소유 우선 · alive 표시', () => {
  // README.md: Bob만 → 단독 소유. src/app.ts/util.ts: Alice+Bob.
  const tracked = new Set(['src/app.ts', 'README.md']); // util.ts는 삭제됨
  const rows = fileOwnership(commits, 10, tracked);
  const solo = rows.filter((r) => r.authors === 1);
  assert.ok(solo.some((r) => r.file === 'README.md'));
  const util = rows.find((r) => r.file === 'src/util.ts');
  assert.equal(util.alive, false);
  const app = rows.find((r) => r.file === 'src/app.ts');
  assert.equal(app.alive, true);
  assert.equal(app.authors, 2);
});

// ── staleFiles ──
test('staleFiles: 현존 파일 중 오래된 순 · tracked 없으면 빈', () => {
  assert.deepEqual(staleFiles(commits, null), []);
  const tracked = new Set(['src/app.ts', 'README.md']);
  const s = staleFiles(commits, tracked, 10);
  // README 마지막 변경(4-20)이 app.ts 마지막(5-2)보다 오래됨 → 먼저
  assert.equal(s[0].file, 'README.md');
});

// ── coupling ──
test('coupling: 강도=together/min · score 정렬 · 임계', () => {
  const pairs = coupling(commits, { top: 10, minTogether: 1 });
  assert.ok(pairs.length > 0);
  // app.ts↔util.ts: 함께 2회(a1,d4). util 총3, app 총3 → 강도 2/3.
  const au = pairs.find((p) => [p.a, p.b].sort().join() === ['src/app.ts', 'src/util.ts'].join());
  assert.equal(au.together, 2);
  assert.ok(Math.abs(au.strength - 2 / 3) < 1e-9);
  // score 내림차순
  for (let i = 1; i < pairs.length; i++) assert.ok(pairs[i - 1].score >= pairs[i].score);
  // minTogether 필터: 3 이상이면 거의 다 걸러짐
  assert.ok(coupling(commits, { minTogether: 99 }).length === 0);
});

// ── couplingForFile ──
test('couplingForFile: 한 파일 기준 연관 · 강도순', () => {
  const r = couplingForFile(commits, 'src/app.ts');
  assert.equal(r.file, 'src/app.ts');
  assert.equal(r.totalChanges, 3); // a1,b2,d4
  const util = r.partners.find((p) => p.file === 'src/util.ts');
  assert.equal(util.together, 2); // a1,d4
  // 강도 내림차순
  for (let i = 1; i < r.partners.length; i++) assert.ok(r.partners[i - 1].strength >= r.partners[i].strength);
});

// ── fileTree ──
test('fileTree: 결합 있는 파일만 · 폴더 구조 · 변경횟수', () => {
  const t = fileTree(commits);
  assert.ok(t.fileCount >= 3); // app, util, README 모두 결합 있음
  // src 폴더 노드 존재
  const src = t.root.children.find((n) => n.name === 'src' && n.children);
  assert.ok(src, 'src 폴더 노드');
  const appNode = src.children.find((n) => n.file === 'src/app.ts');
  assert.equal(appNode.hot, 3);
});

test('fileTree: 단독 변경만 있는 파일은 제외', () => {
  const only = [
    { author: 'A', email: 'a@x', date: '2026-01-01T00:00:00Z', filesChanged: ['solo.ts'] }, // 단독
    { author: 'A', email: 'a@x', date: '2026-01-02T00:00:00Z', filesChanged: ['x.ts', 'y.ts'] },
  ];
  const t = fileTree(only);
  const files = [];
  const walk = (n) => { if (n.file) files.push(n.file); (n.children || []).forEach(walk); };
  walk(t.root);
  assert.ok(!files.includes('solo.ts'));
  assert.ok(files.includes('x.ts') && files.includes('y.ts'));
});

// ── sizeDistribution ──
test('sizeDistribution: 라인 버킷', () => {
  const b = sizeDistribution(commits);
  const total = b.reduce((s, x) => s + x.count, 0);
  assert.equal(total, commits.length);
  // a1: 32라인 → 11–50 버킷
  assert.ok(b.find((x) => x.label === '11–50').count >= 1);
});

// ── messageConvention ──
test('messageConvention: prefix 인식 · 비율', () => {
  const c = messageConvention(commits);
  // feat/fix/docs 3개 인식, chore stuff(콜론 없음)는 제외
  assert.equal(c.conforming, 3);
  assert.equal(c.total, 4);
  assert.ok(Math.abs(c.rate - 0.75) < 1e-9);
  assert.ok(c.types.some((t) => t.type === 'feat'));
});

// ── languageDistribution ──
test('languageDistribution: 확장자 비율', () => {
  const l = languageDistribution(commits, 5);
  const ts = l.top.find((x) => x.ext === 'ts');
  const md = l.top.find((x) => x.ext === 'md');
  assert.ok(ts.count > md.count); // ts가 더 많이 변경
  assert.ok(ts.share > 0 && ts.share <= 1);
});
