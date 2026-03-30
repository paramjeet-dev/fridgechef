import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These are the recommended options for Mongoose 8+
      serverSelectionTimeoutMS: 5000, // Fail fast during startup
      socketTimeoutMS: 45000,
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Log disconnection events for observability
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected — attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit process — app cannot run without DB
    process.exit(1);
  }
};
