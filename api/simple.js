// Simple Vercel serverless function - no Express
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Hello from Vercel!',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle other methods
  res.status(405).json({ error: 'Method not allowed' });
};