const express = require('express');
const path = require('path');
const app = express();
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');

const PORT = process.env.PORT || 5000;
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
app.use(express.json());

app.use(session({
  secret: 'your-super-secret-key', // 🔐 Change this to a strong random string
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour
    httpOnly: true,
    // secure: true, // Uncomment if using HTTPS
  }  
}));

app.use('/api', adminRoutes);



// Middleware

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
app.get('/dashboard', (req, res) => {
  if (!req.session.admin || !req.session.admin.id) {
    return res.redirect('/admin'); // back to login page
  }
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});


// ✅ All unmatched routes return 404
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});






// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
