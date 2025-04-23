import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'browser/',
    lib: {
      entry: 'src/index.ts',
      fileName: (format) => `oauth2-client.min.js`,
      formats: ['es'],
    },
    minify: true,
  }
});
