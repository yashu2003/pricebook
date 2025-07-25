const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const dataPath = path.join(__dirname, '../data/access_codes.json');



router.post('/department-login', (req, res) => {
  const { department, accessCode } = req.body;

  if (!department || !accessCode) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const codes = JSON.parse(fs.readFileSync(dataPath));

  if (codes[department] && codes[department] === accessCode) {
    // --- Add these two lines ---
    req.session.department = department;
    req.session.isDepartment = true;

    return res.json({ success: true, message: "Login successful" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid access code" });
  }
});



router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ connected: false, message: 'DB connection failed' });
  }
});

module.exports = router;
