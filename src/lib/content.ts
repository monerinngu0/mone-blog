import { getCollection } from 'astro:content';

/** Resolve and validate every article, including drafts, before publishing. */
export async function getSiteContent() {
  const [allArticles, topics, allTutorials] = await Promise.all([
    getCollection('articles'),
    getCollection('topics'),
    getCollection('tutorials'),
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
  const articlesById = new Map(resolved.map((article) => [article.id, article]));
  const tutorials = allTutorials.map((tutorial) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tutorial.id)) {
      throw new Error(`Invalid tutorial ID "${tutorial.id}".`);
    }
    const seen = new Set<string>();
    const chapters = tutorial.data.articles.map(({ id }) => {
      if (seen.has(id)) throw new Error(`Tutorial "${tutorial.id}" repeats article "${id}".`);
      seen.add(id);
      const article = articlesById.get(id);
      if (!article) throw new Error(`Tutorial "${tutorial.id}" references unknown article "${id}".`);
      if (!tutorial.data.draft && article.data.draft) {
        throw new Error(`Published tutorial "${tutorial.id}" references draft article "${id}".`);
      }
      return article;
    });
    return { ...tutorial, chapters };
  }).filter(({ data }) => !data.draft)
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'ja'));
  return {
    articles,
    tutorials,
    topics: topics.sort((a, b) => a.data.name.localeCompare(b.data.name, 'ja')),
  };
}

export type Tutorial = Awaited<ReturnType<typeof getSiteContent>>['tutorials'][number];
