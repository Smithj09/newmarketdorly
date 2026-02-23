// Vercel serverless function - serves React app and API
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }
    
    // Get path from URL
    const requestPath = req.url.split('?')[0];
    
    // Handle API routes
    if (requestPath.startsWith('/api/')) {
      console.log('📡 Handling API request:', requestPath);
      
      if (requestPath === '/api/hello') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Hello from Vercel!' }));
        return;
      } else if (requestPath === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      } else if (requestPath === '/api/test') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          message: 'Test successful',
          path: requestPath,
          method: req.method,
          timestamp: new Date().toISOString()
        }));
        return;
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'API route not found' }));
        return;
      }
    }
    
    // Serve React app for all other routes
    console.log('🌐 Serving React app for:', requestPath);
    
    // Default to index.html for all non-API routes
    const filePath = requestPath === '/' ? 'index.html' : requestPath.substring(1);
    const fullPath = path.join(__dirname, 'dist', filePath);
    
    // Check if file exists
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        // If file doesn't exist, serve index.html (for React Router)
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        fs.readFile(indexPath, (err, data) => {
          if (err) {
            res.statusCode = 404;
            res.end('File not found');
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
          }
        });
      } else {
        // Serve the requested file
        const ext = path.extname(fullPath);
        const contentType = getContentType(ext);
        
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.end(data);
      }
    });
  } catch (error) {
    // Handle any errors
    console.error('Error in serverless function:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};

function getContentType(ext) {
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'text/plain';
}