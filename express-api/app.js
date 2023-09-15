const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

const users = [];

// User Registration API
app.post('/api/register', (req, res) => {
  const { email, password, username } = req.body;

  // Check if required fields are present
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Check if the username or email is already registered
  const existingUser = users.find(
    (user) => user.email === email || user.username === username
  );

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create a new user
  const newUser = {
    email,
    password,
    username,
  };

  users.push(newUser);

  return res.status(201).json({ message: 'User registered successfully' });
});

// User Login API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  const user = users.find((user) => user.username === username);

  // Check if the user exists
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Check if the provided password matches the stored password
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  return res.json({ message: 'Login successful' });
});

// Forget User Password API (simplified)
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;

  // Find the user by email
  const user = users.find((user) => user.email === email);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate a password reset token (you would typically use a library for this)
  const resetToken = generateResetToken();

  // Send the reset token to the user's email (using nodemailer or another email library)

  return res.json({ message: 'Password reset token sent to your email' });
});

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
