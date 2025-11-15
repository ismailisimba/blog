import bcrypt from 'bcrypt';
import passport from 'passport';
import { prisma } from '../services/prisma.js';

const SALT_ROUNDS = 10;

export const renderRegister = (req, res) => {
  res.render('pages/register', { user: req.user });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    // Log the user in directly after registration
    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (error) {
    // Handle errors (e.g., user already exists)
    console.error(error);
    res.redirect('/register');
  }
};

export const renderLogin = (req, res) => {
  res.render('pages/login', { user: req.user });
};

export const loginUser = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  // failureFlash: true // Optional: if you want to show flash messages
});

export const logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};
