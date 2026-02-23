// Vercel serverless function - serves React app and API
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
    
    // Serve React app HTML for all other routes
    console.log('🌐 Serving React app for:', requestPath);
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Adorly Market</title>
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(236, 72, 153, 0.1);
            max-width: 500px;
        }
        h1 {
            color: #ec4899;
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        .loading {
            color: #ec4899;
            font-size: 1.2rem;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ Adorly Market</h1>
        <p>Your premium e-commerce destination for perfumes, clothes, phones, and electronics</p>
        <div class="loading">Loading your shopping experience...</div>
        <p><small>If this message persists, check your deployment configuration.</small></p>
    </div>
</body>
</html>
    `);
  } catch (error) {
    // Handle any errors
    console.error('Error in serverless function:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};