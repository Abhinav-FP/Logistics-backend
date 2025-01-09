const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; 

    next(); 
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
