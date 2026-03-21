// Central error handler for the entire app.
// Any error passed to next(err) ends up here.
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose throws CastError when an invalid ObjectId is passed in the URL.
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Duplicate key — most commonly a duplicate email on register.
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists. Please use a different value.`;
    }

    // Schema validation errors from Mongoose.
    if (err.name === 'ValidationError') {
        statusCode = 422;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your session has expired. Please login again.';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please login again.';
    }

    const response = { success: false, message };

    // Include the stack trace in development to make debugging easier.
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    console.error(`[${statusCode}] ${message}`);
    res.status(statusCode).json(response);
};

module.exports = errorHandler;
