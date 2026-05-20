// XML/SVG text escaping. Pure.
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

export function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => MAP[c]);
}
