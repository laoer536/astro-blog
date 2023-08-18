import { defineCollection, z } from "astro:content";

export const collections = {
  blogs: defineCollection({
    type: "content",
    schema: z.object({ title: z.string(), description: z.string(), date: z.string(), external: z.boolean() }),
  }),
};
