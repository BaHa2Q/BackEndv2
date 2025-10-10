const express = require('express');
const router = express.Router();
const badWordController = require('../controllers/badWordController');
const verify  = require('../utils/auth');

router.get('/', verify, badWordController.botsGet);
router.post('/', verify, badWordController.botsPost);

module.exports = router;
