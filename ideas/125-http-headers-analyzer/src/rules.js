// Security header rules. Each returns a Finding:
//   { header, present, severity, points, max, message }
import { parseDirectives } from "./headers.js";

const YEAR_SECONDS = 31_536_000;

function hsts(h) {
  const v = h["strict-transport-security"];
  if (!v) return finding("Strict-Transport-Security", false, "high", 0, 25, "HSTS 헤더가 없습니다");
  const d = parseDirectives(v);
  const maxAge = Number(d["max-age"] ?? 0);
  if (maxAge < YEAR_SECONDS)
    return finding("Strict-Transport-Security", true, "medium", 15, 25, `max-age가 너무 짧습니다 (${maxAge}s, 권장 ≥ 1년)`);
  return finding("Strict-Transport-Security", true, "ok", 25, 25, "양호");
}

function csp(h) {
  const v = h["content-security-policy"];
  if (!v) return finding("Content-Security-Policy", false, "high", 0, 25, "CSP 헤더가 없습니다");
  if (/unsafe-inline|unsafe-eval/.test(v))
    return finding("Content-Security-Policy", true, "medium", 15, 25, "unsafe-inline/unsafe-eval가 포함되어 약합니다");
  return finding("Content-Security-Policy", true, "ok", 25, 25, "양호");
}

function xfo(h) {
  const v = (h["x-frame-options"] ?? "").toUpperCase();
  if (v === "DENY" || v === "SAMEORIGIN") return finding("X-Frame-Options", true, "ok", 15, 15, "양호");
  return finding("X-Frame-Options", false, "medium", 0, 15, "X-Frame-Options(DENY/SAMEORIGIN)가 없습니다");
}

function xcto(h) {
  if ((h["x-content-type-options"] ?? "").toLowerCase() === "nosniff")
    return finding("X-Content-Type-Options", true, "ok", 10, 10, "양호");
  return finding("X-Content-Type-Options", false, "medium", 0, 10, "nosniff가 설정되지 않았습니다");
}

function referrer(h) {
  if (h["referrer-policy"]) return finding("Referrer-Policy", true, "ok", 15, 15, "양호");
  return finding("Referrer-Policy", false, "low", 0, 15, "Referrer-Policy가 없습니다");
}

function permissions(h) {
  if (h["permissions-policy"]) return finding("Permissions-Policy", true, "ok", 10, 10, "양호");
  return finding("Permissions-Policy", false, "low", 0, 10, "Permissions-Policy가 없습니다");
}

/** Information disclosure (negative points). */
export function disclosureFindings(h) {
  const out = [];
  for (const key of ["server", "x-powered-by", "x-aspnet-version"]) {
    if (h[key]) out.push({ header: key, present: true, severity: "info", points: -3, max: 0, message: `버전/스택 노출: ${h[key]}` });
  }
  return out;
}

function finding(header, present, severity, points, max, message) {
  return { header, present, severity, points, max, message };
}

export const SECURITY_RULES = [hsts, csp, xfo, xcto, referrer, permissions];
