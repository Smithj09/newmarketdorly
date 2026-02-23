// Vercel serverless function - serves complete React app
const fs = require('fs');
const path = require('path');

module.exports = function(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }
    
    // Get path
    const pathname = req.url ? req.url.split('?')[0] : '/';
    
    // API routes
    if (pathname === '/api/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    
    if (pathname === '/api/hello') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Hello from Vercel!' }));
      return;
    }
    
    // Serve static assets
    if (pathname.startsWith('/assets/')) {
      const filePath = path.join(__dirname, 'dist', pathname);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Asset not found');
          return;
        }
        
        // Set content type
        if (pathname.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (pathname.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (pathname.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (pathname.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        }
        
        res.statusCode = 200;
        res.end(data);
      });
      return;
    }
    
    // Serve index.html for all other routes (React Router)
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        // Fallback to simple HTML if index.html not found
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Adorly Market</h1><p>Welcome to your e-commerce store!</p>');
        return;
      }
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    });
  } catch (error) {
    // Handle any errors
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Error</h1><p>Internal server error</p>');
  }
};