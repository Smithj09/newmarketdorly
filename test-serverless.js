// Test the serverless function directly
const handler = require('./serverless.cjs');

// Create a mock request and response
const mockReq = {
  url: '/api/health',
  method: 'GET',
  headers: {}
};

const mockRes = {
  statusCode: 200,
  headers: {},
  setHeader: function(name, value) {
    this.headers[name] = value;
  },
  end: function(data) {
    console.log('Response Status:', this.statusCode);
    console.log('Response Headers:', this.headers);
    console.log('Response Body:', data);
  }
};

console.log('Testing serverless function...');
console.log('Request URL:', mockReq.url);
console.log('Request Method:', mockReq.method);

// Call the handler
handler(mockReq, mockRes);