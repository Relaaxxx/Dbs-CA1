const express = require('express');
const membersController = require('../controllers/membersController');
const router = express.Router();

// The route /login uses the following middleware functions:
// 1) the membersController.login function to retrieve the user from the database

router.post("/login", membersController.login);

module.exports = router;
