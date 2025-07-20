// src/config/config.js
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key', //  a strong, unguessable secret
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name', //  your MongoDB connection string
};

export default config;
