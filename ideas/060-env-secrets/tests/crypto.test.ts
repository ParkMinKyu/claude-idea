import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  encryptFor,
  decryptFor,
  parseDotenv,
  serializeDotenv,
} from '../src/lib/crypto';

describe('e2e encryption', () => {
  it('round-trips a message between two keypairs', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const box = await encryptFor('hello bob', bob.publicKey, alice.privateKey, alice.publicKey);
    const plain = await decryptFor(box, bob.privateKey);
    expect(plain).toBe('hello bob');
  });

  it('fails to decrypt with wrong recipient key', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();
    const eve = await generateKeyPair();
    const box = await encryptFor('secret', bob.publicKey, alice.privateKey, alice.publicKey);
    await expect(decryptFor(box, eve.privateKey)).rejects.toThrow();
  });
});

describe('dotenv parsing', () => {
  it('parses standard key=value lines, ignoring comments', () => {
    const env = parseDotenv('# comment\nFOO=bar\nBAZ="hello world"\n');
    expect(env).toEqual({ FOO: 'bar', BAZ: 'hello world' });
  });

  it('round-trips through serialize', () => {
    const env = { A: '1', B: 'two words' };
    const reparsed = parseDotenv(serializeDotenv(env));
    expect(reparsed).toEqual(env);
  });
});
