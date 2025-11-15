import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { prisma } from './prisma.js';

// === LOCAL STRATEGY (EMAIL/PASSWORD) ===
passport.use(new LocalStrategy({ usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));


// Add this right after the LocalStrategy
// === GOOGLE OAUTH STRATEGY ===
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find if the user already exists
      let user = await prisma.user.findUnique({
        where: { googleId: profile.id },
      });

      if (user) {
        // If user exists, return them
        return done(null, user);
      } else {
        // If user doesn't exist, create a new one
        const newUser = await prisma.user.create({
          data: {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            // We mark email as verified since it comes from Google
            emailVerified: true,
          },
        });
        return done(null, newUser);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));




// === SERIALIZE & DESERIALIZE USER ===
// This saves the user ID to the session cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// This retrieves the full user object from the DB on subsequent requests
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
