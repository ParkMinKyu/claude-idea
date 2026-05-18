#!/usr/bin/env node
// Minimal CLI — `add`, `list`, `remove`, `check`. Persists to ~/.domwatch.json.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { isValidDomain, parseWhois, expiryAlertTier } from "./whois.js";

const STORE = join(homedir(), ".domwatch.json");

function load() {
  if (!existsSync(STORE)) return { domains: [] };
  return JSON.parse(readFileSync(STORE, "utf8"));
}

function save(data) {
  writeFileSync(STORE, JSON.stringify(data, null, 2));
}

async function cmd(argv) {
  const [, , action, ...rest] = argv;
  const data = load();
  switch (action) {
    case "add": {
      const domain = (rest[0] ?? "").toLowerCase();
      if (!isValidDomain(domain)) {
        console.error("invalid domain");
        process.exit(1);
      }
      if (!data.domains.find((d) => d.name === domain)) {
        data.domains.push({ name: domain, addedAt: new Date().toISOString() });
        save(data);
      }
      console.log(`watching ${domain} (${data.domains.length} total)`);
      break;
    }
    case "list":
      data.domains.forEach((d, i) => console.log(`${i + 1}. ${d.name} ${d.expiresAt ?? ""}`));
      if (data.domains.length === 0) console.log("(no domains)");
      break;
    case "remove": {
      const domain = (rest[0] ?? "").toLowerCase();
      data.domains = data.domains.filter((d) => d.name !== domain);
      save(data);
      console.log(`removed ${domain}`);
      break;
    }
    case "check": {
      // In real CLI we'd query whois; here, parse stdin fixture or skip.
      console.log("would query whois for", data.domains.length, "domains");
      break;
    }
    default:
      console.log("usage: domwatch <add|list|remove|check> [domain]");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cmd(process.argv).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

export { cmd, parseWhois, expiryAlertTier };
