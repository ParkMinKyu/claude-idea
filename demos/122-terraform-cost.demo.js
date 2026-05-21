import { estimatePlan } from "../ideas/122-terraform-cost/src/estimate.js";
import { toMarkdown } from "../ideas/122-terraform-cost/src/report.js";

window.__DEMO_SPEC__ = {
  description: "terraform show -json 플랜 출력을 받아 EC2/RDS/EBS 정적 단가표로 월간 비용 증감을 추정합니다.",
  fields: [
    {
      name: "plan",
      type: "textarea",
      label: "Terraform 플랜 JSON",
      rows: 16,
      default: JSON.stringify(
        {
          resource_changes: [
            {
              address: "aws_instance.web",
              type: "aws_instance",
              change: {
                actions: ["update"],
                before: { instance_type: "t3.small" },
                after: { instance_type: "m5.large" },
              },
            },
            {
              address: "aws_db_instance.main",
              type: "aws_db_instance",
              change: {
                actions: ["create"],
                before: null,
                after: { instance_class: "db.t3.medium", allocated_storage: 100, multi_az: true },
              },
            },
            {
              address: "aws_ebs_volume.data",
              type: "aws_ebs_volume",
              change: {
                actions: ["create"],
                before: null,
                after: { type: "gp3", size: 200 },
              },
            },
          ],
        },
        null,
        2
      ),
    },
  ],
  run(v) {
    let planJson;
    try {
      planJson = JSON.parse(v.plan || "{}");
    } catch (e) {
      return [{ label: "오류", type: "error", value: "플랜 JSON 파싱 실패: " + e.message }];
    }
    const estimate = estimatePlan(planJson);
    return [
      {
        label: "월간 증감",
        type: "badge",
        value: `${estimate.delta >= 0 ? "+" : ""}${estimate.delta} USD/월`,
        tone: estimate.delta > 0 ? "warn" : estimate.delta < 0 ? "good" : "neutral",
      },
      {
        label: "합계",
        type: "text",
        value: `변경 전 ${estimate.totalBefore} → 변경 후 ${estimate.totalAfter} USD/월`,
      },
      { label: "비용 표 (Markdown)", type: "code", value: toMarkdown(estimate) },
      { label: "상세", type: "json", value: estimate.items },
    ];
  },
};
