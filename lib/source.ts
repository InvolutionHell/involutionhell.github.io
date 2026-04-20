import { docs } from "@/.source";
import { loader, getSlugs } from "fumadocs-core/source";
import { convertSlugToPinyin } from "./leetcode-slug";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  transformers: [
    ({ storage }) => {
      for (const path of storage.getFiles()) {
        const file = storage.read(path);
        if (
          file &&
          file.format === "page" &&
          path.startsWith("career/interview-prep/leetcode/")
        ) {
          const defaultSlugs = getSlugs(path);
          const newSlugs = defaultSlugs.map(convertSlugToPinyin);

          // 强制覆盖 Fumadocs-MDX 预生成的 slugs
          file.slugs = newSlugs;
        }
      }
    },
  ],
});
