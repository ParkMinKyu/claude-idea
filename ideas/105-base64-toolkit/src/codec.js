// Multi-format encoding/decoding core. Pure functions over UTF-8 strings + Buffers.
// Supports base64, base64url, hex, and URL percent-encoding.

/** Encode a UTF-8 string into the chosen format. */
export function encode(format, input) {
  const buf = Buffer.from(input, "utf8");
  switch (format) {
    case "base64":
      return buf.toString("base64");
    case "base64url":
      return buf.toString("base64url");
    case "hex":
      return buf.toString("hex");
    case "url":
      return encodeURIComponent(input);
    default:
      throw new Error(`unknown format: ${format}`);
  }
}

/** Decode from the chosen format back into a UTF-8 string. */
export function decode(format, input) {
  switch (format) {
    case "base64":
      assertBase64(input, false);
      return Buffer.from(input, "base64").toString("utf8");
    case "base64url":
      assertBase64(input, true);
      return Buffer.from(input, "base64url").toString("utf8");
    case "hex":
      if (!/^[0-9a-fA-F]*$/.test(input) || input.length % 2 !== 0)
        throw new Error("invalid hex string");
      return Buffer.from(input, "hex").toString("utf8");
    case "url":
      return decodeURIComponent(input);
    default:
      throw new Error(`unknown format: ${format}`);
  }
}

function assertBase64(s, urlSafe) {
  const re = urlSafe ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/;
  if (!re.test(s)) throw new Error(`invalid ${urlSafe ? "base64url" : "base64"} string`);
}

/** Detect the most likely format of an input string. */
export function detectFormat(input) {
  if (input === "") return "empty";
  if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) return "hex";
  if (/%[0-9a-fA-F]{2}/.test(input)) return "url";
  if (/^[A-Za-z0-9_-]+={0,2}$/.test(input) && /[_-]/.test(input)) return "base64url";
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(input)) return "base64";
  return "plain";
}

/** Round-trip helper used by the UI to convert between two formats. */
export function convert(fromFormat, toFormat, input) {
  const plain = decode(fromFormat, input);
  return encode(toFormat, plain);
}
