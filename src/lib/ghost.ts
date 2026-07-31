import GhostContentAPI from "@tryghost/content-api";

export interface GhostPost {
  id: string;
  slug: string;
  title: string;
  html: string;
  excerpt: string;
  feature_image: string | null;
  published_at: string;
  reading_time: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: { name: string; slug: string }[];
  authors: { name: string; profile_image: string | null }[];
}

const url = process.env.GHOST_URL;
const key = process.env.GHOST_CONTENT_API_KEY;

// Ghost isn't deployed yet — see docs/blog-plan.md. Every caller below returns
// an empty result instead of throwing, so the blog routes render a "coming
// soon" state and the rest of the site's build stays unaffected.
const api =
  url && key
    ? new GhostContentAPI({ url, key, version: "v6.0" })
    : null;

export const blogConfigured = api !== null;

export async function getPosts(): Promise<GhostPost[]> {
  if (!api) return [];
  return api.posts.browse({
    limit: "all",
    include: ["tags", "authors"],
  }) as unknown as Promise<GhostPost[]>;
}

export async function getPost(slug: string): Promise<GhostPost | null> {
  if (!api) return null;
  try {
    return (await api.posts.read(
      { slug },
      { include: ["tags", "authors"] }
    )) as unknown as GhostPost;
  } catch {
    return null;
  }
}
