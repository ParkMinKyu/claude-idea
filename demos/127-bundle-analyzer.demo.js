import { parseStats, totals } from "../ideas/127-bundle-analyzer/src/parser.js";
import { diffAssets } from "../ideas/127-bundle-analyzer/src/diff.js";
import { assertBundle } from "../ideas/127-bundle-analyzer/src/assert.js";
import { toMarkdown } from "../ideas/127-bundle-analyzer/src/report.js";

const BASELINE = JSON.stringify(
  {
    assets: [
      { name: "main.js", size: 184000, gzipSize: 61000 },
      { name: "vendor.js", size: 320000, gzipSize: 102000 },
      { name: "styles.css", size: 24000, gzipSize: 6000 },
    ],
  },
  null,
  2
);

const CURRENT = JSON.stringify(
  {
    assets: [
      { name: "main.js", size: 231000, gzipSize: 74000 },
      { name: "vendor.js", size: 318000, gzipSize: 101000 },
      { name: "styles.css", size: 24000, gzipSize: 6000 },
      { name: "chart.js", size: 88000, gzipSize: 29000 },
    ],
  },
  null,
  2
);

const CONFIG = JSON.stringify(
  {
    budgets: [{ pattern: "main.js", maxBytes: 200000 }],
    regression: { maxIncreaseBytes: 20000, maxIncreasePct: 0.1 },
  },
  null,
  2
);

window.__DEMO_SPEC__ = {
  description:
    "두 개의 번들 stats.json(기준/현재)을 비교해 자산별 사이즈 증감과 회귀를 계산하고, 버짓 위반을 검사합니다.",
  fields: [
    { name: "baseline", type: "textarea", label: "기준 stats.json", rows: 9, default: BASELINE },
    { name: "current", type: "textarea", label: "현재 stats.json", rows: 9, default: CURRENT },
    { name: "config", type: "textarea", label: "버짓/회귀 설정 JSON", rows: 5, default: CONFIG },
  ],
  run(v) {
    let baseStats, curStats, config;
    try {
      baseStats = JSON.parse(v.baseline);
      curStats = JSON.parse(v.current);
      config = v.config && v.config.trim() ? JSON.parse(v.config) : {};
    } catch (e) {
      return [{ label: "오류", type: "error", value: "JSON 파싱 실패: " + e.message }];
    }

    const baseAssets = parseStats(baseStats);
    const curAssets = parseStats(curStats);
    const diff = diffAssets(baseAssets, curAssets);
    const result = assertBundle(curAssets, diff, config);

    const bt = totals(baseAssets);
    const ct = totals(curAssets);
    const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
    const signed = (n) => `${n >= 0 ? "+" : ""}${(n / 1024).toFixed(1)}KB`;

    return [
      {
        label: "번들 검사",
        type: "badge",
        value: result.passed ? "통과" : `실패 (위반 ${result.violations.length}건)`,
        tone: result.passed ? "good" : "bad",
      },
      {
        label: "전체 합계 증감",
        type: "badge",
        value: `raw ${signed(diff.totalDelta)} / gzip ${signed(diff.totalGzipDelta)}`,
        tone: diff.totalDelta > 0 ? "warn" : "good",
      },
      {
        label: "총 사이즈",
        type: "text",
        value: `기준 ${kb(bt.size)} (gzip ${kb(bt.gzip)}) → 현재 ${kb(ct.size)} (gzip ${kb(ct.gzip)})`,
      },
      {
        label: "자산별 변경",
        type: "json",
        value: diff.assets.filter((a) => a.status !== "unchanged"),
      },
      {
        label: "위반",
        type: "list",
        value: result.violations.length
          ? result.violations.map((x) => x.message)
          : ["위반 없음"],
      },
      { label: "마크다운 리포트", type: "code", value: toMarkdown(result) },
    ];
  },
};
