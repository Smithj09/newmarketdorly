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

// Export the app
module.exports = app;