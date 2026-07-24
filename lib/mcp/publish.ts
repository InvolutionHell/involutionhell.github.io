import type { ApiResponse, PostView } from "@/app/types/post";
import type { PublishInput, PublishOutput } from "@/lib/mcp/schemas";

const SITE_ORIGIN = "https://involutionhell.com";

export class PublishError extends Error {}

export async function publishPost(
  input: PublishInput,
  backendHeaders: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<PublishOutput> {
  let response: Response;
  try {
    response = await fetchImpl(
      `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/posts`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...backendHeaders,
        },
        body: JSON.stringify({
          title: input.title,
          contentMd: input.content_md,
          ...(input.description === undefined
            ? {}
            : { description: input.description }),
          ...(input.tags === undefined ? {} : { tags: input.tags }),
          ...(input.slug === undefined ? {} : { slug: input.slug }),
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    throw new PublishError(
      "Could not reach the InvolutionHell backend. Try again later.",
    );
  }

  if (response.status === 409) {
    throw new PublishError(
      "The slug already exists. Pick another slug and try again.",
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new PublishError(
      "Your token is expired or invalid. Sign in to InvolutionHell again to obtain a new satoken, then reconnect with Authorization: Bearer <satoken>.",
    );
  }
  if (!response.ok) {
    throw new PublishError(
      `The InvolutionHell backend could not publish the post (HTTP ${response.status}). Try again later.`,
    );
  }

  const body = (await response.json()) as ApiResponse<PostView>;
  if (!body.data?.slug || !body.data.authorUsername || !body.data.title) {
    throw new PublishError("The backend returned an invalid publish response.");
  }

  const path = `/u/${encodeURIComponent(body.data.authorUsername)}/posts/${encodeURIComponent(body.data.slug)}`;
  return {
    title: body.data.title,
    slug: body.data.slug,
    url: new URL(path, SITE_ORIGIN).toString(),
  };
}
