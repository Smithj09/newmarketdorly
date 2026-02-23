// Simple hello world server
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => {
    console.log(`Hello server running on http://localhost:${PORT}`);
  });
}

// Export the app
module.exports = app;