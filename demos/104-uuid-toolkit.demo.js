// 104-uuid-toolkit live demo.
// NOTE: the core module ideas/104-uuid-toolkit/src/index.ts hard-imports node:crypto
// (randomBytes), which esbuild cannot resolve for the browser. Per the demo guidelines
// we reimplement the SAME algorithm here verbatim, swapping the RNG for crypto.getRandomValues.
// (The non-random inspect functions are also copied unchanged so the demo stays self-contained.)

const HEX = "0123456789abcdef";
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // ULID base32

function browserRng(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function bytesToUuid(b) {
  const h = Array.from(b, (x) => HEX[x >> 4] + HEX[x & 15]).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function uuidV4(rng = browserRng) {
  const b = Uint8Array.from(rng(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC variant
  return bytesToUuid(b);
}

function uuidV7(now = Date.now(), rng = browserRng) {
  const b = Uint8Array.from(rng(16));
  b[0] = (now / 2 ** 40) & 0xff;
  b[1] = (now / 2 ** 32) & 0xff;
  b[2] = (now / 2 ** 24) & 0xff;
  b[3] = (now / 2 ** 16) & 0xff;
  b[4] = (now / 2 ** 8) & 0xff;
  b[5] = now & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // RFC variant
  return bytesToUuid(b);
}

function ulid(now = Date.now(), rng = browserRng) {
  let time = "";
  let t = now;
  for (let i = 0; i < 10; i++) {
    time = CROCKFORD[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const rand = rng(10);
  let body = "";
  for (let i = 0; i < 16; i++) {
    body += CROCKFORD[(rand[i % 10] + i * 7) % 32];
  }
  return time + body;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-([89ab])[0-9a-f]{3}-[0-9a-f]{12}$/i;

function inspectUuid(s) {
  const m = UUID_RE.exec(s);
  if (!m) return { valid: false, version: null, variant: null, reason: "not an RFC 4122 UUID" };
  const version = Number(m[1]);
  const info = { valid: true, version, variant: "RFC 4122" };
  if (version === 7) {
    const hex = s.replace(/-/g, "").slice(0, 12);
    info.timestampMs = parseInt(hex, 16);
  }
  return info;
}

const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

function inspectUlid(s) {
  if (!ULID_RE.test(s)) return { valid: false, reason: "not a 26-char Crockford base32 ULID" };
  let ts = 0;
  for (const ch of s.slice(0, 10)) ts = ts * 32 + CROCKFORD.indexOf(ch);
  return { valid: true, timestampMs: ts };
}

window.__DEMO_SPEC__ = {
  description:
    "UUID v4 / UUID v7 / ULID를 브라우저에서 생성하고, 입력한 식별자의 버전·변형·타임스탬프를 분석합니다.",
  fields: [
    {
      name: "kind",
      type: "select",
      label: "생성 종류",
      default: "v4",
      options: [
        { value: "v4", label: "UUID v4 (랜덤)" },
        { value: "v7", label: "UUID v7 (시간순)" },
        { value: "ulid", label: "ULID" },
      ],
    },
    { name: "count", type: "number", label: "생성 개수", default: 5 },
    {
      name: "inspect",
      type: "text",
      label: "분석할 ID (선택)",
      placeholder: "여기에 UUID 또는 ULID를 붙여넣으면 분석합니다",
      default: "",
    },
  ],
  run(v) {
    const count = Math.max(1, Math.min(50, Number(v.count) || 5));
    const gen =
      v.kind === "v7"
        ? () => uuidV7(Date.now(), browserRng)
        : v.kind === "ulid"
        ? () => ulid(Date.now(), browserRng)
        : () => uuidV4(browserRng);
    const generated = Array.from({ length: count }, gen);

    const out = [
      {
        label: `생성된 ${v.kind.toUpperCase()} (${count}개)`,
        type: "list",
        value: generated,
      },
    ];

    const target = (v.inspect || "").trim() || generated[0];
    const info = target.includes("-") ? inspectUuid(target) : inspectUlid(target);
    out.push({
      label: `분석: ${target}`,
      type: "badge",
      value: info.valid ? "유효한 식별자" : info.reason || "유효하지 않음",
      tone: info.valid ? "good" : "bad",
    });
    out.push({ label: "분석 상세", type: "json", value: info });
    return out;
  },
};
