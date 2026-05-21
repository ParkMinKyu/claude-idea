import { Buffer } from "buffer";
globalThis.Buffer = globalThis.Buffer || Buffer;
import { encode, detectFormat } from "../ideas/105-base64-toolkit/src/codec.js";

window.__DEMO_SPEC__ = {
  description: "텍스트를 base64 / base64url / hex / URL 인코딩으로 동시에 변환합니다.",
  fields: [
    { name: "text", type: "textarea", label: "입력 텍스트", rows: 4, default: "Hello, 안녕하세요 👋" },
  ],
  run(v) {
    const text = v.text || "";
    return [
      { label: "감지된 형식", type: "badge", value: detectFormat(text), tone: "neutral" },
      { label: "Base64", type: "code", value: encode("base64", text) },
      { label: "Base64URL", type: "code", value: encode("base64url", text) },
      { label: "Hex", type: "code", value: encode("hex", text) },
      { label: "URL 인코딩", type: "code", value: encode("url", text) },
    ];
  },
};
