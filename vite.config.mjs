import { defineConfig, loadEnv } from 'vite';
import { serveShare } from './api/share.mjs';
import { serveCard } from './api/post-card.mjs';
import react from '@vitejs/plugin-react';
import supportPlugin from './support-vite-plugin.mjs';

const localShareRoutes = (mode) => ({name:'local-social-posts',configureServer(server){const env=loadEnv(mode,process.cwd(),'');server.middlewares.use((req,res,next)=>{const url=new URL(req.url,'http://localhost');const match=url.pathname.match(/^\/p\/([a-z0-9]{20,64})$/);const options={convexUrl:env.VITE_CONVEX_URL,origin:'http://localhost:5173'};if(match){req.query={post:match[1]};serveShare(req,res,options);}else if(url.pathname==='/api/post-card')serveCard(req,res,options);else next();});}});
const localPageRoutes = {
  name: 'local-page-routes',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/create' || url.pathname === '/settings' || url.pathname === '/chronicles' || url.pathname === '/profile' || url.pathname === '/campaigns' || url.pathname === '/dnd' || url.pathname === '/pathfinder' || url.pathname === '/builder' || url.pathname === '/pricing') {
        response.writeHead(302, {Location: url.pathname + '.html' + url.search});
        response.end();
      } else next();
    });
  },
};
export default defineConfig(({mode})=>({ plugins: [localShareRoutes(mode), localPageRoutes, supportPlugin(), react()], build: {rollupOptions: {input: {create: 'create.html', settings: 'settings.html', support: 'support.html', chronicles: 'chronicles.html',
        main: 'index.html', campaigns: 'campaigns.html', profile: 'profile.html', dnd: 'dnd.html', pathfinder: 'pathfinder.html', builder: 'builder.html', pricing: 'pricing.html'}}} }));
