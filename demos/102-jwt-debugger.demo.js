import { Buffer } from "buffer";
globalThis.Buffer = globalThis.Buffer || Buffer;
import { decodeJwt, inspectClaims } from "../ideas/102-jwt-debugger/src/jwt.js";

// Sample HS256 JWT (header + payload + signature). Decoded client-side; no secret needed.
const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkdpbGRvbmcgSG9uZyIsImlzcyI6ImRlbW8tYXV0aCIsImF1ZCI6Im15LWFwcCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwfQ." +
  "S3eH0i8m6r3o2qzv8gJ7VtJ8m2yqf0p9aQ3WkqQ1cE0";

window.__DEMO_SPEC__ = {
  description:
    "JWT를 브라우저에서 디코딩해 헤더/페이로드를 확인하고, 등록된 클레임(exp/nbf/iss 등)을 점검합니다. (서명 검증 X, 토큰은 외부로 전송되지 않습니다)",
  fields: [
    {
      name: "token",
      type: "textarea",
      label: "JWT 토큰",
      rows: 5,
      default: SAMPLE_JWT,
    },
  ],
  run(v) {
    const decoded = decodeJwt((v.token || "").trim());
    if (decoded.error) {
      return [{ label: "디코딩 오류", type: "error", value: decoded.error }];
    }
    const claims = inspectClaims(decoded.payload);
    return [
      { label: "헤더", type: "json", value: decoded.header },
      { label: "페이로드", type: "json", value: decoded.payload },
      {
        label: "상태",
        type: "badge",
        value: claims.active ? "유효 (현재 활성)" : claims.expired ? "만료됨" : "아직 유효하지 않음",
        tone: claims.active ? "good" : "bad",
      },
      { label: "클레임 점검", type: "json", value: claims },
      { label: "서명 (검증 안 함)", type: "code", value: decoded.signature },
    ];
  },
};
