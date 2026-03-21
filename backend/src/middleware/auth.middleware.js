const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user.model');

// Verify the JWT and attach the user to the request.
// We do a DB lookup here instead of just trusting the token payload,
// so deleted users can't keep using old tokens.
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'User belonging to this token no longer exists.'
        });
    }

    req.user = user;
    next();
});

// Role-based access control middleware.
// Usage: router.delete('/:id', protect, authorize('admin'), handler)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not allowed to perform this action`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
