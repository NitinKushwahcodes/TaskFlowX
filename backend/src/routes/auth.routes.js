const express = require('express');
const router = express.Router();

const { validateRegister, validateLogin } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { registerUser, loginUser, getMe } = require('../controllers/auth.controller');

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
