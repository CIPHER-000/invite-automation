// Development server runner
const express = require('express');
const { createServer } = require('vite');
const path = require('path');

async function createDevServer() {
  const app = express();
  
  // Create Vite dev server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname, 'client'),
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  
  // API routes
  app.use('/api', require('./server/routes'));
  
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Dev server running on port ${port}`);
  });
}

createDevServer().catch(console.error);