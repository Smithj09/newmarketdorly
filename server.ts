import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('market.db');
const JWT_SECRET = process.env.JWT_SECRET || 'adorly-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    image_url TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    total_price REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Seed initial products if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const seedProducts = [
    // Perfume
    { name: 'Rose Elegance', description: 'A delicate floral scent with notes of fresh roses.', price: 85.00, image_url: 'https://picsum.photos/seed/perfume1/400/400', category: 'Perfume' },
    { name: 'Fresh Bloom', description: 'A vibrant and energetic citrus floral fragrance.', price: 65.00, image_url: 'https://picsum.photos/seed/perfume2/400/400', category: 'Perfume' },
    { name: 'Velvet Night', description: 'Deep, mysterious woody notes for evening wear.', price: 95.00, image_url: 'https://picsum.photos/seed/perfume3/400/400', category: 'Perfume' },
    { name: 'Citrus Splash', description: 'Refreshing lemon and bergamot summer scent.', price: 45.00, image_url: 'https://picsum.photos/seed/perfume4/400/400', category: 'Perfume' },
    // Clothes
    { name: 'Pink Floral Dress', description: 'Elegant summer dress with a beautiful floral pattern.', price: 55.00, image_url: 'https://picsum.photos/seed/clothes1/400/400', category: 'Clothes' },
    { name: 'Stylish Denim Jacket', description: 'Classic blue denim with a modern oversized fit.', price: 75.00, image_url: 'https://picsum.photos/seed/clothes2/400/400', category: 'Clothes' },
    { name: 'Comfy Sweatshirt', description: 'Soft cotton blend sweatshirt in pastel pink.', price: 40.00, image_url: 'https://picsum.photos/seed/clothes3/400/400', category: 'Clothes' },
    { name: 'Elegant Blouse', description: 'Silk-feel blouse perfect for office or dinner.', price: 48.00, image_url: 'https://picsum.photos/seed/clothes4/400/400', category: 'Clothes' },
    // Phone
    { name: 'Smartphone Pro', description: 'Latest flagship with triple camera system.', price: 999.00, image_url: 'https://picsum.photos/seed/phone1/400/400', category: 'Phone' },
    { name: 'Budget Smartphone', description: 'Reliable performance at an accessible price.', price: 299.00, image_url: 'https://picsum.photos/seed/phone2/400/400', category: 'Phone' },
    { name: 'Gaming Phone', description: 'High refresh rate screen and cooling system.', price: 799.00, image_url: 'https://picsum.photos/seed/phone3/400/400', category: 'Phone' },
    { name: 'Flip Phone', description: 'Modern foldable technology in a compact form.', price: 1199.00, image_url: 'https://picsum.photos/seed/phone4/400/400', category: 'Phone' },
    // Electronics
    { name: 'Wireless Earbuds', description: 'Noise cancelling with 24-hour battery life.', price: 129.00, image_url: 'https://picsum.photos/seed/elec1/400/400', category: 'Electronics' },
    { name: 'Smartwatch', description: 'Track your fitness and stay connected.', price: 199.00, image_url: 'https://picsum.photos/seed/elec2/400/400', category: 'Electronics' },
    { name: 'Portable Charger', description: '20000mAh capacity for multiple charges.', price: 35.00, image_url: 'https://picsum.photos/seed/elec3/400/400', category: 'Electronics' },
    { name: 'Bluetooth Speaker', description: 'Waterproof with 360-degree sound.', price: 59.00, image_url: 'https://picsum.photos/seed/elec4/400/400', category: 'Electronics' },
  ];

  const insert = db.prepare('INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)');
  seedProducts.forEach(p => insert.run(p.name, p.description, p.price, p.image_url, p.category));
}

