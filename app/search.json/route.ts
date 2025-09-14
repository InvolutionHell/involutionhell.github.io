import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// Ensure this route is statically generated during `next export`.
export const dynamic = "force-static";

// Static search database for static export (Next.js `output: "export"`).
const api = createFromSource(source);
export const GET = api.staticGET;
