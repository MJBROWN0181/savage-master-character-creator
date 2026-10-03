import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import supportPlugin from './support-vite-plugin.mjs';

const localPageRoutes = {
  name: 'local-page-routes',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/create' || url.pathname === '/chronicles' || url.pathname === '/profile' || url.pathname === '/campaigns' || url.pathname === '/dnd' || url.pathname === '/pathfinder' || url.pathname === '/builder' || url.pathname === '/pricing') {
        response.writeHead(302, {Location: url.pathname + '.html' + url.search});
        response.end();
      } else next();
    });
  },
};
export default defineConfig({ plugins: [localPageRoutes, supportPlugin(), react()], build: {rollupOptions: {input: {create: 'create.html', support: 'support.html', chronicles: 'chronicles.html',
        main: 'index.html', campaigns: 'campaigns.html', profile: 'profile.html', dnd: 'dnd.html', pathfinder: 'pathfinder.html', builder: 'builder.html', pricing: 'pricing.html'}}} });
