import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Define a port, falling back to 3000 if not specified in .env
const PORT = process.env.PORT || 3000;

// Define a basic route for the homepage
app.get('/', (req, res) => {
  res.send('Hello, Artsy World!');
});

// Start the server and listen for connections
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
