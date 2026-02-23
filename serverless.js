// Vercel serverless function - catch-all
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse URL to get path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Handle different paths
  if (path === '/' || path === '/index.html') {
    res.status(200).send('Hello World!');
  } else if (path === '/api/hello') {
    res.status(200).json({ message: 'Hello from Vercel!' });
  } else if (path === '/api/health') {
    res.status(200).json({ status: 'ok' });
  } else if (path === '/api/test') {
    res.status(200).json({ 
      message: 'Test successful',
      path: path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};