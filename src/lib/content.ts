import { getCollection } from 'astro:content';

/** Resolve and validate every article, including drafts, before publishing. */
export async function getSiteContent() {
  const [allArticles, topics] = await Promise.all([
    getCollection('articles'),
    getCollection('topics'),
  ]);
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const resolved = allArticles.map((article) => ({
    ...article,
    topics: [...new Set(article.data.topics.map((topic) => topic.id))].map((id) => {
      const topic = topicsById.get(id);
      if (!topic) throw new Error(`Article "${article.id}" references unknown topic "${id}".`);
      return topic;
    }),
  }));
  for (const topic of topics) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id)) {
      throw new Error(`Invalid topic ID "${topic.id}". Use lowercase letters, digits and hyphens.`);
    }
  }
  const articles = resolved.filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
      || a.id.localeCompare(b.id));
  return {
    articles,
    topics: topics.sort((a, b) => a.data.name.localeCompare(b.data.name, 'ja')),
  };
}
