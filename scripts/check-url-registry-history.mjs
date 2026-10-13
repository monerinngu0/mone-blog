import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const registryPath = 'content/url-registry.json';

function articleEntries(registry, owner) {
    if (
        typeof registry !== 'object' ||
        registry === null ||
        Array.isArray(registry) ||
        typeof registry.articles !== 'object' ||
        registry.articles === null ||
        Array.isArray(registry.articles)
    ) {
        throw new Error(`${owner} URL registry has no articles object.`);
    }
    return registry.articles;
}

export function checkUrlRegistryHistory(previousRegistry, currentRegistry, allowedRemovals = []) {
    const previous = articleEntries(previousRegistry, 'Previous');
    const current = articleEntries(currentRegistry, 'Current');
    const allowed = new Set(allowedRemovals);

    for (const [id, previousEntry] of Object.entries(previous)) {
        const currentEntry = current[id];
        if (!currentEntry) {
            if (allowed.has(id)) continue;
            throw new Error(
                `URL registry entry "${id}" was removed. Keep every published ID in the registry.`,
            );
        }
        if (previousEntry?.status !== 'active' && currentEntry.status === 'active') {
            throw new Error(
                `Reserved URL "${id}" changed from "${previousEntry?.status}" back to "active". Published IDs cannot be reused.`,
            );
        }
    }
}

function registryAt(ref) {
    const content = execFileSync('git', ['show', `${ref}:${registryPath}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(content);
}

function currentRegistry() {
    const content = execFileSync('git', ['show', `HEAD:${registryPath}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(content);
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
    const baseRef = process.argv[2];
    if (!baseRef) {
        console.error('Usage: npm run registry:check-history -- <base-git-ref>');
        process.exit(2);
    }

    try {
        const allowedRemovals = (process.env.ALLOW_UNPUBLISHED_URL_REMOVALS ?? '')
            .split(',')
            .filter(Boolean);
        checkUrlRegistryHistory(registryAt(baseRef), currentRegistry(), allowedRemovals);
        console.log(`URL registry preserves every entry from ${baseRef}.`);
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
