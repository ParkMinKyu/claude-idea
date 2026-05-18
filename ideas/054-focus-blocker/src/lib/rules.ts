import { BlockRule } from "./schedule";

export interface DnrRule {
  id: number;
  priority: number;
  action: {
    type: "redirect";
    redirect: { extensionPath: string };
  };
  condition: {
    urlFilter: string;
    resourceTypes: string[];
  };
}

export function toDnrRules(
  rules: BlockRule[],
  redirectPath = "/blocked.html",
  startId = 1
): DnrRule[] {
  return rules.map((r, idx) => ({
    id: startId + idx,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: redirectPath },
    },
    condition: {
      urlFilter: r.pattern,
      resourceTypes: ["main_frame"],
    },
  }));
}

export function diffRuleIds(prev: DnrRule[], next: DnrRule[]): {
  addRules: DnrRule[];
  removeRuleIds: number[];
} {
  const prevIds = new Set(prev.map((r) => r.id));
  const nextIds = new Set(next.map((r) => r.id));
  return {
    addRules: next.filter((r) => !prevIds.has(r.id)),
    removeRuleIds: [...prevIds].filter((id) => !nextIds.has(id)),
  };
}
