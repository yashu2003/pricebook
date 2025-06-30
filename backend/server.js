const express = require('express');
const path = require('path');
const app = express();
const authRoutes = require('./routes/authRoutes');
const PORT = process.env.PORT || 5000;
require('dotenv').config();


// Middleware
app.use(express.json());
app.use('/api', authRoutes);

// ✅ Serve static files (images, css, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/homepage.html'));
});

// ✅ Serve department login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login_department.html'));
});

// ✅ Serve admin login page as homepage
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login_admin.html'));
});

// ✅ All unmatched routes return 404
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
