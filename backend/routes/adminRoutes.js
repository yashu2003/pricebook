// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db'); // DB connection


// Middleware: Auth check for admin
function isAdminAuthenticated(req, res, next) {
  if (req.session.admin && req.session.admin.id) {
    next(); // Authenticated
  } else {
    // IMPORTANT: If you want to redirect to login, handle it on the frontend based on this status
    res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }
}

// POST /api/admin-login: Admin login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body; // Req body: email, password

  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]); // Fetch admin by email

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // No admin found
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password); // Compare password

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' }); // Password mismatch
    }

    req.session.admin = { email: admin.email, id: admin.id }; // Store session

    return res.json({ success: true, message: 'Login successful' }); // Success
  } catch (err) {
    console.error(err); // Log error
    res.status(500).json({ success: false, message: 'Server error' }); // Server error
  }
});

// GET /api/check-session: Check auth session
router.get('/check-session', (req, res) => {
  res.json({ authenticated: !!(req.session.admin && req.session.admin.id)}); // Auth status
});

// GET /api/logout: Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => { // Destroy session
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out.' }); // Logout error
    }
    res.clearCookie('connect.sid'); // Clear cookie
    res.json({ success: true, message: 'Logged out successfully.' }); // Success
  });
});

// NEW ENDPOINT: GET all products from the 'products' table
// Protected by isAdminAuthenticated middleware
router.get('/products', isAdminAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT product_id, product_name FROM products ORDER BY product_id ASC'); // Get all products
        res.json({ success: true, data: result.rows }); // Return products
    } catch (err) {
        console.error('Error fetching products:', err); // Log error
        res.status(500).json({ success: false, message: 'Failed to fetch products.' }); // Server error
    }
});

// NEW DYNAMIC ENDPOINT: GET data for a specific product table
// Protected by isAdminAuthenticated middleware
router.get('/product-data/:productId', isAdminAuthenticated, async (req, res) => {
    const { productId } = req.params; // Get product ID from URL

    // IMPORTANT: Map product_id to actual table names in your database.
    // Ensure these match your actual database product_ids and table names exactly (case-sensitive if created with quotes).
    const tableMap = {
        '1': 'pstn_replacement_fee', // Assuming product_id 1 is for pstn_replacement_fees
        '2': 'pstn_replacement_outbound',
        '3': 'international_outbound_rates' // Assuming product_id 2 is for pstn_replacement_outbound
        // Add more mappings as you add more product tables (e.g., '3': 'your_next_product_table')
    };

    const tableName = tableMap[productId];

    if (!tableName) {
        return res.status(404).json({ success: false, message: 'Product table not found for the given ID.' }); // Invalid product ID
    }

    try {
        // Construct the query dynamically. Using `ORDER BY 1 ASC` means order by the first column.
        const queryText = `SELECT * FROM ${tableName} ORDER BY 1 ASC`;
        const result = await db.query(queryText); // Fetch data
        res.json({ success: true, data: result.rows, tableName: tableName }); // Return data + table name
    } catch (err) {
        console.error(`Error fetching data for ${tableName} (Product ID: ${productId}):`, err); // Log error
        res.status(500).json({ success: false, message: `Failed to fetch data for product: ${tableName}.` }); // Server error
    }
});


module.exports = router;