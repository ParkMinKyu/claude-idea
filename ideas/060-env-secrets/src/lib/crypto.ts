// The libsodium-wrappers ESM build ships a broken import graph in some
// versions, so we deliberately load the CommonJS build via createRequire.
// This works identically in Node ESM, CJS, and bundlers that follow the
// "require" export condition.
import { createRequire } from 'node:module';
const requireCjs = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium: typeof import('libsodium-wrappers') = requireCjs('libsodium-wrappers');

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SealedBox {
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  recipientPub: Uint8Array;
  senderPub: Uint8Array;
}

let ready = false;
export async function init(): Promise<void> {
  if (!ready) {
    await sodium.ready;
    ready = true;
  }
}

export async function generateKeyPair(): Promise<KeyPair> {
  await init();
  const kp = sodium.crypto_box_keypair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

export async function encryptFor(
  plaintext: string,
  recipientPub: Uint8Array,
  senderPriv: Uint8Array,
  senderPub: Uint8Array
): Promise<SealedBox> {
  await init();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(
    sodium.from_string(plaintext),
    nonce,
    recipientPub,
    senderPriv
  );
  return { nonce, ciphertext, recipientPub, senderPub };
}

export async function decryptFor(
  box: SealedBox,
  recipientPriv: Uint8Array
): Promise<string> {
  await init();
  const plain = sodium.crypto_box_open_easy(
    box.ciphertext,
    box.nonce,
    box.senderPub,
    recipientPriv
  );
  return sodium.to_string(plain);
}

export function parseDotenv(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function serializeDotenv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${/\s|=|"/.test(v) ? JSON.stringify(v) : v}`)
    .join('\n');
}
