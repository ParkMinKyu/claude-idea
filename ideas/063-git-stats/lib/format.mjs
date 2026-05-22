// git-stats 서버측 렌더 공용 포맷 헬퍼 (순수 함수, 의존성 0).
// 주의: 브라우저 clientRuntime은 자기완결이라 이 모듈을 import하지 않고
//       동일 헬퍼를 자체 정의한다(여기 바꾸면 client-runtime.mjs도 함께 확인).

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const CONTRIB_PAGE = 50; // 기여자 카드 1회 렌더 개수 (대형 저장소 DOM 폭발 방지)

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function splitPath(p) {
  const i = p.lastIndexOf('/');
  if (i === -1) return { dir: '', name: p };
  return { dir: p.slice(0, i + 1), name: p.slice(i + 1) };
}

export function fmt(n) { return n.toLocaleString('ko-KR'); }

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}개월 전`;
  return `${Math.floor(diff / 86400 / 365)}년 전`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 55%, 45%)`;
}

export function kstParts(iso) {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}

/** 기여자 정렬 (서버·클라 공용 키). */
export function sortContribs(contribs, key) {
  const fns = {
    commits: (a, b) => b.commits - a.commits,
    lines: (a, b) => (b.additions + b.deletions) - (a.additions + a.deletions),
    files: (a, b) => b.filesTouched - a.filesTouched,
    recent: (a, b) => new Date(b.lastCommit) - new Date(a.lastCommit),
  };
  return [...contribs].sort(fns[key] || fns.commits);
}
