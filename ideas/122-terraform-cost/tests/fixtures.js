// Sample `terraform show -json` plan output (trimmed).
export const PLAN = {
  format_version: "1.2",
  resource_changes: [
    {
      address: "aws_instance.web",
      type: "aws_instance",
      change: {
        actions: ["update"],
        before: { instance_type: "m5.large" },
        after: { instance_type: "m5.4xlarge" },
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
        actions: ["delete"],
        before: { type: "gp3", size: 500 },
        after: null,
      },
    },
    {
      address: "aws_s3_bucket.assets",
      type: "aws_s3_bucket",
      change: { actions: ["create"], before: null, after: { bucket: "assets" } },
    },
    {
      address: "aws_instance.idle",
      type: "aws_instance",
      change: { actions: ["no-op"], before: { instance_type: "t3.micro" }, after: { instance_type: "t3.micro" } },
    },
  ],
};
