// Ultra-minimal Vercel serverless function
module.exports = function(req, res) {
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
  const path = req.url ? req.url.split('?')[0] : '/';
  
  // API routes
  if (path === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  if (path === '/api/hello') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Hello from Vercel!' }));
    return;
  }
  
  // Default to HTML
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Adorly Market</h1><p>Welcome to your e-commerce store!</p>');
};