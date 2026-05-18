#!/usr/bin/env node
import { Command } from "commander";
import { getCommitsBetween, filterNoise } from "./git.js";
import { generateChangelog, renderMarkdown } from "./changelog.js";

const program = new Command();
program
  .name("ai-changelog")
  .description("Generate user-facing release notes from git commits via Claude")
  .argument("<fromRef>", "starting ref (tag or commit)")
  .argument("<toRef>", "ending ref")
  .option("-v, --version-label <label>", "version label", "Unreleased")
  .option("--no-filter", "do not filter out noise commits")
  .option("--json", "output JSON instead of Markdown")
  .action(async (fromRef: string, toRef: string, opts) => {
    let commits = await getCommitsBetween(fromRef, toRef);
    if (opts.filter !== false) commits = filterNoise(commits);
    const log = await generateChangelog(commits);
    if (opts.json) {
      process.stdout.write(JSON.stringify(log, null, 2) + "\n");
    } else {
      process.stdout.write(renderMarkdown(log, opts.versionLabel) + "\n");
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
