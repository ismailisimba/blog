import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderHomepage } from './controllers/articleController.js'; // Import the new function

// Import Passport configuration
import './services/passport.js';

// Load environment variables
dotenv.config();

// ESM doesn't have __dirname, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_development',
  resave: false,
  saveUninitialized: false,
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

import authRoutes from './routes/authRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
app.use(authRoutes);
app.use(articleRoutes); 

// --- ROUTES ---
app.get('/', renderHomepage);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
