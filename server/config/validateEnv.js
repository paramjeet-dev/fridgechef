import { cleanEnv, str, port, url } from 'envalid';

/**
 * Validates all required environment variables at startup.
 * If any are missing or malformed, the process exits with a clear error.
 * This prevents the app from starting in a broken state silently.
 */
export const validateEnv = () => {
  cleanEnv(process.env, {
    // Server
    NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
    PORT: port({ default: 5000 }),

    // Database
    MONGODB_URI: str(),

    // JWT
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '15m' }),
    REFRESH_TOKEN_SECRET: str(),
    REFRESH_TOKEN_EXPIRES_IN: str({ default: '7d' }),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),

    // FatSecret
    FATSECRET_CLIENT_ID: str(),
    FATSECRET_CLIENT_SECRET: str(),

    // Spoonacular
    SPOONACULAR_API_KEY: str(),
  });
};
