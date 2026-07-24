import { z } from "zod";

export const searchInputSchema = z.object({
  query: z.string().trim().min(1).max(200),
  locale: z.enum(["zh", "en"]).default("zh"),
  limit: z.number().int().min(1).max(20).default(8),
});

export const searchResultSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  snippet: z.string().max(299),
});

export const searchOutputSchema = z.object({
  results: z.array(searchResultSchema),
});

export const publishInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content_md: z
    .string()
    .min(1)
    .max(100_000)
    .refine((value) => value.trim().length > 0),
  description: z.string().trim().min(1).max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
});

export const publishOutputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  url: z.string().url(),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type PublishInput = z.infer<typeof publishInputSchema>;
export type PublishOutput = z.infer<typeof publishOutputSchema>;
