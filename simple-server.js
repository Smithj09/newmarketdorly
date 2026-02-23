import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET'
    }
  });
});

// Products route
app.get('/api/products', (req, res) => {
  const products = [
    { id: 1, name: 'Test Product', price: 99.99, category: 'Test' }
  ];
  res.json(products);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;