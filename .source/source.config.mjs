// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
var docs = defineDocs({
  dir: "app/docs"
});
var source_config_default = defineConfig();
export {
  source_config_default as default,
  docs
};
