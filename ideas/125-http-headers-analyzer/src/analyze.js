// Run rules and compute score + grade.
import { normalizeHeaders } from "./headers.js";
import { SECURITY_RULES, disclosureFindings } from "./rules.js";

export function grade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

/**
 * Analyze a headers object.
 * @returns {{ score:number, grade:string, findings:object[], disclosures:object[] }}
 */
export function analyzeHeaders(rawHeaders) {
  const h = normalizeHeaders(rawHeaders);
  const findings = SECURITY_RULES.map((rule) => rule(h));
  const disclosures = disclosureFindings(h);

  const earned = findings.reduce((s, f) => s + f.points, 0);
  const possible = findings.reduce((s, f) => s + f.max, 0);
  const penalty = disclosures.reduce((s, f) => s + f.points, 0); // negative
  const score = Math.max(0, Math.round(((earned + penalty) / possible) * 100));

  return { score, grade: grade(score), findings, disclosures };
}
