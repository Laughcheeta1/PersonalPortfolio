import { defineConfig } from 'vite';

const redirectTutorialWithoutSlash = (server: { middlewares: { use: (handler: (request: { url?: string }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void }, next: () => void) => void) => void } }) => {
  server.middlewares.use((request, response, next) => {
    const match = request.url?.match(/^(.*\/tutorial)(\?.*)?$/);
    if (!match) {
      next();
      return;
    }
    response.statusCode = 302;
    response.setHeader('Location', `${match[1]}/${match[2] ?? ''}`);
    response.end();
  });
};

export default defineConfig(({ command }) => ({
  root: '.',
  envDir: '.',
  base: command === 'build' ? '/PersonalPortfolio/' : '/',
  appType: 'mpa',
  plugins: [{ name: 'tutorial-canonical-route', configureServer: redirectTutorialWithoutSlash, configurePreviewServer: redirectTutorialWithoutSlash }],
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        tutorial: new URL('./tutorial/index.html', import.meta.url).pathname,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 53173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 54173,
    strictPort: true,
  },
}));
