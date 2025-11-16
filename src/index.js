import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderHomepage } from './controllers/articleController.js'; // Import the new function
import methodOverride from 'method-override';

// Import Passport configuration
import './services/passport.js';

// --- NEW IMPORTS ---
import pg from 'pg'; // The native postgres driver
import connectPgSimple from 'connect-pg-simple';
// --- END NEW IMPORTS ---

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
app.use(methodOverride('_method')); 

// Session Middleware
const PgStore = connectPgSimple(session);
const pgPool = new pg.Pool({
  // Use the DATABASE_URL from your environment variables
  connectionString: process.env.DATABASE_URL,
  // For production (Cloud Run), you might need SSL, but the Cloud SQL Proxy handles this.
  // For local dev, you might set ssl: false. This setup works for both.
});

// Session Middleware (UPDATED)
app.use(session({
  store: new PgStore({
    pool: pgPool,
    createTableIfMissing: true, // Automatically creates the session table
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
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
