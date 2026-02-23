// Vercel serverless function
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Export the serverless function
module.exports = app;