const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 8000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtSecret = '7977e1b56e6b65a31570db96d09176af84f96b3cba2afaee858b1eff7f9d7933';

app.use(bodyParser.json());

// Connect to MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/social_media_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//  Mongoose models
const User = mongoose.model('User', {
  email: String,
  password: String,
  username: String,
});

const Post = mongoose.model('Post', {
  content: String,
  userId: mongoose.Types.ObjectId,
  likes: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  comments: [{ text: String, userId: mongoose.Types.ObjectId }],
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
}

// User Registration API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if required fields are present
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Check if the username or email is already registered
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user with the hashed password
    const newUser = new User({ email, password: hashedPassword, username });
    await newUser.save();

    // Create and send a JWT token
    const token = jwt.sign({ userId: newUser._id }, jwtSecret, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forget User Password API (T-1)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = generateResetToken();

    // Save the reset token to the user's record
    user.resetToken = resetToken;

    // Set an expiration time for the reset token
    user.resetTokenExpiration = Date.now() + 3600000;

    // Save the updated user with the reset token
    await user.save();

    // Send the reset token to the user's email

    res.json({ message: 'Password reset token sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a Post API (T-2)
app.post('/api/posts', verifyToken, async (req, res) => {
  try {
    const { content, userId } = req.body;

    // Create a new post
    const post = new Post({ content, userId });

    // Save the post to the database
    await post.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Read a Post API (T-2)
app.get('/api/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post by its ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a Post API (T-2)
app.put('/api/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    // Find the post by its ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Update the post content
    post.content = content;

    // Save the updated post
    await post.save();

    res.json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a Post API (T-2)
app.delete('/api/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post by its ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete the post
    await post.remove();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Like a Post API (T-2)
app.post('/api/posts/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Find the post by its ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'You have already liked this post' });
    }

    // Add the user's ID to the post's list of likes
    post.likes.push(userId);

    // Save the updated post
    await post.save();

    res.json({ message: 'Post liked successfully', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Comment to Post API (T-2)
app.post('/api/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;

    // Find the post by its ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add the comment to the post
    post.comments.push({ userId, text });

    // Save the updated post
    await post.save();

    res.json({ message: 'Comment added successfully', post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
