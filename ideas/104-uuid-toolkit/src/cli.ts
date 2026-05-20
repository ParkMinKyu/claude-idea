#!/usr/bin/env node
// CLI: uuidkit gen [v4|v7|ulid] [-n N]  |  uuidkit inspect <id>
import { uuidV4, uuidV7, ulid, inspectUuid, inspectUlid } from "./index.js";

export function run(argv: string[]): string {
  const [cmd, ...rest] = argv;
  if (cmd === "gen") {
    const kind = rest[0] && !rest[0].startsWith("-") ? rest[0] : "v4";
    const nFlag = rest.indexOf("-n");
    const count = nFlag >= 0 ? Number(rest[nFlag + 1]) : 1;
    const gen = kind === "v7" ? uuidV7 : kind === "ulid" ? ulid : uuidV4;
    return Array.from({ length: count }, () => gen()).join("\n");
  }
  if (cmd === "inspect") {
    const id = rest[0] ?? "";
    const info = id.includes("-") ? inspectUuid(id) : inspectUlid(id);
    return JSON.stringify(info, null, 2);
  }
  return "usage: uuidkit gen [v4|v7|ulid] [-n N] | uuidkit inspect <id>";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(run(process.argv.slice(2)));
}
