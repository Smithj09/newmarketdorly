import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'adorly-secret-key';

// In-memory storage for serverless environment
let db: any = null;
let users: any[] = [];
let orders: any[] = [];

// Fallback products for serverless environment
const fallbackProducts = [
  // Perfume
  { id: 1, name: 'Rose Elegance', description: 'A delicate floral scent with notes of fresh roses.', price: 85.00, image_url: 'https://picsum.photos/seed/perfume1/400/400', category: 'Perfume' },
  { id: 2, name: 'Fresh Bloom', description: 'A vibrant and energetic citrus floral fragrance.', price: 65.00, image_url: 'https://picsum.photos/seed/perfume2/400/400', category: 'Perfume' },
  { id: 3, name: 'Velvet Night', description: 'Deep, mysterious woody notes for evening wear.', price: 95.00, image_url: 'https://picsum.photos/seed/perfume3/400/400', category: 'Perfume' },
  { id: 4, name: 'Citrus Splash', description: 'Refreshing lemon and bergamot summer scent.', price: 45.00, image_url: 'https://picsum.photos/seed/perfume4/400/400', category: 'Perfume' },
  // Clothes
  { id: 5, name: 'Pink Floral Dress', description: 'Elegant summer dress with a beautiful floral pattern.', price: 55.00, image_url: 'https://picsum.photos/seed/clothes1/400/400', category: 'Clothes' },
  { id: 6, name: 'Stylish Denim Jacket', description: 'Classic blue denim with a modern oversized fit.', price: 75.00, image_url: 'https://picsum.photos/seed/clothes2/400/400', category: 'Clothes' },
  { id: 7, name: 'Comfy Sweatshirt', description: 'Soft cotton blend sweatshirt in pastel pink.', price: 40.00, image_url: 'https://picsum.photos/seed/clothes3/400/400', category: 'Clothes' },
  { id: 8, name: 'Elegant Blouse', description: 'Silk-feel blouse perfect for office or dinner.', price: 48.00, image_url: 'https://picsum.photos/seed/clothes4/400/400', category: 'Clothes' },
  // Phone
  { id: 9, name: 'Smartphone Pro', description: 'Latest flagship with triple camera system.', price: 999.00, image_url: 'https://picsum.photos/seed/phone1/400/400', category: 'Phone' },
  { id: 10, name: 'Budget Smartphone', description: 'Reliable performance at an accessible price.', price: 299.00, image_url: 'https://picsum.photos/seed/phone2/400/400', category: 'Phone' },
  { id: 11, name: 'Gaming Phone', description: 'High refresh rate screen and cooling system.', price: 799.00, image_url: 'https://picsum.photos/seed/phone3/400/400', category: 'Phone' },
  { id: 12, name: 'Flip Phone', description: 'Modern foldable technology in a compact form.', price: 1199.00, image_url: 'https://picsum.photos/seed/phone4/400/400', category: 'Phone' },
  // Electronics
  { id: 13, name: 'Wireless Earbuds', description: 'Noise cancelling with 24-hour battery life.', price: 129.00, image_url: 'https://picsum.photos/seed/elec1/400/400', category: 'Electronics' },
  { id: 14, name: 'Smartwatch', description: 'Track your fitness and stay connected.', price: 199.00, image_url: 'https://picsum.photos/seed/elec2/400/400', category: 'Electronics' },
  { id: 15, name: 'Portable Charger', description: '20000mAh capacity for multiple charges.', price: 35.00, image_url: 'https://picsum.photos/seed/elec3/400/400', category: 'Electronics' },
  { id: 16, name: 'Bluetooth Speaker', description: 'Waterproof with 360-degree sound.', price: 59.00, image_url: 'https://picsum.photos/seed/elec4/400/400', category: 'Electronics' },
];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  };

  // API Routes
  app.post('/api/auth/sync', (req, res) => {
    const { id, username } = req.body;
    
    // Check if this is the first user to make them admin
    const role = users.length === 0 ? 'admin' : 'user';

    try {
      // Find or create user
      let user = users.find(u => u.id === id);
      if (!user) {
        user = { id, username, role };
        users.push(user);
      }
      
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  app.get('/api/products', (req, res) => {
    try {
      // Always return fallback products in serverless environment
      res.json(fallbackProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.json(fallbackProducts);
    }
  });

  app.post('/api/products', authenticateToken, isAdmin, (req, res) => {
    const { name, description, price, image_url, category } = req.body;
    try {
      // In serverless environment, we'll just return a mock response
      const newId = fallbackProducts.length + 1;
      res.json({ id: newId });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    try {
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    try {
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/orders/my', authenticateToken, (req: any, res) => {
    try {
      const userOrders = orders.filter(order => order.user_id === req.user.id);
      res.json(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.json([]);
    }
  });

  app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    try {
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.json([]);
    }
  });

  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { items, total_price } = req.body;
    try {
      const newOrder = {
        id: orders.length + 1,
        user_id: req.user.id,
        total_price,
        status: 'pending',
        created_at: new Date().toISOString(),
        items: items.map((item: any) => ({
          ...item,
          product_name: fallbackProducts.find(p => p.id === item.id)?.name || 'Product'
        }))
      };
      orders.push(newOrder);
      res.json({ id: newOrder.id });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
      const order = orders.find(o => o.id === parseInt(id));
      if (order) {
        order.status = status;
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (error) {
      console.error('Error starting Vite:', error);
    }
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      } catch (error) {
        console.error('Error sending index.html:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Start server with error handling
try {
  startServer();
} catch (error) {
  console.error('Error starting server:', error);
  // Create a simple fallback server
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Fallback routes
  app.get('/api/products', (req, res) => res.json(fallbackProducts));
  app.get('*', (req, res) => {
    res.status(200).send('Adorly Market API is running');
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Fallback server running on http://localhost:${PORT}`);
  });
}