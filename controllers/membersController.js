require("dotenv").config();
const memberModel = require('../models/members');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET_KEY;
const tokenDuration = process.env.JWT_EXPIRES_IN;   
const tokenAlgorithm = process.env.JWT_ALGORITHM;

// AuthController.js
module.exports.login = function (req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Account Number and password are required' });
    }

    let memberData;

    memberModel.retrieveByUsername(username)
        .then(function (member) {
            if (!member) {
                // Throw an error instead of returning a response
                throw { status: 401, message: 'Invalid Account Number or password' };
            }
            memberData = member;
            return bcrypt.compare(password, member.password);
        })
        .then(function (isMatch) {
            if (!isMatch) {
                // Throw an error instead of returning a response
                throw { status: 401, message: 'Wrong password' };
            }

            // Create a payload containing user information and a timestamp
            const payload = {
                memberId: memberData.id, 
                username: memberData.username, 
                role: memberData.role, 
                timestamp: new Date() 
            };

            // Generate a JWT token asynchronously
            return new Promise(function (resolve, reject) {
                jwt.sign(
                    payload, // Data to encode in the token
                    secretKey, // Secret key for signing the token
                    {
                        algorithm: tokenAlgorithm, // Algorithm to use for signing
                        expiresIn: tokenDuration // Token expiration duration
                    },
                    function (err, token) {
                        if (err) reject(err); // Reject the promise if an error occurs
                        else resolve(token); // Resolve the promise with the generated token
                    }
                );
            });
        })
        .then(function (token) {
            // Send a success response with the generated token and user details
            return res.status(200).json({
                message: 'Login successful', 
                token, 
                username: memberData.username, 
                memberId: memberData.id, 
                role: memberData.role 
            });
        })
        .catch(function (error) {
            console.error('Login error:', error);
            // Check if this is our custom error object
            if (error.status && error.message) {
                return res.status(error.status).json({ message: error.message });
            }
            // For other errors, sanitize before sending
            return res.status(500).json({ message: 'An internal server error occurred' });
        });
};

module.exports.retrieveSalesOrderSummary = function (req, res) {

}

