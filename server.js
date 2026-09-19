const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    /\.web\.app$/,          // Firebase Hosting
    /\.firebaseapp\.com$/,  // Firebase Hosting
    /\.up\.railway\.app$/   // Railway frontend (if used)
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Create pooled connection - supports local MySQL and Railway MySQL
const dbConfig = {
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'Root@123',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'auth_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Railway provides MYSQLHOST and MYSQLPORT automatically
if (process.env.MYSQLHOST) {
  dbConfig.host = process.env.MYSQLHOST;
  dbConfig.port = parseInt(process.env.MYSQLPORT) || 3306;
} else if (process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/')) {
  dbConfig.socketPath = process.env.DB_HOST;
} else {
  dbConfig.host = process.env.DB_HOST || 'localhost';
}

const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Generate token
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-mysql-jwt-secret-key',
    { expiresIn: '7d' }
  );
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-mysql-jwt-secret-key');
};

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = verifyToken(token);
    
    let user;
    if (decoded.isAdmin) {
      const [adminRows] = await pool.execute(
        'SELECT id, admin_id as adminId, name, email, permissions, created_at as createdAt FROM admins WHERE id = ?',
        [decoded.id]
      );
      user = adminRows[0];
    } else {
      const [userRows] = await pool.execute(
        'SELECT id, name, email, phone, is_admin as isAdmin, admin_id as adminId, created_at as createdAt FROM users WHERE id = ?',
        [decoded.id]
      );
      user = userRows[0];
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    req.user = { ...decoded, ...user };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

// ========== ROUTES ==========

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Test route
app.get('/api/', (req, res) => {
  res.json({ message: 'MySQL Auth API is running!' });
});

// User Registration
app.post('/api/auth/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, confirmPassword, phone } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const [existingRows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (existingRows.length) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password, is_admin, admin_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, hashedPassword, false, null]
    );

    // Get created user
    const [userRows] = await pool.execute(
      'SELECT id, name, email, phone, is_admin as isAdmin, admin_id as adminId, created_at as createdAt FROM users WHERE id = ?',
      [result.insertId]
    );
    const user = userRows[0];

    const token = generateToken({
      id: user.id,
      isAdmin: false
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Admin Registration
app.post('/api/auth/register/admin', async (req, res) => {
  try {
    const { adminName, adminEmail, adminId, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if admin already exists
    const [existingRows] = await pool.execute(
      `SELECT * FROM admins WHERE email = ? OR admin_id = ?`,
      [adminEmail, adminId]
    );
    if (existingRows.length) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or ID already exists'
      });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO admins (admin_id, name, email, password, permissions) 
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, adminName, adminEmail, hashedPassword, JSON.stringify(['read', 'write', 'delete'])]
    );

    // Get created admin
    const [adminRows] = await pool.execute(
      'SELECT id, admin_id as adminId, name, email, permissions, created_at as createdAt FROM admins WHERE id = ?',
      [result.insertId]
    );
    const admin = adminRows[0];

    const token = generateToken({
      id: admin.id,
      isAdmin: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        adminId: admin.adminId,
        isAdmin: true
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, isAdmin, adminId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Admin login
    if (isAdmin) {
      console.log('🔐 Admin login attempt:', { username, adminId, isAdmin });
      
      if (!adminId) {
        console.log('❌ Admin ID missing');
        return res.status(400).json({
          success: false,
          message: 'Admin ID is required for admin login'
        });
      }

      const [adminRows] = await pool.execute(
        `SELECT id, admin_id as adminId, name, email, password, permissions 
         FROM admins WHERE email = ? OR admin_id = ?`,
        [username, username]
      );
      const admin = adminRows[0];
      
      console.log('📋 Admin found:', admin ? `${admin.name} (${admin.email})` : 'None');
      
      if (!admin) {
        console.log('❌ No admin found with username:', username);
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }
      
      const passwordMatch = await bcrypt.compare(password, admin.password);
      console.log('🔑 Password match:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('❌ Password does not match for:', admin.email);
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }
      
      console.log('✅ Admin login successful:', admin.email);

      const token = generateToken({
        id: admin.id,
        isAdmin: true
      });

      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          adminId: admin.adminId,
          isAdmin: true
        }
      });
    }

    // User login
    const [userRows] = await pool.execute(
      `SELECT id, name, email, phone, password, is_admin as isAdmin, admin_id as adminId 
       FROM users WHERE email = ? OR phone = ?`,
      [username, username]
    );
    const user = userRows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({
      id: user.id,
      isAdmin: user.isAdmin
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    let user;
    
    if (req.user.isAdmin) {
      const [adminRows] = await pool.execute(
        'SELECT id, admin_id as adminId, name, email, permissions, created_at as createdAt FROM admins WHERE id = ?',
        [req.user.id]
      );
      user = adminRows[0];
    } else {
      const [userRows] = await pool.execute(
        'SELECT id, name, email, phone, is_admin as isAdmin, admin_id as adminId, created_at as createdAt FROM users WHERE id = ?',
        [req.user.id]
      );
      user = userRows[0];
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        isAdmin: req.user.isAdmin
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Forgot password route
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // In production: create reset token and send email. Here we just return success.
    return res.json({ 
      success: true,
      message: 'If the email exists, password reset instructions were sent.' 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
  await testConnection();
  console.log(`Auth API running on http://localhost:${PORT}`);
});