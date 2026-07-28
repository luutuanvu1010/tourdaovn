import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  site: 'https://tourdao.vn',
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
    routing: { prefixDefaultLocale: false },
  },
});
