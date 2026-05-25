import { defineConfig, defineCollection, s } from 'velite';

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.md',
  schema: s
    .object({
      title: s.string(),
      pubDate: s.isodate(),
      description: s.string(),
      image: s.object({
        url: s.string(),
        alt: s.string(),
      }),
      tags: s.array(s.string()),
      body: s.markdown(),
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      slug: data.slug.replace(/^posts\//, ''),
    })),
});

const sites = defineCollection({
  name: 'Site',
  pattern: 'sites/**/*.md',
  schema: s
    .object({
      title: s.string(),
      tagline: s.string(),
      description: s.string(),
      live: s.string(),
      isNew: s.boolean().optional(),
      details: s
        .array(
          s.object({
            label: s.string(),
            value: s.string(),
          }),
        )
        .optional(),
      thumbnail: s.object({
        url: s.string(),
        alt: s.string(),
      }),
      tags: s.array(s.string()).optional(),
      body: s.markdown(),
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      slug: data.slug.replace(/^sites\//, ''),
    })),
});

const store = defineCollection({
  name: 'StoreItem',
  pattern: 'store/**/*.md',
  schema: s
    .object({
      price: s.string(),
      title: s.string(),
      preview: s.string(),
      checkout: s.string(),
      license: s.string(),
      highlights: s.array(s.string()),
      description: s.string(),
      features: s.array(
        s.object({
          title: s.string(),
          description: s.string(),
        }),
      ),
      image: s.object({
        url: s.string(),
        alt: s.string(),
      }),
      gallery: s
        .array(
          s.object({
            url: s.string(),
            alt: s.string(),
          }),
        )
        .optional(),
      body: s.markdown(),
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      slug: data.slug.replace(/^store\//, ''),
    })),
});

const legal = defineCollection({
  name: 'Legal',
  pattern: 'legal/**/*.md',
  schema: s
    .object({
      page: s.string(),
      pubDate: s.isodate(),
      body: s.markdown(),
      slug: s.path(),
    })
    .transform((data) => ({
      ...data,
      slug: data.slug.replace(/^legal\//, ''),
    })),
});

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/velite',
    base: '/velite/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { posts, sites, store, legal },
});
