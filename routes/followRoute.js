const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const verify  = require('../utils/auth');
const authenticateToken = require('../utils/auth');
router.get('/followedUsers', verify, followController.getFollowedUsers);
router.get('/followers', verify, followController.fetchFollowers);
router.get('/followed', verify, followController.fetchAllFollowedUsers);
router.get('/update-followed-users', authenticateToken, followController.updateFollowedUsers);

module.exports = router;