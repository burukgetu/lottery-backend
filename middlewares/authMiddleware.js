import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateUser = (req, res, next) => {
  const token = req.cookies.token; // Get JWT from the HTTP-only cookie

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to the request object
    next(); // Proceed to next middleware or route
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
