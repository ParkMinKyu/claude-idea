import { diffLines, toUnified, diffStats } from "../ideas/106-diff-as-service/src/myers.js";

window.__DEMO_SPEC__ = {
  description:
    "두 텍스트를 Myers 알고리즘으로 라인 단위 비교하여 통합 diff(unified diff)와 통계를 보여줍니다.",
  fields: [
    {
      name: "oldText",
      type: "textarea",
      label: "이전 텍스트",
      rows: 8,
      default: "사과\n바나나\n체리\n포도",
    },
    {
      name: "newText",
      type: "textarea",
      label: "이후 텍스트",
      rows: 8,
      default: "사과\n블루베리\n체리\n포도\n수박",
    },
  ],
  run(v) {
    const ops = diffLines(v.oldText ?? "", v.newText ?? "");
    const stats = diffStats(ops);
    return [
      {
        label: "통계",
        type: "badge",
        value: `추가 +${stats.insertions} · 삭제 -${stats.deletions} · 유지 ${stats.unchanged}`,
        tone: stats.insertions || stats.deletions ? "warn" : "good",
      },
      { label: "통합 diff", type: "code", value: toUnified(ops) },
      { label: "편집 연산", type: "json", value: ops },
    ];
  },
};
