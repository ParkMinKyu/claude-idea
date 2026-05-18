#!/usr/bin/env node
import { Command } from 'commander';
import { detectTarget, selectAsset } from './match';

const program = new Command();
program.name('pix').description('cross-platform CLI installer').version('0.1.0');

program
  .command('install <repo>')
  .description('install a tool from owner/repo[@version]')
  .action(async (repo: string) => {
    const [slug, version = 'latest'] = repo.split('@');
    const [owner, name] = slug.split('/');
    if (!owner || !name) {
      console.error('format: owner/repo[@version]');
      process.exit(2);
    }
    const target = detectTarget();
    const api = `https://api.github.com/repos/${owner}/${name}/releases/${
      version === 'latest' ? 'latest' : `tags/${version}`
    }`;
    const res = await fetch(api);
    if (!res.ok) {
      console.error(`fetch failed: ${res.status}`);
      process.exit(1);
    }
    const data = (await res.json()) as { assets: { name: string; browser_download_url: string }[] };
    const asset = selectAsset(
      data.assets.map((a) => ({ name: a.name, url: a.browser_download_url })),
      target
    );
    if (!asset) {
      console.error(`no asset matches ${target.os}/${target.arch}`);
      process.exit(1);
    }
    console.log(`would install ${asset.name} -> ~/.pix/bin/${name}`);
  });

program
  .command('detect')
  .description('print detected target')
  .action(() => {
    console.log(JSON.stringify(detectTarget()));
  });

if (require.main === module) program.parseAsync(process.argv);
