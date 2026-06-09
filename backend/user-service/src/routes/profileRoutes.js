const express = require('express');
const { me, updateProfile } = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
