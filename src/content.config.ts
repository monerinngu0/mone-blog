import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    base: './src/content/articles',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    topics: z.array(reference('topics')).default([]),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const topics = defineCollection({
  loader: glob({ base: './src/content/topics', pattern: '*.yaml' }),
  schema: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
  }),
});

const tutorials = defineCollection({
  loader: glob({ base: './src/content/tutorials', pattern: '*.yaml' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    articles: z.array(reference('articles')).min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, topics, tutorials };
