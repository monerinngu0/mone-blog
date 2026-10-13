import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
    cp,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rename,
    rm,
    symlink,
    writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const project = fileURLToPath(new URL('../', import.meta.url));

test('article IDs survive nesting and moves, and duplicate article folders fail', async () => {
    const fixture = await mkdtemp(join(tmpdir(), 'mone-article-folders-'));
    const at = (...parts) => join(fixture, ...parts);
    const article = (...parts) => at('content/articles', ...parts);
    const writeRegistry = (activeIds) =>
        writeFile(
            at('content/url-registry.json'),
            `${JSON.stringify(
                {
                    version: 1,
                    articles: Object.fromEntries(
                        activeIds.sort().map((id) => [id, { status: 'active' }]),
                    ),
                },
                null,
                2,
            )}\n`,
        );
    const build = () =>
        execFileSync(
            process.execPath,
            [join(project, 'node_modules/astro/bin/astro.mjs'), 'build'],
            {
                cwd: fixture,
                encoding: 'utf8',
                stdio: 'pipe',
                env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
            },
        );
    const expectBuildFailure = (message) => {
        const result = spawnSync(
            process.execPath,
            [join(project, 'node_modules/astro/bin/astro.mjs'), 'build'],
            {
                cwd: fixture,
                encoding: 'utf8',
                env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
            },
        );
        assert.notEqual(result.status, 0, 'Invalid article folders must fail the build');
        assert.match(result.stdout + result.stderr, message);
    };
    const expectDuplicate = () => expectBuildFailure(/Duplicate article ID "vector-capacity"/);

    try {
        for (const [source, destination = source] of [
            ['src'],
            [
                'scripts/fixtures/content/articles/vector-introduction',
                'content/articles/vector-introduction',
            ],
            [
                'scripts/fixtures/content/articles/vector-capacity',
                'content/articles/vector-capacity',
            ],
            ['content/topics/cpp.yaml'],
            ['content/topics/stl.yaml'],
            ['content/topics/memory.yaml'],
            ['scripts/fixtures/content/tutorials/vector.yaml', 'content/tutorials/vector.yaml'],
            ['content/pages/about'],
            ['content/linked.json'],
            ['astro.config.mjs'],
            ['tsconfig.json'],
            ['package.json'],
        ]) {
            await mkdir(dirname(at(destination)), { recursive: true });
            await cp(join(project, source), at(destination), { recursive: true });
        }
        await symlink(join(project, 'node_modules'), at('node_modules'), 'dir');
        await writeRegistry(['vector-introduction', 'vector-capacity']);
        build();

        // Repeated grouping names are legal when each grouping folder is marked.
        const moved = article('_group/_vector-capacity/_group/vector-capacity');
        await mkdir(dirname(moved), { recursive: true });
        await rename(article('vector-capacity'), moved);
        // Malformed non-index MDX must never be parsed as an article.
        await writeFile(article('_group/notes.mdx'), '---\ninvalid: [\n---\n');
        // An article may itself contain another article folder.
        const child = join(moved, 'nested-article');
        await mkdir(join(child, 'img'), { recursive: true });
        await writeFile(
            join(child, 'index.mdx'),
            '---\ntitle: Nested\ndescription: Nested article\npublishedAt: 2026-10-06\n---\nNested body\n',
        );
        await writeRegistry(['vector-introduction', 'vector-capacity', 'nested-article']);
        // Reuse the content cache to catch stale filePath values after a move.
        build();
        assert.deepEqual((await readdir(at('dist/articles'))).sort(), [
            'index.html',
            'nested-article',
            'vector-capacity',
            'vector-introduction',
        ]);
        const html = await readFile(at('dist/articles/vector-capacity/index.html'), 'utf8');
        assert.match(html, /class="katex"/);
        assert.match(html, /vector-size-capacity/);
        assert.match(html, /data-module=/);
        assert.match(html, /href="\/articles\/vector-introduction\/"/);
        const tutorial = await readFile(at('dist/tutorials/vector/index.html'), 'utf8');
        assert.match(tutorial, /href="\/articles\/vector-capacity\/"/);

        // Same ID and byte-identical contents must fail, even with a warm cache.
        const duplicate = article('_other/vector-capacity');
        await mkdir(duplicate, { recursive: true });
        const body = await readFile(join(moved, 'index.mdx'), 'utf8');
        await writeFile(join(duplicate, 'index.mdx'), body);
        expectDuplicate();
        // Drafts also reserve their ID.
        await writeFile(join(duplicate, 'index.mdx'), body.replace('---\n', '---\ndraft: true\n'));
        expectDuplicate();
        await rm(duplicate, { recursive: true });

        // Grouping folders are visibly distinguished from article folders.
        const unmarkedGroup = article('group/example');
        await mkdir(unmarkedGroup, { recursive: true });
        await writeFile(
            join(unmarkedGroup, 'index.mdx'),
            '---\ntitle: Example\ndescription: Group check\npublishedAt: 2026-10-06\ndraft: true\n---\nBody\n',
        );
        expectBuildFailure(/Grouping folder "group" must start with an underscore/);
        await rm(article('group'), { recursive: true });

        const groupingArticle = article('_examples');
        await mkdir(groupingArticle);
        await writeFile(
            join(groupingArticle, 'index.mdx'),
            '---\ntitle: Example\ndescription: Group check\npublishedAt: 2026-10-06\ndraft: true\n---\nBody\n',
        );
        expectBuildFailure(/Grouping folder "_examples" cannot contain index\.mdx/);
        await rm(groupingArticle, { recursive: true });

        const invalidArticle = article('Invalid_ID');
        await mkdir(invalidArticle);
        await writeFile(
            join(invalidArticle, 'index.mdx'),
            '---\ntitle: Invalid\ndescription: ID check\npublishedAt: 2026-10-06\ndraft: true\n---\nBody\n',
        );
        expectBuildFailure(/Invalid article folder/);
        await rm(invalidArticle, { recursive: true });

        // Home limits public articles to five; the archive keeps every article.
        for (let i = 1; i <= 6; i++) {
            const folder = article(`latest-${i}`);
            await mkdir(folder);
            await writeFile(
                join(folder, 'index.mdx'),
                `---\ntitle: Latest ${i}\ndescription: Fixture\npublishedAt: 2027-01-0${i}\n---\nBody\n`,
            );
        }
        await mkdir(article('hidden-draft'));
        await writeFile(
            article('hidden-draft/index.mdx'),
            '---\ntitle: Hidden\ndescription: Draft\npublishedAt: 2028-01-01\ndraft: true\n---\nDraft\n',
        );
        await writeRegistry([
            'vector-introduction',
            'vector-capacity',
            'nested-article',
            ...Array.from({ length: 6 }, (_, index) => `latest-${index + 1}`),
        ]);
        build();
        const home = await readFile(at('dist/index.html'), 'utf8');
        const archive = await readFile(at('dist/articles/index.html'), 'utf8');
        assert.equal((home.match(/class="[^"]*\\barticle-card\\b[^"]*"/g) ?? []).length, 5);
        assert.equal((archive.match(/class="[^"]*\\barticle-card\\b[^"]*"/g) ?? []).length, 9);
        assert.match(archive, /id="standalone-only" type="checkbox"/);
        assert.equal((archive.match(/data-in-tutorial="true"/g) ?? []).length, 2);
        const latestIds = [...home.matchAll(/href="\/articles\/(latest-\d)\/"/g)].map(
            (match) => match[1],
        );
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
