const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/auth/register
const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'An account with this email already exists'
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        userName: userName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword
    });

    const token = generateToken(user);

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
            id: user._id,
            userName: user.userName,
            email: user.email,
            role: user.role
        }
    });
});

// POST /api/v1/auth/login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Password field is excluded by default in the schema, so we request it explicitly.
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Keep the error message generic — telling the user whether the email
    // exists or not is an information leak (user enumeration).
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const token = generateToken(user);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            userName: user.userName,
            email: user.email,
            role: user.role
        }
    });
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware.
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            userName: req.user.userName,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt
        }
    });
});

module.exports = { registerUser, loginUser, getMe };