// Fallback products for when database is unavailable
const fallbackProducts = [
  // Perfume
  { name: 'Rose Elegance', description: 'A delicate floral scent with notes of fresh roses.', price: 85.00, image_url: 'https://picsum.photos/seed/perfume1/400/400', category: 'Perfume' },
  { name: 'Fresh Bloom', description: 'A vibrant and energetic citrus floral fragrance.', price: 65.00, image_url: 'https://picsum.photos/seed/perfume2/400/400', category: 'Perfume' },
  { name: 'Velvet Night', description: 'Deep, mysterious woody notes for evening wear.', price: 95.00, image_url: 'https://picsum.photos/seed/perfume3/400/400', category: 'Perfume' },
  { name: 'Citrus Splash', description: 'Refreshing lemon and bergamot summer scent.', price: 45.00, image_url: 'https://picsum.photos/seed/perfume4/400/400', category: 'Perfume' },
  // Clothes
  { name: 'Pink Floral Dress', description: 'Elegant summer dress with a beautiful floral pattern.', price: 55.00, image_url: 'https://picsum.photos/seed/clothes1/400/400', category: 'Clothes' },
  { name: 'Stylish Denim Jacket', description: 'Classic blue denim with a modern oversized fit.', price: 75.00, image_url: 'https://picsum.photos/seed/clothes2/400/400', category: 'Clothes' },
  { name: 'Comfy Sweatshirt', description: 'Soft cotton blend sweatshirt in pastel pink.', price: 40.00, image_url: 'https://picsum.photos/seed/clothes3/400/400', category: 'Clothes' },
  { name: 'Elegant Blouse', description: 'Silk-feel blouse perfect for office or dinner.', price: 48.00, image_url: 'https://picsum.photos/seed/clothes4/400/400', category: 'Clothes' },
  // Phone
  { name: 'Smartphone Pro', description: 'Latest flagship with triple camera system.', price: 999.00, image_url: 'https://picsum.photos/seed/phone1/400/400', category: 'Phone' },
  { name: 'Budget Smartphone', description: 'Reliable performance at an accessible price.', price: 299.00, image_url: 'https://picsum.photos/seed/phone2/400/400', category: 'Phone' },
  { name: 'Gaming Phone', description: 'High refresh rate screen and cooling system.', price: 799.00, image_url: 'https://picsum.photos/seed/phone3/400/400', category: 'Phone' },
  { name: 'Flip Phone', description: 'Modern foldable technology in a compact form.', price: 1199.00, image_url: 'https://picsum.photos/seed/phone4/400/400', category: 'Phone' },
  // Electronics
  { name: 'Wireless Earbuds', description: 'Noise cancelling with 24-hour battery life.', price: 129.00, image_url: 'https://picsum.photos/seed/elec1/400/400', category: 'Electronics' },
  { name: 'Smartwatch', description: 'Track your fitness and stay connected.', price: 199.00, image_url: 'https://picsum.photos/seed/elec2/400/400', category: 'Electronics' },
  { name: 'Portable Charger', description: '20000mAh capacity for multiple charges.', price: 35.00, image_url: 'https://picsum.photos/seed/elec3/400/400', category: 'Electronics' },
  { name: 'Bluetooth Speaker', description: 'Waterproof with 360-degree sound.', price: 59.00, image_url: 'https://picsum.photos/seed/elec4/400/400', category: 'Electronics' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const role = userCount.count === 0 ? 'admin' : 'user';

    try {
      db.prepare('INSERT OR IGNORE INTO users (id, username, role) VALUES (?, ?, ?)').run(id, username, role);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      // If no products in database, return fallback products
      if (Array.isArray(products) && products.length === 0) {
        res.json(fallbackProducts.map((p, i) => ({ id: i + 1, ...p })));
      } else {
        res.json(products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return fallback products on database error
      res.json(fallbackProducts.map((p, i) => ({ id: i + 1, ...p })));
    }
  });

  app.post('/api/products', authenticateToken, isAdmin, (req, res) => {
    const { name, description, price, image_url, category } = req.body;
    try {
      const result = db.prepare('INSERT INTO products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)').run(name, description, price, image_url, category);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, description, price, image_url, category } = req.body;
    const { id } = req.params;
    try {
      db.prepare('UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ? WHERE id = ?').run(name, description, price, image_url, category, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  app.get('/api/orders/my', authenticateToken, (req: any, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id) as any[];
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });
    res.json(ordersWithItems);
  });

  app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    const orders = db.prepare('SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY created_at DESC').all() as any[];
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `).all(order.id);
      return { ...order, items };
    });
    res.json(ordersWithItems);
  });

  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { items, total_price } = req.body;
    const transaction = db.transaction(() => {
      const orderResult = db.prepare('INSERT INTO orders (user_id, total_price) VALUES (?, ?)').run(req.user.id, total_price);
      const orderId = orderResult.lastInsertRowid;
      
      const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(orderId, item.id, item.quantity, item.price);
      }
      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ id: orderId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();