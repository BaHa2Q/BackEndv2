const express = require('express');
const router = express.Router();
const userController = require('../controllers/TokenController');
const verify  = require('../utils/auth')
router.post('/verify-token', verify, userController.verifyToken);


module.exports = router;