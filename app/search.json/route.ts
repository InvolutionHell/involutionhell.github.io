import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";
import { createTokenizer } from "@orama/tokenizers/mandarin";

// Ensure this route is statically generated during `next export`.
export const dynamic = "force-static";

// Static search database for static export (Next.js `output: "export"`).
const api = createFromSource(source, {
  components: {
    tokenizer: createTokenizer(),
  },
  search: {
    threshold: 0,
    tolerance: 0,
  },
});
export const GET = api.staticGET;
