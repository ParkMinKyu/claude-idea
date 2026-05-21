import { parseLog } from "../ideas/112-log-viewer/src/lib/parser.ts";
import { filterLogs } from "../ideas/112-log-viewer/src/lib/filter.ts";

const SAMPLE_LOGS = `2024-01-02T10:00:00Z INFO server started port=8080
2024-01-02T10:00:05Z DEBUG cache warm user=alice
2024-01-02T10:01:12Z WARN slow query duration=812 user=bob
{"ts":"2024-01-02T10:02:00Z","level":"error","msg":"db timeout","user":"alice","retries":3}
2024-01-02T10:03:30Z INFO healthcheck ok
2024-01-02T10:04:00Z ERROR payment failed user=carol amount=42`;

window.__DEMO_SPEC__ = {
  description:
    "로그 라인(텍스트/JSON 혼합)을 파싱하고 필터 DSL로 검색합니다. 예: level>=warn, level:error, user=alice, -healthcheck, 자유 텍스트.",
  fields: [
    { name: "logs", type: "textarea", label: "로그 라인", rows: 10, default: SAMPLE_LOGS },
    { name: "query", type: "text", label: "필터 식", default: "level>=warn -healthcheck" },
  ],
  run(v) {
    const entries = parseLog(v.logs || "");
    const filtered = filterLogs(entries, v.query || "");
    const fmt = (e) =>
      `${e.ts ?? ""} ${e.level ? "[" + e.level.toUpperCase() + "]" : ""} ${e.message}`.trim();
    return [
      {
        label: "매칭",
        type: "badge",
        value: `${filtered.length} / ${entries.length} 줄`,
        tone: filtered.length ? "good" : "warn",
      },
      {
        label: "필터 결과",
        type: "list",
        value: filtered.length ? filtered.map(fmt) : ["(일치하는 로그 없음)"],
      },
      { label: "파싱된 엔트리", type: "json", value: filtered },
    ];
  },
};
