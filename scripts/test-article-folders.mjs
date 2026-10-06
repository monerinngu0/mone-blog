import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const project = fileURLToPath(new URL('../', import.meta.url));

test('article IDs survive nesting and moves, and duplicate article folders fail', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'mone-article-folders-'));
  const at = (...parts) => join(fixture, ...parts);
  const article = (...parts) => at('content/articles', ...parts);
  const build = () => execFileSync(process.execPath, [join(project, 'node_modules/astro/bin/astro.mjs'), 'build'], {
    cwd: fixture,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  });
  const expectDuplicate = () => {
    const result = spawnSync(process.execPath, [join(project, 'node_modules/astro/bin/astro.mjs'), 'build'], {
      cwd: fixture,
      encoding: 'utf8',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    });
    assert.notEqual(result.status, 0, 'Duplicate article folders must fail the build');
    assert.match(result.stdout + result.stderr, /Duplicate article ID "vector-capacity"/);
  };

  try {
    for (const path of ['src', 'content', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(join(project, path), at(path), { recursive: true });
    }
    await symlink(join(project, 'node_modules'), at('node_modules'), 'dir');
    build();

    // Repeated grouping names are legal, even when they match an article ID.
    const moved = article('group/vector-capacity/group/vector-capacity');
    await mkdir(dirname(moved), { recursive: true });
    await rename(article('vector-capacity'), moved);
    // Malformed non-index MDX must never be parsed as an article.
    await writeFile(article('group/notes.mdx'), '---\ninvalid: [\n---\n');
    // An article may itself contain another article folder.
    const child = join(moved, 'nested-article');
    await mkdir(join(child, 'img'), { recursive: true });
    await writeFile(join(child, 'index.mdx'), '---\ntitle: Nested\ndescription: Nested article\npublishedAt: 2026-10-06\n---\nNested body\n');
    // Reuse the content cache to catch stale filePath values after a move.
    build();
    assert.deepEqual((await readdir(at('dist/articles'))).sort(), ['index.html', 'nested-article', 'vector-capacity', 'vector-introduction']);
    const html = await readFile(at('dist/articles/vector-capacity/index.html'), 'utf8');
    assert.match(html, /class="katex"/);
    assert.match(html, /vector-size-capacity/);
    assert.match(html, /data-module=/);
    assert.match(html, /href="\/articles\/vector-introduction\/"/);
    const tutorial = await readFile(at('dist/tutorials/vector/index.html'), 'utf8');
    assert.match(tutorial, /href="\/articles\/vector-capacity\/"/);

    // Same ID and byte-identical contents must fail, even with a warm cache.
    const duplicate = article('other/vector-capacity');
    await mkdir(duplicate, { recursive: true });
    const body = await readFile(join(moved, 'index.mdx'), 'utf8');
    await writeFile(join(duplicate, 'index.mdx'), body);
    expectDuplicate();
    // Drafts also reserve their ID.
    await writeFile(join(duplicate, 'index.mdx'), body.replace('---\n', '---\ndraft: true\n'));
    expectDuplicate();
    await rm(duplicate, { recursive: true });

    // Home limits public articles to five; the archive keeps every article.
    for (let i = 1; i <= 6; i++) {
      const folder = article(`latest-${i}`);
      await mkdir(folder);
      await writeFile(join(folder, 'index.mdx'), `---\ntitle: Latest ${i}\ndescription: Fixture\npublishedAt: 2027-01-0${i}\n---\nBody\n`);
    }
    await mkdir(article('hidden-draft'));
    await writeFile(article('hidden-draft/index.mdx'), '---\ntitle: Hidden\ndescription: Draft\npublishedAt: 2028-01-01\ndraft: true\n---\nDraft\n');
    build();
    const home = await readFile(at('dist/index.html'), 'utf8');
    const archive = await readFile(at('dist/articles/index.html'), 'utf8');
    assert.equal((home.match(/class="article-card"/g) ?? []).length, 5);
    assert.equal((archive.match(/class="article-card"/g) ?? []).length, 9);
    const latestIds = [...home.matchAll(/href="\/articles\/(latest-\d)\/"/g)].map((match) => match[1]);
    assert.deepEqual(latestIds, ['latest-6', 'latest-5', 'latest-4', 'latest-3', 'latest-2']);
    assert.doesNotMatch(archive, /href="\/articles\/(?:hidden-draft|about)\/"/);
    const about = await readFile(at('dist/about/index.html'), 'utf8');
    assert.match(about, /このブログについて/);
    assert.match(about, /<prose-content/);
    assert.match(home, /popovertarget="linked-menu-panel"/);
    assert.match(home, /href="https:\/\/github.com\/monerinngu0\/mone-blog"/);
    assert.doesNotMatch(home, /href="\/linked\/"/);
    assert.equal((await readdir(at('dist'))).includes('linked'), false);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
