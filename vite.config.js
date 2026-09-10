import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'admin-routing-plugin',
      // Handles local dev server (npm run dev / npm start)
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '/';
          const [pathname, search] = rawUrl.split('?');
          const query = search ? `?${search}` : '';

          if (pathname === '/admin' || pathname === '/admin/') {
            req.url = `/admin/index.html${query}`;
          } else if (pathname === '/portfolio') {
            req.url = `/portfolio.html${query}`;
          }
          next();
        });
      },
      // Handles local preview server (npm run preview)
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '/';
          const [pathname, search] = rawUrl.split('?');
          const query = search ? `?${search}` : '';

          if (pathname === '/admin' || pathname === '/admin/') {
            req.url = `/admin/index.html${query}`;
          } else if (pathname === '/portfolio') {
            req.url = `/portfolio.html${query}`;
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
