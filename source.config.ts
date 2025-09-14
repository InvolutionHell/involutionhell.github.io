import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "app/[locale]/docs",
});

export default defineConfig();
