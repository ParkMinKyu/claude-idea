import { labelDiff } from "../ideas/140-pr-size-labeler/src/labeler.js";

const DEFAULT_DIFF = `diff --git a/src/app.js b/src/app.js
index 1111111..2222222 100644
--- a/src/app.js
+++ b/src/app.js
@@ -1,4 +1,7 @@
 import { init } from "./init.js";
+import { router } from "./router.js";
+
+router.start();
 init();
-console.log("old");
+console.log("new");
diff --git a/src/router.js b/src/router.js
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/router.js
@@ -0,0 +1,5 @@
+export const router = {
+  start() {
+    /* ... */
+  },
+};
diff --git a/package-lock.json b/package-lock.json
index 4444444..5555555 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,3 +1,40 @@
+lots of generated lock changes...
+line
+line`;

const LABEL_TONE = {
  "size/XS": "good",
  "size/S": "good",
  "size/M": "warn",
  "size/L": "warn",
  "size/XL": "bad",
  "size/XXL": "bad",
};

window.__DEMO_SPEC__ = {
  description:
    "git unified diff를 파싱해 추가/삭제 라인을 집계하고 PR 크기 라벨(size/XS~XXL)을 결정합니다. lockfile 등 생성 파일은 유효 라인에서 제외됩니다.",
  fields: [
    { name: "diff", type: "textarea", label: "Unified diff (git diff 출력)", rows: 16, default: DEFAULT_DIFF },
    { name: "warnOver", type: "number", label: "분할 권고 임계치 (유효 라인)", default: 500 },
  ],
  run(v) {
    const warnOver = Number(v.warnOver) || 500;
    const res = labelDiff(String(v.diff ?? ""), { warnOver });
    const s = res.stats;
    return [
      {
        label: "크기 라벨",
        type: "badge",
        value: res.label,
        tone: LABEL_TONE[res.label] || "neutral",
      },
      {
        label: "분할 권고",
        type: "badge",
        value: res.needsReviewSplit ? "PR 분할 권장" : "적정 크기",
        tone: res.needsReviewSplit ? "warn" : "good",
      },
      {
        label: "통계",
        type: "json",
        value: {
          files: s.files,
          additions: s.additions,
          deletions: s.deletions,
          total: s.total,
          effective: s.effective,
          ignored: s.ignored,
        },
      },
      {
        label: "요약",
        type: "text",
        value: `파일 ${s.files}개 · +${s.additions} / -${s.deletions} · 유효 변경 ${s.effective}줄 (무시 ${s.ignored}줄)`,
      },
    ];
  },
};
