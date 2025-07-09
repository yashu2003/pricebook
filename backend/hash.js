// hash.js
const bcrypt = require('bcryptjs');
const { lstat } = require('fs');

bcrypt.hash('nivi123@', 10).then(hash => {
  console.log("Hashed password:", hash);
});

