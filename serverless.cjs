// Vercel serverless function - API only
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
    const path = req.url.split('?')[0];
    
    // Handle API routes only
    if (path === '/api/hello') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Hello from Vercel!' }));
    } else if (path === '/api/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
    } else if (path === '/api/test') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        message: 'Test successful',
        path: path,
        method: req.method,
        timestamp: new Date().toISOString()
      }));
    } else {
      // For non-API routes, let Vercel serve the React app
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'API route not found' }));
    }
  } catch (error) {
    // Handle any errors
    console.error('Error in serverless function:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};