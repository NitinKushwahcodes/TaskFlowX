require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Wait for DB connection before starting the server.
// If DB fails, there's no point running the server at all.
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
});

// Catch any unhandled promise rejections and exit cleanly.
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
    process.exit(1);
});
