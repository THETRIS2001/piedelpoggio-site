import { defineCollection, z } from 'astro:content';

// Schema per le news
const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Schema per gli eventi
const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    startsAt: z.date(),
    endsAt: z.date().optional(),
    place: z.object({
      name: z.string(),
      lat: z.number(),
      lon: z.number(),
    }),
    cover: z.string().optional(),
    description: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Schema per le pagine statiche
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

export const collections = {
  news: newsCollection,
  events: eventsCollection,
  pages: pagesCollection,
};