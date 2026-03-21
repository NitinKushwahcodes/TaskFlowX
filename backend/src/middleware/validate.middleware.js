const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
    const { userName, email, password } = req.body;
    const errors = [];

    if (!userName || typeof userName !== 'string') {
        errors.push('Username is required');
    } else if (userName.trim().length < 3) {
        errors.push('Username must be at least 3 characters');
    } else if (userName.trim().length > 30) {
        errors.push('Username cannot exceed 30 characters');
    }

    if (!email || typeof email !== 'string') {
        errors.push('Email is required');
    } else if (!emailRegex.test(email.trim())) {
        errors.push('Please provide a valid email address');
    }

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    } else if (password.length > 128) {
        errors.push('Password cannot exceed 128 characters');
    }

    if (errors.length > 0) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !emailRegex.test(email.trim())) {
        errors.push('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = { validateRegister, validateLogin };
