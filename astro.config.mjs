import { defineConfig } from 'astro/config';

const base = `/${(process.env.BASE_PATH ?? '').split('/').filter(Boolean).join('/')}`;

export default defineConfig({
  site: process.env.SITE_URL || 'https://apromisedland.github.io',
  base: base === '/' ? '/' : `${base}/`,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
