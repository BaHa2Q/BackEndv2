const express = require('express');
const router = express.Router();
const userController = require('../controllers/ProfileController');
const verify  = require('../utils/auth')
router.get('/', verify, userController.getUserProfile);
router.get('/all', verify, userController.getAllUserProfiles);
router.put('/language', verify, userController.updateUserLanguage);
router.get('/status', verify, userController.getChannelStatus);
router.get('/channel', verify, userController.getChannelInfo);
router.get('/exists', verify, userController.checkIfUserExists);
router.get('/settings', verify, userController.getUserSettings);
router.put('/settings', verify, userController.updateUserSettings);
router.get('/favorite/:profileId', verify, userController.getFavorite);
router.get('/my-favorite', verify, userController.getMyFavorite);
router.post('/updatePrivacy', verify, userController.updatePrivacy);
router.post("/add-favorite", verify, userController.createFavoriteUser);
router.delete("/delete-favorite", verify, userController.deleteFavoriteUser);
router.get("/favorite-user", verify, userController.getFavoriteUser);
router.get("/test", verify, userController.getJoinedChannels);

module.exports = router;