import { generateChangelog, parseChange } from "../ideas/117-changelog-from-pr/src/lib/changelog.ts";

window.__DEMO_SPEC__ = {
  description: "커밋/PR 제목(한 줄에 하나)을 Conventional Commits 규칙으로 분류해 그룹화된 체인지로그 마크다운을 생성합니다.",
  fields: [
    {
      name: "titles",
      type: "textarea",
      label: "커밋 / PR 제목 (줄당 1개)",
      rows: 9,
      default: [
        "feat(auth): 소셜 로그인 추가 (#142)",
        "fix(api): 토큰 갱신 시 500 오류 수정 (#145)",
        "feat!: 응답 포맷을 JSON으로 변경",
        "perf(db): 인덱스 추가로 조회 속도 개선",
        "docs: README 설치 가이드 보강",
        "refactor: 라우터 모듈 정리",
        "chore: 의존성 버전 업데이트",
        "주말 핫픽스 배포",
      ].join("\n"),
    },
    { name: "version", type: "text", label: "버전", default: "1.4.0" },
  ],
  run(v) {
    const titles = (v.titles || "").split("\n");
    const md = generateChangelog(titles, { version: v.version || "Unreleased", date: "2026-05-21" });
    const breaking = titles.map((t) => t.trim()).filter(Boolean).map(parseChange).filter((c) => c.breaking);
    return [
      {
        label: "BREAKING 변경",
        type: "badge",
        value: breaking.length ? `${breaking.length}건` : "없음",
        tone: breaking.length ? "bad" : "good",
      },
      { label: "체인지로그 (Markdown)", type: "code", value: md },
    ];
  },
};
