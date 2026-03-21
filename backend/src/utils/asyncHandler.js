// Wraps async route handlers so any thrown error gets passed to
// the global error middleware automatically — no try/catch needed in controllers.
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
