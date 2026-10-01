import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const localPageRoutes = {
  name: 'local-page-routes',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/profile' || url.pathname === '/campaigns') {
        response.writeHead(302, {Location: url.pathname + '.html' + url.search});
        response.end();
      } else next();
    });
  },
};
export default defineConfig({ plugins: [localPageRoutes, react()], build: {rollupOptions: {input: {main: 'index.html', campaigns: 'campaigns.html', profile: 'profile.html'}}} });
