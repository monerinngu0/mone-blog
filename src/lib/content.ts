import { getCollection, type CollectionEntry } from 'astro:content';
import urlRegistry from '../../content/url-registry.json';
import { validateArticleUrls } from './url-registry';

export type Prerequisite = { text: string; href?: string };

/** Resolve and validate every article, including drafts, before publishing. */
export async function getSiteContent() {
    const [allArticles, topics, allTutorials] = await Promise.all([
        getCollection('articles'),
        getCollection('topics'),
        getCollection('tutorials'),
    ]);
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
    const rawArticlesById = new Map(allArticles.map((article) => [article.id, article]));
    validateArticleUrls(urlRegistry, allArticles);
    function resolvePrerequisites(
        items: CollectionEntry<'articles'>['data']['prerequisites'],
        owner: string,
        draft: boolean,
        selfId?: string,
    ): Prerequisite[] {
        return items.map((item) => {
            if ('text' in item) return { text: item.text };
            const id = item.article.id;
            const target = rawArticlesById.get(id);
            if (!target)
                throw new Error(`${owner} references unknown prerequisite article "${id}".`);
            if (id === selfId) throw new Error(`${owner} cannot be its own prerequisite.`);
            if (!draft && target.data.draft) {
                throw new Error(`${owner} references draft prerequisite article "${id}".`);
            }
            return { text: target.data.title, href: `/articles/${id}/` };
        });
    }
    const resolved = allArticles.map((article) => ({
        ...article,
        prerequisites: resolvePrerequisites(
            article.data.prerequisites,
            `Article "${article.id}"`,
            article.data.draft,
            article.id,
        ),
        topics: [...new Set(article.data.topics.map((topic) => topic.id))].map((id) => {
            const topic = topicsById.get(id);
            if (!topic)
                throw new Error(`Article "${article.id}" references unknown topic "${id}".`);
            return topic;
        }),
    }));
    for (const topic of topics) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id)) {
            throw new Error(
                `Invalid topic ID "${topic.id}". Use lowercase letters, digits and hyphens.`,
            );
        }
    }
    // Drafts stay private in production, but are routable while writing with `npm run dev`.
    const articles = resolved
        .filter(({ data }) => import.meta.env.DEV || !data.draft)
        .sort(
            (a, b) =>
                b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf() ||
                a.id.localeCompare(b.id),
        );
    const articlesById = new Map(resolved.map((article) => [article.id, article]));
    // Draft tutorials also reserve their chapter ownership.
    const chapterOwners = new Map<string, string>();
    const tutorials = allTutorials
        .map((tutorial) => {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tutorial.id)) {
                throw new Error(`Invalid tutorial ID "${tutorial.id}".`);
            }
            const seen = new Set<string>();
            const chapters = tutorial.data.articles.map(({ id }) => {
                if (seen.has(id))
                    throw new Error(`Tutorial "${tutorial.id}" repeats article "${id}".`);
                seen.add(id);
                const owner = chapterOwners.get(id);
                if (owner) {
                    throw new Error(
                        `Article "${id}" belongs to both tutorials "${owner}" and "${tutorial.id}". Use prerequisites instead.`,
                    );
                }
                chapterOwners.set(id, tutorial.id);
                const article = articlesById.get(id);
                if (!article)
                    throw new Error(
                        `Tutorial "${tutorial.id}" references unknown article "${id}".`,
                    );
                if (!tutorial.data.draft && article.data.draft) {
                    throw new Error(
                        `Published tutorial "${tutorial.id}" references draft article "${id}".`,
                    );
                }
                return article;
            });
            return {
                ...tutorial,
                chapters,
                prerequisites: resolvePrerequisites(
                    tutorial.data.prerequisites,
                    `Tutorial "${tutorial.id}"`,
                    tutorial.data.draft,
                ),
            };
        })
        .filter(({ data }) => import.meta.env.DEV || !data.draft)
        .sort((a, b) => a.data.title.localeCompare(b.data.title, 'ja'));
    const publishedFeaturedTutorials = tutorials.filter(({ data }) => !data.draft && data.featured);
    if (publishedFeaturedTutorials.length > 1) {
        throw new Error('Only one published tutorial can be featured on Home.');
    }
    const featuredTutorial =
        publishedFeaturedTutorials[0] ??
        tutorials.find(({ data }) => data.featured) ??
        tutorials[0];
    return {
        articles,
        tutorials,
        featuredTutorial,
        topics: topics.sort((a, b) => a.data.name.localeCompare(b.data.name, 'ja')),
    };
}

export type Tutorial = Awaited<ReturnType<typeof getSiteContent>>['tutorials'][number];
