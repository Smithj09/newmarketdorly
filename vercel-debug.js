// Minimal Vercel debug server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
try {
  dotenv.config({ path: '.env.local' });
  console.log('Environment variables loaded from .env.local');
} catch (error) {
  console.error('Error loading .env.local:', error);
}

console.log('Process environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('VITE_SUPABASE_URL present:', !!process.env.VITE_SUPABASE_URL);

const app = express();
app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/test', (req, res) => {
  try {
    res.json({ 
      message: 'Server is working!',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET'
      }
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ error: 'Test route failed' });
  }
});

app.get('/health', (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in health route:', error);
    res.status(500).json({ status: 'error' });
  }
});

app.get('/', (req, res) => {
  try {
    res.send('Adorly Market API is running');
  } catch (error) {
    console.error('Error in root route:', error);
    res.status(500).send('Error in root route');
  }
});

// Export the app
module.exports = app;