import { describe, it, expect } from 'vitest';
import { selectAsset, scoreAsset } from '../src/match';

describe('selectAsset', () => {
  const assets = [
    { name: 'foo-darwin-arm64.tar.gz', url: 'u1' },
    { name: 'foo-darwin-amd64.tar.gz', url: 'u2' },
    { name: 'foo-linux-amd64.tar.gz', url: 'u3' },
    { name: 'foo-linux-arm64.tar.gz', url: 'u4' },
    { name: 'foo-windows-amd64.zip', url: 'u5' },
    { name: 'SHA256SUMS', url: 'u6' },
  ];

  it('picks darwin/arm64 correctly', () => {
    expect(selectAsset(assets, { os: 'darwin', arch: 'arm64' })?.url).toBe('u1');
  });

  it('picks linux/amd64 correctly', () => {
    expect(selectAsset(assets, { os: 'linux', arch: 'amd64' })?.url).toBe('u3');
  });

  it('picks windows/amd64 correctly', () => {
    expect(selectAsset(assets, { os: 'windows', arch: 'amd64' })?.url).toBe('u5');
  });

  it('never returns a SHA256SUMS-style file', () => {
    expect(scoreAsset('SHA256SUMS', { os: 'linux', arch: 'amd64' })).toBeLessThan(0);
  });

  it('returns null when no asset has positive score', () => {
    expect(selectAsset([{ name: 'random.txt', url: 'x' }], { os: 'darwin', arch: 'arm64' })).toBeNull();
  });
});
