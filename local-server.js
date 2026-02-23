// Local server to test serverless function
const http = require('http');
const handler = require('./serverless.cjs');

const PORT = 3001; // Changed from 3000 to 3001 to avoid conflicts

const server = http.createServer((req, res) => {
  console.log(`\n=== REQUEST RECEIVED ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Path: ${req.url.split('?')[0]}`);
  
  // Call the serverless handler
  handler(req, res);
});

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
  console.log(`- http://localhost:${PORT}/`);
  console.log(`- http://localhost:${PORT}/api/health`);
  console.log(`- http://localhost:${PORT}/api/hello`);
  console.log(`- http://localhost:${PORT}/api/test`);
  console.log('\n💡 Open these URLs in your browser to test.');
});