import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    host: '0.0.0.0'
  },
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    react(),
    mdx()
  ],
  image: {
    remotePatterns: [
      {
        protocol: 'https'
      }
    ],
    domains: ['r2.dev']
  }
});
