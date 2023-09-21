const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());

// Connect to your MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/social_media_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Mongoose models
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

// User Registration API
app.post('/api/register', (req, res) => {
  const { email, password, username } = req.body;

  // Check if required fields are present
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Check if the username or email is already registered
  User.findOne({ $or: [{ email }, { username }] }, (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({ email, password, username });

    newUser.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      return res.status(201).json({ message: 'User registered successfully' });
    });
  });
});


// Forget User Password API (Task 1)
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


// Create a Post API (Task 2)
app.post('/api/posts', async (req, res) => {
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

// Read a Post API (Task 2)
app.get('/api/posts/:postId', async (req, res) => {
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

// Update a Post API (Task 2)
app.put('/api/posts/:postId', async (req, res) => {
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

// Delete a Post API (Task 2)
app.delete('/api/posts/:postId', async (req, res) => {
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

// Like a Post API (Task 2)
app.post('/api/posts/:postId/like', async (req, res) => {
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

// Add Comment to Post API (Task 2)
app.post('/api/posts/:postId/comments', async (req, res) => {
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
