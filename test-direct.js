// Test the serverless function directly without HTTP server
const handler = require('./serverless.cjs');

console.log('🧪 Testing serverless function directly...\n');

// Test different paths
const testPaths = ['/', '/api/health', '/api/hello', '/api/test'];

testPaths.forEach(path => {
  console.log(`📤 Testing: ${path}`);
  
  const mockReq = {
    url: path,
    method: 'GET',
    headers: {}
  };

  const mockRes = {
    statusCode: 0,
    headers: {},
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    end: function(data) {
      console.log(`📥 Response Status: ${this.statusCode}`);
      console.log(`📥 Response Body: ${data}`);
      console.log('---');
    }
  };

  handler(mockReq, mockRes);
});