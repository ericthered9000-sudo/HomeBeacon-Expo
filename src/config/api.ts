// API Configuration
// For React Native, use environment variables via expo config or .env file
// Run: npx expo config --json to check env vars

// Default to production URL, can be overridden with EXPO_PUBLIC_API_URL
const DEFAULT_API_URL = 'https://lucid-growth-production-c2f0.up.railway.app';

// In development, you can set EXPO_PUBLIC_API_URL in .env file
// export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export const API_URL = DEFAULT_API_URL;
