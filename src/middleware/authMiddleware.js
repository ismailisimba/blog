// Checks if user is logged in
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Checks if user has a specific role (e.g., 'ADMIN' or 'MODERATOR')
export const hasRole = (role) => {
  return (req, res, next) => {
    // First, ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }
    // Then, check if the user's role matches
    if (req.user.role === role) {
      return next();
    }
    // If roles don't match, send a forbidden error or redirect
    res.status(403).send('Forbidden: You do not have permission to access this page.');
  };
};


export const hasAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized: Please log in.');
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).send('Forbidden: You do not have permission for this action.');
  };
};

// Checks if user is banned
export const isNotBanned = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isBanned) {
    return res.status(403).send('Forbidden: Your account has been banned.');
  }
  next();
};