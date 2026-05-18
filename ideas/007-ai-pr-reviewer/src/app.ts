import type { Probot } from "probot";
import { reviewPR, type DiffFile } from "./reviewer.js";

export default (app: Probot) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;
    const { data: files } = await context.octokit.pulls.listFiles({
      ...context.repo(),
      pull_number: pr.number,
    });

    const diffFiles: DiffFile[] = files
      .filter((f) => f.patch)
      .map((f) => ({ path: f.filename, patch: f.patch! }));

    if (diffFiles.length === 0) return;

    const result = await reviewPR(diffFiles);

    // 본문 요약 코멘트
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: pr.number,
      body: `## AI Review (${result.verdict})\n\n${result.summary}`,
    });

    // 인라인 코멘트
    for (const c of result.comments) {
      try {
        await context.octokit.pulls.createReviewComment({
          ...context.repo(),
          pull_number: pr.number,
          commit_id: pr.head.sha,
          path: c.path,
          line: c.line,
          body: `**[${c.severity}]** ${c.message}`,
        });
      } catch (err) {
        // 라인이 diff에 없으면 GitHub가 422 반환 — 무시
      }
    }
  });
};
