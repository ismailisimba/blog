import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderHomepage } from './controllers/articleController.js';
import methodOverride from 'method-override';

import './services/passport.js';
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); 

const PgStore = connectPgSimple(session);
const pgPool = new pg.Pool({
  //connectionString: process.env.DATABASE_URL,
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: process.env.DB_PASSWORD, // <-- ADD THIS LINE
  port: 5432,

});

app.use(session({
  store: new PgStore({
    pool: pgPool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

import authRoutes from './routes/authRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import userRoutes from './routes/userRoutes.js'; // <-- ADD THIS
import seoRoutes from './routes/seoRoutes.js'; 
import fileRoutes from './routes/fileRoutes.js'; 


app.use(authRoutes);
app.use(articleRoutes);
app.use('/api', apiRoutes);  
app.use(userRoutes); // <-- AND THIS
app.use(seoRoutes); // <-- ADD THIS
app.use('/files', fileRoutes); 


// Add robots.txt route
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    const content = `User-agent: *\nAllow: /\n\nSitemap: ${process.env.BASE_URL}/sitemap.xml`;
    res.send(content);
});

app.get('/', renderHomepage);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
