import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { articleFolders } from './loaders/articles';

const prerequisites = z.array(z.union([
  z.string().trim().min(1).transform((text) => ({ text })),
  z.object({ text: z.string().trim().min(1) }).strict(),
  z.object({ article: reference('articles') }).strict(),
])).default([]);

const articles = defineCollection({
  loader: articleFolders(),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    topics: z.array(reference('topics')).default([]),
    prerequisites,
    related: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const topics = defineCollection({
  loader: glob({ base: './content/topics', pattern: '*.yaml' }),
  schema: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
  }),
});

const tutorials = defineCollection({
  loader: glob({ base: './content/tutorials', pattern: '*.yaml' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    articles: z.array(reference('articles')).min(1),
    prerequisites,
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, topics, tutorials };
