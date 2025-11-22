import bcrypt from 'bcrypt';
import passport from 'passport';
import { prisma } from '../services/prisma.js';
import crypto from 'crypto';
import { generateUniqueName } from '../utils/nameUtils.js';
import { sendVerificationEmail } from '../services/emailService.js';

const SALT_ROUNDS = 10;

export const renderRegister = (req, res) => {
  res.render('pages/register', { user: req.user });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Generate unique name
    const uniqueName = await generateUniqueName(name);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name: uniqueName,
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
        emailVerified: false
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.redirect('/check-email');
  } catch (error) {
    // Handle errors (e.g., user already exists)
    console.error(error);
    res.redirect('/register');
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect('/login?error=Invalid token');
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user || user.verificationTokenExpires < new Date()) {
      return res.redirect('/login?error=Token expired or invalid');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/login?error=Verification failed');
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
