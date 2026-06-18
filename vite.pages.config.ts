import path from 'path';
import { defineConfig } from 'vite';

const appRoot = 'src/app-public';

export default defineConfig({
  root: appRoot,
  base: '/ksef-pdf-generator/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@lib-public': path.resolve(__dirname, 'src/lib-public'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'pages-dist'),
    emptyOutDir: true,
  },
});
