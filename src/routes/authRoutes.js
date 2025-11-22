import { Router } from 'express';
import { renderRegister, registerUser, renderLogin, loginUser, logoutUser, verifyEmail } from '../controllers/authController.js';
import passport from 'passport';

const router = Router();

router.get('/register', renderRegister);
router.post('/register', registerUser);
router.get('/login', renderLogin);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/verify-email', verifyEmail);
router.get('/check-email', (req, res) => res.render('pages/check-email'));

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

export default router;
