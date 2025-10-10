const express = require('express');
const router = express.Router();
const badWordController = require('../controllers/badWordController');
const verify  = require('../utils/auth');

// ✅ المسارات الثابتة أولاً
router.get('/', verify, badWordController.badWordGet);
router.post('/', verify, badWordController.badWordPost);


module.exports = router;
