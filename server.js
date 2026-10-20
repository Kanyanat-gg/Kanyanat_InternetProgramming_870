const express = require('express');

const mysql = require('mysql2/promise');

const cors = require('cors');

const crypto = require('crypto'); // built-in ไม่ต้อง npm install

require('dotenv').config();

const app = express();

const port = process.env.PORT || 3102;

app.use(cors());

app.use(express.json({ limit: '5mb' }));

// MySQL Connection Pool

const pool = mysql.createPool({

  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  port: process.env.DB_PORT || 3306,

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  timezone: '+07:00',

});

(async function testMySQL() {

  try {

    const conn = await pool.getConnection();

    console.log('Connected to MySQL:', process.env.DB_NAME);

    conn.release();

  } catch (err) {

    console.error('MySQL Failed:', err.message);

    process.exit(1);

  }

})();

// ============ PASSWORD HASHING (ใช้ crypto.scrypt แทน bcrypt) ============

function hashPassword(password) {

  const salt = crypto.randomBytes(16).toString('hex');

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`; // เก็บทั้ง salt และ hash ไว้ในคอลัมน์เดียว

}

function verifyPassword(password, stored) {

  const [salt, hash] = stored.split(':');

  if (!salt || !hash) return false;

  const hashCheck = crypto.scryptSync(password, salt, 64).toString('hex');

  const a = Buffer.from(hash, 'hex');

  const b = Buffer.from(hashCheck, 'hex');

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);

}

// ============ TOKEN แบบ JWT เอง (ใช้ crypto.createHmac แทน jsonwebtoken) ============

function base64url(input) {

  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

}

function base64urlDecode(input) {

  input = input.replace(/-/g, '+').replace(/_/g, '/');

  while (input.length % 4) input += '=';

  return Buffer.from(input, 'base64').toString();

}

function createToken(payload, secret, expiresInSeconds = 7 * 24 * 60 * 60) {

  const header = { alg: 'HS256', typ: 'JWT' };

  const fullPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };

  const encodedHeader = base64url(JSON.stringify(header));

  const encodedPayload = base64url(JSON.stringify(fullPayload));

  const signature = crypto

    .createHmac('sha256', secret)

    .update(`${encodedHeader}.${encodedPayload}`)

    .digest('base64')

    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;

}

function verifyToken(token, secret) {

  const parts = token.split('.');

  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = crypto

    .createHmac('sha256', secret)

    .update(`${encodedHeader}.${encodedPayload}`)

    .digest('base64')

    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const a = Buffer.from(signature);

  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const payload = JSON.parse(base64urlDecode(encodedPayload));

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null; // หมดอายุ

  return payload;

}

// Middleware: ป้องกัน route ที่ต้อง login ก่อนถึงจะใช้ได้

function requireAuth(req, res, next) {

  const authHeader = req.headers.authorization; // รูปแบบ: "Bearer <token>"

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {

    return res.status(401).json({ error: 'ไม่พบ token กรุณาเข้าสู่ระบบ' });

  }

  const decoded = verifyToken(token, process.env.JWT_SECRET);

  if (!decoded) {

    return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });

  }

  req.user = decoded;

  next();

}

// Middleware: ต้อง login และต้องเป็น role admin เท่านั้น (ใช้กับ เพิ่ม/แก้ไข/ลบ สินค้า)

function requireAdmin(req, res, next) {

  requireAuth(req, res, () => {

    if (req.user.role !== 'admin') {

      return res.status(403).json({ error: 'สิทธิ์ไม่เพียงพอ เฉพาะแอดมินเท่านั้น' });

    }

    next();

  });

}

// ============ AUTH ============

// 1. LOGIN

app.post('/api/login', async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {

      return res.status(400).json({ success: false, message: 'กรุณากรอก username และ password' });

    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {

      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });

    }

    const user = rows[0];

    const match = verifyPassword(password, user.password);

    if (!match) {

      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });

    }

    const token = createToken({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET);

    return res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });

  } catch (err) {

    console.error('Login Error:', err.message);

    return res.status(500).json({ success: false, message: 'Login failed' });

  }

});

// 2. REGISTER

app.post('/api/register', async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {

      return res.status(400).json({ success: false, message: 'กรุณากรอก username และ password' });

    }

    // ตรวจสอบว่าชื่อผู้ใช้นี้ซ้ำหรือไม่

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);

    if (existing.length > 0) {

      return res.status(400).json({ success: false, message: 'Username นี้ถูกใช้งานแล้ว' });

    }

    // แฮชรหัสผ่าน

    const hashedPassword = hashPassword(password);

    // บันทึกผู้ใช้ใหม่ลงฐานข้อมูล (กำหนดสิทธิ์เป็น user ทั่วไป)

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';

    await pool.query(sql, [username, hashedPassword, 'user']);

    return res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });

  } catch (err) {

    console.error('Register Error:', err.message);

    return res.status(500).json({ success: false, message: 'Register failed' });

  }

});

// ============ PRODUCTS ============

app.get('/api/products', async (req, res) => {

  try {

    const { search, type } = req.query;

    let query = 'SELECT id, productCode, name, stock, category, location, price, status, image FROM inventory';

    let params = [];

    if (search) {

      if (type === 'id') {

        query += ' WHERE id = ?';

        params = [search];

      } else if (type === 'code') {

        query += ' WHERE productCode LIKE ?';

        params = [`%${search}%`];

      } else if (type === 'name') {

        query += ' WHERE name LIKE ?';

        params = [`%${search}%`];

      } else if (type === 'price') {

        query += ' WHERE price LIKE ?';

        params = [`%${search}%`];

      } else if (type === 'category') {

        query += ' WHERE category = ?';

        params = [search];

      } else {

        query += ' WHERE name LIKE ? OR productCode LIKE ? OR category LIKE ? OR id = ? OR price LIKE ?';

        params = [`%${search}%`, `%${search}%`, `%${search}%`, search, `%${search}%`];

      }

    }

    const [rows] = await pool.query(query, params);

    res.json(rows);

  } catch (err) {

    console.error('Products Error:', err.message);

    res.status(500).json({ error: 'Failed to fetch products' });

  }

});

app.post('/api/products', requireAdmin, async (req, res) => {

  try {

    const { name, stock, category, location, price, status, image, productCode } = req.body;

    if (!name) {

      return res.status(400).json({ error: 'Name is required' });

    }

    const sql = `

      INSERT INTO inventory (name, stock, category, location, price, status, image, productCode)

      VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    `;

    const [result] = await pool.query(sql, [name, stock || 0, category || null, location || null, price || 0, status || 'Active', image || null, productCode || null]);

    return res.status(201).json({ success: true, productId: result.insertId });

  } catch (err) {

    console.error('Create Product Error:', err.message);

    return res.status(500).json({ error: 'Failed to create product' });

  }

});

app.put('/api/products/:id', requireAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const { name, stock, category, location, price, status, image, productCode } = req.body;

    if (!name) {

      return res.status(400).json({ error: 'Name is required' });

    }

    const sql = `

      UPDATE inventory

      SET name = ?, stock = ?, category = ?, location = ?, price = ?, status = ?, image = ?, productCode = ?

      WHERE id = ?

    `;

    const [result] = await pool.query(sql, [name, stock || 0, category || null, location || null, price || 0, status || 'Active', image || null, productCode || null, id]);

    if (result.affectedRows === 0) {

      return res.status(404).json({ error: 'Product not found' });

    }

    return res.json({ success: true, message: 'Product updated successfully' });

  } catch (err) {

    console.error('Update Product Error:', err.message);

    res.status(500).json({ error: 'Failed to update product' });

  }

});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const sql = 'DELETE FROM inventory WHERE id = ?';

    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {

      return res.status(404).json({ error: 'Product not found' });

    }

    return res.json({ success: true, message: 'Product deleted successfully' });

  } catch (err) {

    console.error('Delete Product Error:', err.message);

    res.status(500).json({ error: 'Failed to delete product' });

  }

});

app.post('/api/products/delete/:id', requireAdmin, async (req, res) => {

  try {

    const { id } = req.params;

    const sql = 'DELETE FROM inventory WHERE id = ?';

    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {

      return res.status(404).json({ error: 'Product not found' });

    }

    return res.json({ success: true, message: 'Product deleted successfully' });

  } catch (err) {

    console.error('Delete Product Error (POST):', err.message);

    res.status(500).json({ error: 'Failed to delete product' });

  }

});

// ============ ซื้อสินค้า (ผู้ใช้ทั่วไป login แล้วซื้อได้ สต็อกจะลดจริงในฐานข้อมูล) ============

app.post('/api/products/:id/purchase', requireAuth, async (req, res) => {

  const conn = await pool.getConnection();

  try {

    const { id } = req.params;

    const quantity = Number(req.body.quantity) || 1;

    if (quantity <= 0) {

      conn.release();

      return res.status(400).json({ error: 'จำนวนที่ซื้อไม่ถูกต้อง' });

    }

    await conn.beginTransaction();

    // ล็อกแถวนี้ไว้ก่อนเช็คสต็อก กันปัญหาซื้อพร้อมกันแล้วสต็อกติดลบ

    const [rows] = await conn.query('SELECT stock FROM inventory WHERE id = ? FOR UPDATE', [id]);

    if (rows.length === 0) {

      await conn.rollback();

      conn.release();

      return res.status(404).json({ error: 'ไม่พบสินค้านี้' });

    }

    const currentStock = Number(rows[0].stock);

    if (currentStock < quantity) {

      await conn.rollback();

      conn.release();

      return res.status(400).json({ error: 'สินค้าในสต็อกไม่เพียงพอ' });

    }

    await conn.query('UPDATE inventory SET stock = stock - ? WHERE id = ?', [quantity, id]);

    await conn.commit();

    conn.release();

    return res.json({ success: true, message: 'ซื้อสินค้าสำเร็จ', remainingStock: currentStock - quantity });

  } catch (err) {

    await conn.rollback();

    conn.release();

    console.error('Purchase Error:', err.message);

    res.status(500).json({ error: 'ซื้อสินค้าไม่สำเร็จ' });

  }

});

app.listen(port, '0.0.0.0', () => {

  console.log(`API running on port ${port}`);

});
 