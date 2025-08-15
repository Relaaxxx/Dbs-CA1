require("dotenv").config();
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET_KEY;

// The verifyToken function verifies the token provided in the request header.
module.exports.verifyToken = function (req, res, next) {
    // Get the token from the request header
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader === 'undefined') {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Split at the space to get the token part
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const token = bearer[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, secretKey);

        // Add user info to request
        req.user = decoded;

        // Call next middleware
        next();
    } catch (error) {
        // Handle different token errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        } else {
            console.error('Token verification error:', error);
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }
    }
};

// The verifyIsAdmin function checks if the user has the administrator role.
module.exports.verifyIsAdmin = function (req, res, next) {
    
    if (req.user.role !== 2) {
        return res.status(403).json({ error: 'Requires administrator role.' });
    }
    next();

};