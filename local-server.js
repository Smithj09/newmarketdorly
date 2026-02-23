// Local server to serve React app and API endpoints
const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./serverless.cjs');

const PORT = 3001;

const server = http.createServer((req, res) => {
  console.log(`\n=== REQUEST RECEIVED ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Path: ${req.url.split('?')[0]}`);
  
  const requestPath = req.url.split('?')[0];
  
  // Handle API routes
  if (requestPath.startsWith('/api/')) {
    console.log('📡 Handling API request');
    handler(req, res);
    return;
  }
  
  // Handle static files (React app)
  console.log('🌐 Serving React app');
  
  // Default to index.html for all non-API routes
  const filePath = requestPath === '/' ? '/index.html' : requestPath;
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
});

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

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.log('Try using a different port or stop the other server.');
  } else {
    console.error('\n❌ Server error:', error);
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Local server running on http://localhost:${PORT}`);
  console.log('\n📋 Test endpoints:');
  console.log(`- http://localhost:${PORT}/ (React app)`);
  console.log(`- http://localhost:${PORT}/api/health (API)`);
  console.log(`- http://localhost:${PORT}/api/hello (API)`);
  console.log('\n💡 Open these URLs in your browser to test.');
});