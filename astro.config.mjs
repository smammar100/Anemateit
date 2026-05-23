import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import sanity from "@sanity/astro";
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: ['cdn.sanity.io'],
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "min-light"
    }
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true
  },
  site: 'https://yourdomain.com',
  integrations: [
    sitemap(),
    mdx(),
    sanity({
      projectId: 'tgexqefn',
      dataset: 'production',
      apiVersion: '2025-01-01',
      useCdn: true,
    }),
  ]
});
