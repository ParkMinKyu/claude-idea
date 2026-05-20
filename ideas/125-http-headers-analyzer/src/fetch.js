// I/O layer: fetch response headers for a URL.
export async function fetchHeaders(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { method: "GET", redirect: "follow" });
  return res.headers;
}
