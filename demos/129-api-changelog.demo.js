import { diffSpecs } from "../ideas/129-api-changelog/src/diff.js";
import { classifyAll, suggestBump } from "../ideas/129-api-changelog/src/classify.js";
import { toChangelog } from "../ideas/129-api-changelog/src/changelog.js";

const OLD_SPEC = JSON.stringify(
  {
    openapi: "3.0.0",
    info: { title: "Demo API", version: "1.0.0" },
    paths: {
      "/users": {
        get: {
          parameters: [{ name: "page", in: "query", required: false }],
          responses: { 200: {}, 400: {} },
        },
        post: {
          parameters: [{ name: "body", in: "body", required: true }],
          responses: { 201: {} },
        },
      },
      "/legacy": { get: { responses: { 200: {} } } },
    },
  },
  null,
  2
);

const NEW_SPEC = JSON.stringify(
  {
    openapi: "3.0.0",
    info: { title: "Demo API", version: "2.0.0" },
    paths: {
      "/users": {
        get: {
          parameters: [
            { name: "page", in: "query", required: true },
            { name: "limit", in: "query", required: false },
          ],
          responses: { 400: {}, 500: {} },
        },
        post: {
          parameters: [{ name: "body", in: "body", required: true }],
          responses: { 201: {} },
        },
      },
      "/reports": { get: { responses: { 200: {} } } },
    },
  },
  null,
  2
);

window.__DEMO_SPEC__ = {
  description:
    "두 OpenAPI 스펙(이전/이후)을 비교해 변경 사항을 breaking / 호환 / 참고로 분류하고, 권장 semver 버전 변경을 제안합니다.",
  fields: [
    { name: "oldSpec", type: "textarea", label: "이전 OpenAPI (JSON)", rows: 12, default: OLD_SPEC },
    { name: "newSpec", type: "textarea", label: "이후 OpenAPI (JSON)", rows: 12, default: NEW_SPEC },
  ],
  run(v) {
    let oldSpec, newSpec;
    try {
      oldSpec = JSON.parse(v.oldSpec);
      newSpec = JSON.parse(v.newSpec);
    } catch (e) {
      return [{ label: "오류", type: "error", value: "JSON 파싱 실패: " + e.message }];
    }

    const changes = diffSpecs(oldSpec, newSpec);
    const result = classifyAll(changes);
    const bump = suggestBump(result);
    const toneByBump = { major: "bad", minor: "warn", patch: "good" };

    const out = [
      {
        label: "권장 버전 변경",
        type: "badge",
        value: bump.toUpperCase(),
        tone: toneByBump[bump] || "neutral",
      },
      {
        label: "Breaking 변경",
        type: "badge",
        value: `${result.buckets.breaking.length}건`,
        tone: result.hasBreaking ? "bad" : "good",
      },
    ];
    const fmt = (c) => `${c.method ? c.method.toUpperCase() + " " : ""}${c.path}: ${c.detail}`;
    if (result.buckets.breaking.length)
      out.push({ label: "⚠️ Breaking", type: "list", value: result.buckets.breaking.map(fmt) });
    if (result.buckets["non-breaking"].length)
      out.push({ label: "✨ 호환 변경", type: "list", value: result.buckets["non-breaking"].map(fmt) });
    if (result.buckets.info.length)
      out.push({ label: "ℹ️ 참고", type: "list", value: result.buckets.info.map(fmt) });
    if (!result.annotated.length)
      out.push({ label: "변경 사항", type: "text", value: "변경 사항 없음" });
    out.push({ label: "변경 로그 (Markdown)", type: "code", value: toChangelog(result) });
    return out;
  },
};
