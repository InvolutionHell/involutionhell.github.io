import { cache } from "react";

// Define contributor data structure
interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
}

// Use React's cache function for request caching and deduplication
export const getContributors = cache(
  async (filePath: string): Promise<Contributor[]> => {
    try {
      // Use GITHUB_TOKEN environment variable for authorization to increase API rate limit
      const headers: HeadersInit = {};
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/InvolutionHell/involutionhell.github.io/commits?path=${filePath}`,
        {
          headers,
          // Use next.revalidate to configure cache strategy (e.g., revalidate every hour)
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        // If request fails, return empty array
        console.error(
          `Failed to fetch contributors for ${filePath}: ${response.statusText}`,
        );
        return [];
      }

      const commits = await response.json();

      // Use Map to deduplicate contributors
      const uniqueContributors = new Map<string, Contributor>();
      commits.forEach((commit: { author?: Contributor }) => {
        if (commit.author) {
          uniqueContributors.set(commit.author.login, {
            login: commit.author.login,
            avatar_url: commit.author.avatar_url,
            html_url: commit.author.html_url,
          });
        }
      });

      return Array.from(uniqueContributors.values());
    } catch (error) {
      console.error(`Error fetching contributors for ${filePath}:`, error);
      return [];
    }
  },
);
