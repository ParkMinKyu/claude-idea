// Rule engine for Kubernetes manifests.
// Each rule is a pure function: (resource) => Diagnostic[]
// Diagnostic = { rule, severity: "error"|"warning"|"info", message }

const POD_SPEC_KINDS = new Set([
  "Pod",
  "Deployment",
  "StatefulSet",
  "DaemonSet",
  "ReplicaSet",
  "Job",
  "CronJob",
]);

/** Extract the list of containers regardless of workload kind. */
export function getContainers(resource) {
  const kind = resource?.kind;
  if (kind === "Pod") return resource?.spec?.containers ?? [];
  if (kind === "CronJob")
    return resource?.spec?.jobTemplate?.spec?.template?.spec?.containers ?? [];
  return resource?.spec?.template?.spec?.containers ?? [];
}

/** Pod-level spec (for hostNetwork etc). */
function getPodSpec(resource) {
  const kind = resource?.kind;
  if (kind === "Pod") return resource?.spec ?? {};
  if (kind === "CronJob")
    return resource?.spec?.jobTemplate?.spec?.template?.spec ?? {};
  return resource?.spec?.template?.spec ?? {};
}

// --- Schema rules ---
function ruleRequiredFields(resource) {
  const out = [];
  if (!resource?.apiVersion)
    out.push({ rule: "missing-apiVersion", severity: "error", message: "apiVersion 필드가 없습니다" });
  if (!resource?.kind)
    out.push({ rule: "missing-kind", severity: "error", message: "kind 필드가 없습니다" });
  if (!resource?.metadata?.name)
    out.push({ rule: "missing-name", severity: "error", message: "metadata.name 필드가 없습니다" });
  return out;
}

// --- Reliability rules ---
function ruleLatestTag(resource) {
  if (!POD_SPEC_KINDS.has(resource?.kind)) return [];
  const out = [];
  for (const c of getContainers(resource)) {
    const image = c?.image ?? "";
    if (!image) continue;
    const tag = image.includes("@") ? "digest" : image.split(":")[1];
    if (!tag || tag === "latest") {
      out.push({
        rule: "image-latest-tag",
        severity: "warning",
        message: `컨테이너 '${c.name ?? "?"}' 이미지가 'latest' 또는 태그 없음: ${image || "(빈 값)"}`,
      });
    }
  }
  return out;
}

function ruleResourceLimits(resource) {
  if (!POD_SPEC_KINDS.has(resource?.kind)) return [];
  const out = [];
  for (const c of getContainers(resource)) {
    if (!c?.resources?.limits) {
      out.push({
        rule: "missing-resource-limits",
        severity: "warning",
        message: `컨테이너 '${c?.name ?? "?"}'에 resources.limits가 없습니다`,
      });
    }
  }
  return out;
}

// --- Security rules ---
function rulePrivileged(resource) {
  if (!POD_SPEC_KINDS.has(resource?.kind)) return [];
  const out = [];
  for (const c of getContainers(resource)) {
    if (c?.securityContext?.privileged === true) {
      out.push({
        rule: "privileged-container",
        severity: "error",
        message: `컨테이너 '${c?.name ?? "?"}'가 privileged 모드로 실행됩니다`,
      });
    }
  }
  return out;
}

function ruleHostNetwork(resource) {
  if (!POD_SPEC_KINDS.has(resource?.kind)) return [];
  const spec = getPodSpec(resource);
  if (spec?.hostNetwork === true) {
    return [{ rule: "host-network", severity: "warning", message: "hostNetwork가 활성화되어 있습니다" }];
  }
  return [];
}

export const ALL_RULES = [
  ruleRequiredFields,
  ruleLatestTag,
  ruleResourceLimits,
  rulePrivileged,
  ruleHostNetwork,
];

/** Run all rules against one resource. */
export function runRules(resource, rules = ALL_RULES) {
  return rules.flatMap((fn) => fn(resource));
}
