// I/O layer: fetch a live cert via TLS. Kept separate from pure logic.
import tls from "node:tls";

/** Connect to host:port and resolve the peer certificate. */
export function fetchCert(host, port = 443, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || Object.keys(cert).length === 0) reject(new Error("no certificate"));
      else resolve(cert);
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}
