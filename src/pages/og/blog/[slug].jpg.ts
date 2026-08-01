import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, type GhostPost } from '@/lib/ghost';
import { renderOgImage } from '@/lib/og';

// Only used as a fallback when a Ghost post has no feature_image set —
// [slug].astro prefers post.feature_image when present.
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts();
  return posts
    .filter((post) => !post.feature_image)
    .map((post) => ({ params: { slug: post.slug }, props: { post } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: GhostPost };

  const displayTitle = post.title.length > 60 ? post.title.slice(0, 57) + '…' : post.title;
  const displayExcerpt =
    post.excerpt.length > 140 ? post.excerpt.slice(0, 137) + '...' : post.excerpt;

  const jpeg = await renderOgImage({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { width: '100%', height: '4px', backgroundColor: '#22c55e' },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '40px 60px 50px',
              justifyContent: 'space-between',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '10px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: { fontSize: 22, color: '#22c55e', fontWeight: 700 },
                        children: 'AiNaiDee Blog',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 54, fontWeight: 700, color: '#ededef', lineHeight: 1.15 },
                        children: displayTitle,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 24, color: '#8a8a97', lineHeight: 1.5, marginTop: '16px' },
                        children: displayExcerpt,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  });

  // Buffer satisfies BodyInit at runtime but not in TS lib types; wrap it.
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
