const jwt = require('jsonwebtoken');

const authRequest = async (req, res, next) => {
  try {
    // Check both cookie and header
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token required to access this API",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

module.exports = authRequest;
