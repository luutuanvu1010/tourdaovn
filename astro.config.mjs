import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { site } from './src/site.config.ts';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  site: site.url,
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
    routing: { prefixDefaultLocale: false },
  },
});
