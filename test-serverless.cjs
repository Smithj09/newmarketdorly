// Test the updated serverless function
const handler = require('./serverless.cjs');

console.log('🧪 Testing serverless function...\n');

// Test different paths
const testPaths = ['/', '/api/health', '/api/hello', '/api/test', '/shop', '/products'];

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
      console.log(`📥 Content-Type: ${this.headers['Content-Type'] || 'None'}`);
      
      if (this.headers['Content-Type'] === 'application/json') {
        console.log(`📥 Response Body: ${data}`);
      } else if (this.headers['Content-Type'] === 'text/html') {
        console.log(`📥 Response: HTML page (${data.length} characters)`);
        // Show first 200 characters of HTML
        console.log(`📥 Preview: ${data.substring(0, 200)}...`);
      } else {
        console.log(`📥 Response: ${data}`);
      }
      console.log('---');
    }
  };

  handler(mockReq, mockRes);
});