export interface Target {
  os: 'darwin' | 'linux' | 'windows';
  arch: 'amd64' | 'arm64' | 'i386';
}

export interface Asset {
  name: string;
  url: string;
}

const OS_ALIASES: Record<Target['os'], string[]> = {
  darwin: ['darwin', 'macos', 'osx', 'apple'],
  linux: ['linux'],
  windows: ['windows', 'win32', 'win64', 'win'],
};

const ARCH_ALIASES: Record<Target['arch'], string[]> = {
  amd64: ['amd64', 'x86_64', 'x64'],
  arm64: ['arm64', 'aarch64'],
  i386: ['i386', 'x86', '386'],
};

export function detectTarget(): Target {
  const plat = process.platform;
  const arch = process.arch;
  const os: Target['os'] =
    plat === 'darwin' ? 'darwin' : plat === 'win32' ? 'windows' : 'linux';
  const a: Target['arch'] =
    arch === 'arm64' ? 'arm64' : arch === 'ia32' ? 'i386' : 'amd64';
  return { os, arch: a };
}

function lc(s: string): string {
  return s.toLowerCase();
}

export function scoreAsset(name: string, target: Target): number {
  const lower = lc(name);
  let score = 0;
  if (OS_ALIASES[target.os].some((k) => lower.includes(k))) score += 10;
  if (ARCH_ALIASES[target.arch].some((k) => lower.includes(k))) score += 5;
  // Negative signals
  for (const o of Object.keys(OS_ALIASES) as Target['os'][]) {
    if (o !== target.os && OS_ALIASES[o].some((k) => lower.includes(k))) score -= 8;
  }
  for (const a of Object.keys(ARCH_ALIASES) as Target['arch'][]) {
    if (a !== target.arch && ARCH_ALIASES[a].some((k) => lower.includes(k))) score -= 4;
  }
  if (lower.includes('musl')) score += 1; // mild preference
  if (lower.endsWith('.sha256') || lower.endsWith('.sig') || lower.endsWith('.asc')) score = -100;
  return score;
}

export function selectAsset(assets: Asset[], target: Target): Asset | null {
  let best: Asset | null = null;
  let bestScore = -Infinity;
  for (const a of assets) {
    const s = scoreAsset(a.name, target);
    if (s > bestScore) {
      best = a;
      bestScore = s;
    }
  }
  return bestScore > 0 ? best : null;
}
