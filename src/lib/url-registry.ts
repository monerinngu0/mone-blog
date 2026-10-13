type RegistryEntry = { status: 'active' } | { status: 'redirect'; to: string } | { status: 'gone' };

type UrlRegistry = {
    version: 1;
    articles: Record<string, RegistryEntry>;
};

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRegistry(value: unknown): UrlRegistry {
    if (!isObject(value) || value.version !== 1 || !isObject(value.articles)) {
        throw new Error('Invalid URL registry. Expected version 1 with an articles object.');
    }

    for (const [id, entry] of Object.entries(value.articles)) {
        if (!idPattern.test(id)) {
            throw new Error(`Invalid article ID "${id}" in URL registry.`);
        }
        if (!isObject(entry) || !['active', 'redirect', 'gone'].includes(String(entry.status))) {
            throw new Error(`Invalid URL registry status for article "${id}".`);
        }
        const keys = Object.keys(entry).sort();
        if (entry.status === 'redirect') {
            if (typeof entry.to !== 'string' || !idPattern.test(entry.to)) {
                throw new Error(`Invalid redirect target for article "${id}".`);
            }
            if (keys.join(',') !== 'status,to') {
                throw new Error(`Unexpected URL registry fields for article "${id}".`);
            }
        } else if (keys.join(',') !== 'status') {
            throw new Error(`Unexpected URL registry fields for article "${id}".`);
        }
    }

    return value as UrlRegistry;
}

export function validateArticleUrls(
    value: unknown,
    articles: Array<{ id: string; data: { draft: boolean } }>,
) {
    const registry = readRegistry(value);
    const articlesById = new Map(articles.map((article) => [article.id, article]));

    for (const article of articles) {
        const entry = registry.articles[article.id];
        if (article.data.draft) {
            if (entry && entry.status !== 'active') {
                throw new Error(
                    `Draft article "${article.id}" reuses a reserved ${entry.status} URL.`,
                );
            }
            continue;
        }
        if (!entry) {
            throw new Error(`Published article "${article.id}" is missing from URL registry.`);
        }
        if (entry.status !== 'active') {
            throw new Error(
                `Published article "${article.id}" has URL registry status "${entry.status}" instead of "active".`,
            );
        }
    }

    for (const [id, entry] of Object.entries(registry.articles)) {
        const article = articlesById.get(id);
        if (entry.status === 'active') {
            if (!article || article.data.draft) {
                throw new Error(`Active article URL "${id}" has no published article.`);
            }
            continue;
        }
        if (article) {
            throw new Error(`Reserved ${entry.status} article URL "${id}" is still in use.`);
        }
        if (entry.status === 'redirect') {
            const target = registry.articles[entry.to];
            if (!target || target.status !== 'active') {
                throw new Error(
                    `Article URL "${id}" must redirect directly to an active article, not "${entry.to}".`,
                );
            }
        }
    }
}
