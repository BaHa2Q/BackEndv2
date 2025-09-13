const express = require('express');
const router = express.Router();
const followController = require('../controllers/commandController');
const verify  = require('../utils/auth');

// ✅ المسارات الثابتة أولاً
router.get('/', verify, followController.getCommand);
router.post('/', verify, followController.createCommand);

// ✅ مسارات التايمر
router.get('/timer', verify, followController.getTimers);
router.post('/timer', verify, followController.addTimer);
router.put('/timer/:id', verify, followController.updateTimer);
router.delete('/timer/:id', verify, followController.deleteTimer);

// ✅ العمليات التي تعتمد على ID — خليه آخر شي
router.get('/:id', verify, followController.getCommandById);
router.put('/:id', verify, followController.updateCommand);
router.delete('/:id', verify, followController.deleteCommand);

module.exports = router;
